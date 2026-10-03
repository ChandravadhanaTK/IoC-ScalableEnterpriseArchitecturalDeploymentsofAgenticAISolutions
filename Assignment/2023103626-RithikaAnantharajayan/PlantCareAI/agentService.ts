import { Plant, CareTask, CareRecord } from '../types';
import { AgentChatMessage, PendingAction, ToolExecutionRecord } from '../types/agent';
import { fetchUserPlants, savePlant, formatDate, addDays, computePlantStatus } from './plantService';
import { fetchUserTasks, saveCareTask } from './careTaskService';
import { fetchUserRecords, addCareRecord } from './careRecordService';
import { logAIInteraction } from './monitoringService';
import { getGeminiClient } from '../config/gemini';

// --- AGENT TOOLS IMPLEMENTATION ---

export interface AgentContext {
  userId: string;
  plants: Plant[];
  tasks: CareTask[];
  records: CareRecord[];
}

export const executeAgentTools = {
  getUserPlants: (context: AgentContext): { plants: Plant[]; summary: string } => {
    const list = context.plants;
    const dueCount = list.filter(p => p.status === 'Care Due' || p.status === 'Overdue').length;
    return {
      plants: list,
      summary: `Retrieved ${list.length} registered plants (${dueCount} requiring attention).`,
    };
  },

  getPlantDetails: (context: AgentContext, plantNameOrId: string): { plant?: Plant; summary: string } => {
    const term = plantNameOrId.toLowerCase();
    const plant = context.plants.find(
      p => p.id === plantNameOrId || p.name.toLowerCase().includes(term) || p.species.toLowerCase().includes(term)
    );
    if (!plant) {
      return { summary: `No plant found matching '${plantNameOrId}'.` };
    }
    return {
      plant,
      summary: `Found ${plant.name} (${plant.species}, ${plant.environment}, watered every ${plant.wateringFrequency}d, next: ${plant.nextWateringDate}, status: ${plant.status}).`,
    };
  },

  getUpcomingCareTasks: (context: AgentContext): { tasks: CareTask[]; summary: string } => {
    const pendingTasks = context.tasks.filter(t => t.status === 'pending');
    return {
      tasks: pendingTasks,
      summary: `Retrieved ${pendingTasks.length} pending tasks.`,
    };
  },

  getCareHistory: (context: AgentContext, plantId?: string): { records: CareRecord[]; summary: string } => {
    let recs = context.records;
    if (plantId) {
      recs = recs.filter(r => r.plantId === plantId);
    }
    return {
      records: recs,
      summary: `Retrieved ${recs.length} historical care logs${plantId ? ` for plant ${plantId}` : ''}.`,
    };
  },

  createVacationPlan: (
    context: AgentContext, 
    vacationDays: number
  ): { 
    prepTasks: string[]; 
    plantsAffected: Plant[]; 
    proposedTasks: Partial<CareTask>[]; 
    summary: string 
  } => {
    const todayStr = formatDate(new Date());
    const returnDateStr = addDays(todayStr, vacationDays);
    const affected: Plant[] = [];
    const proposed: Partial<CareTask>[] = [];
    const prepList: string[] = [];

    context.plants.forEach(plant => {
      // Check if plant will need water during the absence
      if (plant.nextWateringDate <= returnDateStr) {
        affected.push(plant);
        if (plant.environment === 'indoor') {
          prepList.push(`Deep soak and move ${plant.name} slightly away from direct hot windows.`);
        } else {
          prepList.push(`Water ${plant.name} on departure morning and set up a moisture tray or self-watering spike.`);
        }

        proposed.push({
          userId: context.userId,
          plantId: plant.id,
          plantName: plant.name,
          taskType: 'Water',
          dueDate: todayStr,
          status: 'pending',
          notes: `Pre-vacation preparation for ${vacationDays}-day absence.`,
        });

        proposed.push({
          userId: context.userId,
          plantId: plant.id,
          plantName: plant.name,
          taskType: 'Check Soil',
          dueDate: returnDateStr,
          status: 'pending',
          notes: `Post-vacation health & moisture check upon return.`,
        });
      }
    });

    return {
      prepTasks: prepList,
      plantsAffected: affected,
      proposedTasks: proposed,
      summary: `Evaluated ${context.plants.length} plants for ${vacationDays} days absence. ${affected.length} plants need care during this window.`,
    };
  },

  createCarePlan: (
    context: AgentContext
  ): { proposedTasks: Partial<CareTask>[]; summary: string } => {
    const todayStr = formatDate(new Date());
    const proposed: Partial<CareTask>[] = [];

    context.plants.forEach(plant => {
      // Create soil check 1 day before due date
      const checkDate = addDays(plant.nextWateringDate, -1);
      if (checkDate >= todayStr) {
        proposed.push({
          userId: context.userId,
          plantId: plant.id,
          plantName: plant.name,
          taskType: 'Check Soil',
          dueDate: checkDate,
          status: 'pending',
          notes: 'Pre-watering moisture assessment.',
        });
      }
      // Scheduled water
      proposed.push({
        userId: context.userId,
        plantId: plant.id,
        plantName: plant.name,
        taskType: 'Water',
        dueDate: plant.nextWateringDate,
        status: 'pending',
        notes: `Regular cadence every ${plant.wateringFrequency} days.`,
      });
    });

    return {
      proposedTasks: proposed,
      summary: `Synthesized optimized care plan with ${proposed.length} scheduled tasks across ${context.plants.length} plants.`,
    };
  }
};

// --- AGENT REASONING ENGINE ---

export const runAgentQuery = async (
  prompt: string,
  userId: string,
  _history: AgentChatMessage[]
): Promise<AgentChatMessage> => {
  const startTime = performance.now();
  const lowerPrompt = prompt.toLowerCase();
  
  // 1. Gather live context
  const plants = await fetchUserPlants(userId);
  const tasks = await fetchUserTasks(userId);
  const records = await fetchUserRecords(userId);
  const context: AgentContext = { userId, plants, tasks, records };

  const toolsExecuted: ToolExecutionRecord[] = [];
  let responseContent = '';
  let pendingAction: PendingAction | undefined = undefined;
  let isDiagnostic = false;
  let requestType = 'general_inquiry';

  // --- AGENTIC INTENT MATCHING & TOOL EXECUTION ---

  // Scenario 1: Plants needing attention / overdue / today's care
  if (
    lowerPrompt.includes('need attention') ||
    lowerPrompt.includes('attention today') ||
    lowerPrompt.includes('overdue') ||
    lowerPrompt.includes('what should i water') ||
    lowerPrompt.includes('care due')
  ) {
    requestType = 'plants_needing_attention';
    const plantsRes = executeAgentTools.getUserPlants(context);
    toolsExecuted.push({
      tool: 'getUserPlants',
      resultSummary: plantsRes.summary,
      timestamp: new Date().toLocaleTimeString(),
    });

    const tasksRes = executeAgentTools.getUpcomingCareTasks(context);
    toolsExecuted.push({
      tool: 'getUpcomingCareTasks',
      resultSummary: tasksRes.summary,
      timestamp: new Date().toLocaleTimeString(),
    });

    const todayStr = formatDate(new Date());
    const overduePlants = plants.filter(p => p.status === 'Overdue');
    const duePlants = plants.filter(p => p.status === 'Care Due');

    responseContent = `### ?? Plant Attention Report (${todayStr})

Here is the current care status of your plants based on your recorded schedules:

`;

    if (overduePlants.length > 0) {
      responseContent += `**?? Overdue Care Required (${overduePlants.length}):**\n`;
      overduePlants.forEach(p => {
        responseContent += `- **${p.name}** (${p.species}): Last watered on **${p.lastWatered}** (watering cycle is every ${p.wateringFrequency} days). Recommended action: *Check soil immediately and water thoroughly if dry.*\n`;
      });
      responseContent += `\n`;
    }

    if (duePlants.length > 0) {
      responseContent += `**? Due for Care Today / Soon (${duePlants.length}):**\n`;
      duePlants.forEach(p => {
        responseContent += `- **${p.name}** (${p.species}, ${p.location}): Next scheduled care is **${p.nextWateringDate}**. Recommended action: *Inspect topsoil moisture.*\n`;
      });
      responseContent += `\n`;
    }

    if (overduePlants.length === 0 && duePlants.length === 0) {
      responseContent += `? **All ${plants.length} of your plants are currently well-hydrated and on schedule!** Next upcoming task will be for **${plants[0]?.name || 'your plants'}** on **${plants[0]?.nextWateringDate || 'future date'}**.\n`;
    } else {
      responseContent += `?? **Agent Recommendation:** You can click **"Mark as Watered"** in the Dashboard or Plant Details to immediately register the care event and recalculate the next due cycle.`;
    }
  }

  // Scenario 2: Vacation Planning (e.g. "I'm going on vacation for 7 days")
  else if (
    lowerPrompt.includes('vacation') ||
    lowerPrompt.includes('going away') ||
    lowerPrompt.includes('holiday') ||
    lowerPrompt.includes('travel')
  ) {
    requestType = 'vacation_planning';
    // Extract number of days or default to 7
    const match = lowerPrompt.match(/(\d+)\s*(days?|weeks?)/);
    let days = 7;
    if (match) {
      const val = parseInt(match[1]);
      days = match[2].startsWith('week') ? val * 7 : val;
    }

    const plantsRes = executeAgentTools.getUserPlants(context);
    toolsExecuted.push({
      tool: 'getUserPlants',
      resultSummary: plantsRes.summary,
      timestamp: new Date().toLocaleTimeString(),
    });

    const vacRes = executeAgentTools.createVacationPlan(context, days);
    toolsExecuted.push({
      tool: 'createVacationPlan',
      input: { days },
      resultSummary: vacRes.summary,
      timestamp: new Date().toLocaleTimeString(),
    });

    responseContent = `### ?? ${days}-Day Vacation Care Plan

I analyzed your collection against your ${days}-day travel duration.

**Analysis Summary:**
- **Plants needing attention during travel:** ${vacRes.plantsAffected.length} of ${plants.length} plants.
- **Key Affected Plants:** ${vacRes.plantsAffected.map(p => p.name).join(', ') || 'None'}.

**Recommended Actions Before Leaving:**
${vacRes.prepTasks.map(t => `- ${t}`).join('\n')}

**Proposed Schedule:**
I have mapped out **${vacRes.proposedTasks.length} pre-departure and return monitoring tasks** to safeguard your plants while you are away.
`;

    // Human Confirmation required to commit tasks
    pendingAction = {
      id: 'action-' + Date.now(),
      actionType: 'CREATE_VACATION_PLAN',
      title: `Schedule ${days}-Day Vacation Care Tasks`,
      description: `Add ${vacRes.proposedTasks.length} automated pre-vacation preparation and return inspection tasks to your Care Planner?`,
      payload: { tasks: vacRes.proposedTasks },
      status: 'pending',
    };
  }

  // Scenario 3: Missed watering / Forgot to water (e.g. "I forgot to water my Money Plant")
  else if (
    lowerPrompt.includes('forgot to water') ||
    lowerPrompt.includes('missed watering') ||
    lowerPrompt.includes("didn't water") ||
    lowerPrompt.includes('late watering')
  ) {
    requestType = 'missed_watering_adjustment';
    // Identify target plant
    let targetPlant = plants.find(p => lowerPrompt.includes(p.name.toLowerCase()));
    if (!targetPlant && plants.length > 0) {
      targetPlant = plants[0]; // fallback
    }

    if (targetPlant) {
      const details = executeAgentTools.getPlantDetails(context, targetPlant.id);
      toolsExecuted.push({
        tool: 'getPlantDetails',
        input: { plantId: targetPlant.id },
        resultSummary: details.summary,
        timestamp: new Date().toLocaleTimeString(),
      });

      const todayStr = formatDate(new Date());
      const newNextWatering = addDays(todayStr, targetPlant.wateringFrequency);

      responseContent = `### ?? Missed Watering Assessment: ${targetPlant.name}

I checked the records for your **${targetPlant.name}**:
- **Last recorded watering:** ${targetPlant.lastWatered}
- **Current schedule interval:** Every ${targetPlant.wateringFrequency} days
- **Original due date:** ${targetPlant.nextWateringDate}

**Immediate Recommended Care Steps:**
1. Check the soil moisture by inserting a finger 2 inches into the soil.
2. If completely dry, give it a moderate, thorough watering until water drains from the bottom.
3. Empty any drainage saucer after 15 minutes to avoid root waterlogging.
4. Avoid heavy fertilizing immediately after drought stress.

I can automatically update your **${targetPlant.name}** care schedule to mark it watered today and reset its next care cycle to **${newNextWatering}**.
`;

      // Human Confirmation required
      pendingAction = {
        id: 'action-' + Date.now(),
        actionType: 'UPDATE_CARE_SCHEDULE',
        title: `Update ${targetPlant.name} Care Schedule`,
        description: `Mark ${targetPlant.name} as watered today (${todayStr}) and advance next watering date to ${newNextWatering}?`,
        payload: {
          plantId: targetPlant.id,
          wateredDate: todayStr,
          nextWateringDate: newNextWatering,
        },
        status: 'pending',
      };
    } else {
      responseContent = "I couldn't identify which plant you missed watering. Could you specify the plant name, such as your Money Plant, Tulsi, or Aloe Vera?";
    }
  }

  // Scenario 4: Cautious Diagnostic Inquiry (e.g. "Why are my Money Plant leaves turning yellow?")
  else if (
    lowerPrompt.includes('yellow') ||
    lowerPrompt.includes('brown') ||
    lowerPrompt.includes('dropping leaves') ||
    lowerPrompt.includes('curling') ||
    lowerPrompt.includes('sick') ||
    lowerPrompt.includes('dying') ||
    lowerPrompt.includes('spots')
  ) {
    requestType = 'plant_diagnostic';
    isDiagnostic = true;

    let targetPlant = plants.find(p => lowerPrompt.includes(p.name.toLowerCase()));
    if (targetPlant) {
      const details = executeAgentTools.getPlantDetails(context, targetPlant.id);
      toolsExecuted.push({
        tool: 'getPlantDetails',
        input: { plantId: targetPlant.id },
        resultSummary: details.summary,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    const plantName = targetPlant ? targetPlant.name : 'plant';

    responseContent = `### ?? Plant Health Analysis: Leaf Discoloration

*(Note: Without laboratory or direct visual inspection, this assessment highlights the most common causes and practical checks.)*

For **${plantName}**, yellowing foliage is typically a stress indicator with several possible causes:

1. **Moisture Imbalance (Most Common):**
   - *One possible cause* is overwatering, leading to oxygen-deprived root tissue. 
   - *Consider checking:* Is the lower soil soggy or dense? Ensure the pot has functional drainage holes.
   - Conversely, chronic underwatering can cause older lower leaves to turn pale yellow and drop.

2. **Lighting Exposure:**
   - *This can sometimes indicate* insufficient indirect sunlight, causing the plant to shed energy-demanding leaves.
   - Sudden shifts to harsh, direct afternoon sun can also cause pale scorched patches.

3. **Nutrient Depletion or Soil Compactness:**
   - In older potting mixes, nitrogen or micronutrient deficiency can lead to chlorosis (yellowing between veins).

**Recommended Practical Actions:**
- Feel the soil 2 inches below the surface before applying water.
- Check that the drainage tray is never sitting in standing stagnant water.
- Gently snip away fully yellowed leaves at the stem base so the plant directs energy to healthy foliage.
`;
  }

  // Scenario 5: Create Full Care Plan
  else if (
    lowerPrompt.includes('create care plan') ||
    lowerPrompt.includes('generate care plan') ||
    lowerPrompt.includes('care schedule')
  ) {
    requestType = 'care_plan_generation';
    const plantsRes = executeAgentTools.getUserPlants(context);
    toolsExecuted.push({
      tool: 'getUserPlants',
      resultSummary: plantsRes.summary,
      timestamp: new Date().toLocaleTimeString(),
    });

    const planRes = executeAgentTools.createCarePlan(context);
    toolsExecuted.push({
      tool: 'createCarePlan',
      resultSummary: planRes.summary,
      timestamp: new Date().toLocaleTimeString(),
    });

    responseContent = `### ?? Personalized Care Plan Generated

I have generated an optimized care plan tailored to your **${plants.length} plants**:

${plants.map(p => `- **${p.name}** (${p.environment}, ${p.location}): Water every ${p.wateringFrequency} days. Next scheduled: **${p.nextWateringDate}**`).join('\n')}

**Proposed Routine:**
- Scheduled regular watering cycles aligned with species transpiration needs.
- Pre-watering soil moisture check tasks scheduled 24 hours prior to each hydration cycle to prevent overwatering.
`;

    pendingAction = {
      id: 'action-' + Date.now(),
      actionType: 'CREATE_CARE_PLAN',
      title: 'Apply Care Plan to Planner',
      description: `Add ${planRes.proposedTasks.length} optimized care and moisture-check tasks to your upcoming Care Planner?`,
      payload: { tasks: planRes.proposedTasks },
      status: 'pending',
    };
  }

  // Scenario 6: Specific Plant Care Inquiry (e.g. "How should I care for my Money Plant?")
  else if (
    lowerPrompt.includes('how to care') ||
    lowerPrompt.includes('how should i care') ||
    lowerPrompt.includes('care for')
  ) {
    requestType = 'plant_care_guidance';
    let targetPlant = plants.find(p => lowerPrompt.includes(p.name.toLowerCase()));
    if (!targetPlant && plants.length > 0) targetPlant = plants[0];

    if (targetPlant) {
      const details = executeAgentTools.getPlantDetails(context, targetPlant.id);
      toolsExecuted.push({
        tool: 'getPlantDetails',
        input: { plantId: targetPlant.id },
        resultSummary: details.summary,
        timestamp: new Date().toLocaleTimeString(),
      });

      responseContent = `### ?? Care Guide: ${targetPlant.name} (${targetPlant.species})

Here is the personalized care profile for your **${targetPlant.name}** located at **${targetPlant.location}**:

- **Watering Cadence:** Every ${targetPlant.wateringFrequency} days. Next due on **${targetPlant.nextWateringDate}**.
- **Environment:** ${targetPlant.environment.toUpperCase()}
- **Light Requirement:** Bright indirect sunlight. Avoid prolonged direct harsh midday sun.
- **Soil & Drainage:** Well-aerated potting mix with perlite or peat. Ensure pot has active drainage.
- **Current Status:** **${targetPlant.status}** (Last watered: ${targetPlant.lastWatered})
- **Special Care Notes:** ${targetPlant.notes || 'None recorded yet.'}
`;
    } else {
      responseContent = "I couldn't locate that plant in your collection. You can add it in 'My Plants' or ask about one of your registered plants.";
    }
  }

  // Fallback: Check if Gemini Client is available for external conversational queries
  else {
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const systemPrompt = `You are PlantCare AI Assistant, an expert agentic plant care assistant.
User's Registered Plants: ${JSON.stringify(plants.map(p => ({ name: p.name, species: p.species, nextWateringDate: p.nextWateringDate, status: p.status })))}
Upcoming Tasks: ${JSON.stringify(tasks.slice(0, 5))}
Always provide helpful, nature-focused, cautious plant care guidance. If diagnosing problems, use cautious terminology like "One possible cause...", "This can sometimes indicate...", "Consider checking...". Never claim to diagnose with certainty.`;

        const result = await model.generateContent([`${systemPrompt}\n\nUser Question: ${prompt}`]);
        responseContent = result.response.text();
        toolsExecuted.push({
          tool: 'getUserPlants',
          resultSummary: `Synthesized response using live plant context & Gemini model.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (err: any) {
        console.warn('Gemini API call failed, generating localized agent response:', err);
        responseContent = `I reviewed your plant care records. You currently have ${plants.length} plants registered. How else can I assist with your watering schedules, vacation preparation, or plant health?`;
      }
    } else {
      responseContent = `I received your query: "${prompt}".

I am actively tracking your **${plants.length} plants** and **${tasks.filter(t => t.status === 'pending').length} pending care tasks**.
You can ask me to:
- *"Which of my plants need attention today?"*
- *"I'm going on vacation for 7 days. What should I do?"*
- *"I forgot to water my Money Plant."*
- *"Why are my plant's leaves turning yellow?"*
- *"Create a care plan for my plants."*`;
    }
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Log AI Interaction telemetry for monitoring
  await logAIInteraction({
    userId,
    requestType,
    promptSummary: prompt.length > 80 ? prompt.substring(0, 77) + '...' : prompt,
    timestamp: new Date().toISOString(),
    success: true,
    durationMs,
    toolsUsed: toolsExecuted.map(t => t.tool),
    actionConfirmed: false,
  });

  return {
    id: 'msg-' + Date.now(),
    role: 'assistant',
    content: responseContent,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    toolsExecuted,
    pendingAction,
    isDiagnostic,
  };
};

// --- COMMIT CONFIRMED AGENT ACTION ---
export const executeConfirmedAction = async (
  action: PendingAction,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (action.actionType === 'UPDATE_CARE_SCHEDULE') {
      const { plantId, wateredDate, nextWateringDate } = action.payload;
      const plants = await fetchUserPlants(userId);
      const target = plants.find(p => p.id === plantId);
      if (!target) return { success: false, message: 'Plant not found.' };

      const updatedPlant: Plant = {
        ...target,
        lastWatered: wateredDate,
        nextWateringDate: nextWateringDate,
        status: computePlantStatus(nextWateringDate),
      };
      await savePlant(updatedPlant);

      // Add Care Record
      const newRecord: CareRecord = {
        id: 'rec-' + Date.now(),
        userId,
        plantId: target.id,
        plantName: target.name,
        action: 'Watered (Agent Rescheduled)',
        date: wateredDate,
        notes: 'Watering rescheduled and confirmed via AI Assistant.',
        createdAt: new Date().toISOString(),
      };
      await addCareRecord(newRecord);

      return {
        success: true,
        message: `Successfully marked ${target.name} as watered on ${wateredDate}. Next scheduled watering is now set to ${nextWateringDate}.`,
      };
    }

    if (action.actionType === 'CREATE_VACATION_PLAN' || action.actionType === 'CREATE_CARE_PLAN') {
      const { tasks } = action.payload;
      for (const t of tasks) {
        const fullTask: CareTask = {
          id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          userId,
          plantId: t.plantId,
          plantName: t.plantName,
          taskType: t.taskType,
          dueDate: t.dueDate,
          status: 'pending',
          notes: t.notes || 'Created by AI Assistant.',
          createdAt: new Date().toISOString(),
        };
        await saveCareTask(fullTask);
      }

      return {
        success: true,
        message: `Successfully scheduled ${tasks.length} tasks in your Care Planner.`,
      };
    }

    return { success: false, message: 'Unknown action type.' };
  } catch (err: any) {
    console.error('Error executing confirmed action:', err);
    return { success: false, message: `Failed to execute action: ${err.message}` };
  }
};
