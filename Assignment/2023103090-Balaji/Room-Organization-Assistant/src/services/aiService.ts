import type { CleanupPlan, CleanupTask, Priority, TaskStatus } from '../types';

const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getApiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY ?? '').trim();
}

function createFallbackPlan(roomDescription: string): CleanupPlan {
  const cleaned = roomDescription.trim();

  const fallbackTasks: CleanupTask[] = [
    {
      id: 'task-1',
      title: 'Start with the biggest surface area',
      description: 'Clear the most visible clutter first so the room feels instantly calmer.',
      priority: 'HIGH',
      estimatedMinutes: 10,
      status: 'NOT_STARTED',
    },
    {
      id: 'task-2',
      title: 'Tidy the bed and nearby floor space',
      description: 'Make the bed, fold blankets, and pick up any items on the floor around it.',
      priority: 'HIGH',
      estimatedMinutes: 12,
      status: 'NOT_STARTED',
    },
    {
      id: 'task-3',
      title: 'Organize the desk area',
      description: 'Sort papers, return supplies to drawers, and clear away any extra items.',
      priority: 'MEDIUM',
      estimatedMinutes: 8,
      status: 'NOT_STARTED',
    },
    {
      id: 'task-4',
      title: 'Reset the chair and nearby floor zone',
      description: `Put away loose clothing or items near the chair based on the room description: "${cleaned}".`,
      priority: 'MEDIUM',
      estimatedMinutes: 6,
      status: 'NOT_STARTED',
    },
  ];

  return {
    summary: `A focused plan to restore order in the room based on: "${cleaned}".`,
    totalEstimatedMinutes: fallbackTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
    tasks: fallbackTasks,
  };
}

function normalizePlan(plan: unknown): CleanupPlan {
  const value = (plan ?? {}) as Record<string, unknown>;
  const tasks = Array.isArray(value.tasks) ? (value.tasks as Record<string, unknown>[]) : [];

  const normalizedTasks = tasks.map((task, index) => {
    const priority = ['HIGH', 'MEDIUM', 'LOW'].includes(String(task.priority ?? ''))
      ? (String(task.priority) as Priority)
      : 'MEDIUM';

    const status = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(String(task.status ?? ''))
      ? (String(task.status) as TaskStatus)
      : 'NOT_STARTED';

    return {
      id: String(task.id ?? `task-${index + 1}`),
      title: String(task.title ?? `Task ${index + 1}`),
      description: String(task.description ?? 'No description provided.'),
      priority,
      estimatedMinutes: Math.max(1, Number(task.estimatedMinutes ?? task.estimated_minutes ?? 5)),
      status,
    } satisfies CleanupTask;
  });

  const totalFromTasks = normalizedTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

  return {
    summary: String(value.summary ?? 'A room cleanup plan is ready.'),
    totalEstimatedMinutes: Math.max(0, Number(value.totalEstimatedMinutes ?? totalFromTasks)),
    tasks: normalizedTasks,
  };
}

function parseGeminiJson(rawText: string): unknown {
  const trimmedResponse = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(trimmedResponse);
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  if (import.meta.env.DEV) {
    console.info('Gemini request model:', GEMINI_MODEL);
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }],
      }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (import.meta.env.DEV) {
      console.error('Gemini API HTTP failure', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
    }

    throw new Error(`Gemini API request failed: ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
}

export async function generateCleanupPlan(roomDescription: string): Promise<CleanupPlan> {
  const trimmedDescription = roomDescription.trim();

  if (!trimmedDescription) {
    throw new Error('Room description is required.');
  }

  try {
    const prompt = `
      You are helping a user organize a messy room.
      Create a concise but practical cleanup plan based only on the user's room description.
      Return valid JSON only with this exact structure:
      {
        "summary": "Short summary of the room condition",
        "totalEstimatedMinutes": 40,
        "tasks": [
          {
            "title": "Task title",
            "description": "Task description",
            "priority": "HIGH",
            "estimatedMinutes": 5
          }
        ]
      }

      Rules:
      - Do not invent items or objects unless they are clearly implied by the room description.
      - Keep tasks realistic and actionable.
      - Use only HIGH, MEDIUM, or LOW for priority.
      - Include at least 3 tasks.
      - Estimate the total time as the sum of task durations.
      - Never include markdown fences.

      Room description:
      ${trimmedDescription}
    `;

    const rawResponse = await callGemini(prompt);
    const parsedResponse = parseGeminiJson(rawResponse) as Record<string, unknown>;
    const normalizedPlan = normalizePlan(parsedResponse);

    if (!normalizedPlan.tasks.length) {
      throw new Error('No tasks were returned from the Gemini response.');
    }

    return normalizedPlan;
  } catch (error) {
    console.error('Gemini cleanup generation failed.', error);
    throw new Error('Unable to generate your cleanup plan. Please try again.');
  }
}

export async function askAssistant(
  question: string,
  roomDescription: string,
  cleanupPlan: CleanupPlan,
): Promise<string> {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) {
    throw new Error('Question is required.');
  }

  try {
    const prompt = `
      You are a helpful room organization assistant.
      Answer only using the room description and the current cleanup plan.
      Do not invent objects, tasks, or items the user did not mention.
      If the user mentions a time limit, recommend the highest-priority tasks that fit.
      If the user says a task is already done, acknowledge the completion and suggest the next useful step.

      Room description:
      ${roomDescription || 'No room description provided.'}

      Current cleanup plan:
      ${JSON.stringify(cleanupPlan, null, 2)}

      User question:
      ${trimmedQuestion}

      Give a brief, supportive response that references the current tasks and room context.
    `;

    const rawResponse = await callGemini(prompt);
    return rawResponse.trim();
  } catch (error) {
    console.error('Gemini assistant response failed.', error);
    throw new Error('I could not answer that question right now. Please try again.');
  }
}

export function getFallbackPlan(roomDescription: string): CleanupPlan {
  return createFallbackPlan(roomDescription);
}
