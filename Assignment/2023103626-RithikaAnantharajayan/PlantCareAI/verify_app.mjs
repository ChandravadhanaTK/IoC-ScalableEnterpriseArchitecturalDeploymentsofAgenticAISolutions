// Automated End-to-End Verification Test Suite for PlantCare AI

// 1. Mock LocalStorage in Node environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

// Mock performance.now
if (!globalThis.performance) {
  globalThis.performance = { now: () => Date.now() };
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('--- PlantCare AI Verification Suite ---');

  // Test 1: Date helpers and status computation
  console.log('\n[1] Testing Plant Status Computation:');
  const { formatDate, addDays, computePlantStatus } = await import('../src/services/plantService.ts');
  const today = new Date();
  const todayStr = formatDate(today);
  const pastStr = addDays(todayStr, -3);
  const tomorrowStr = addDays(todayStr, 1);
  const futureStr = addDays(todayStr, 8);

  assert(computePlantStatus(pastStr) === 'Overdue', 'Past date returns Overdue');
  assert(computePlantStatus(todayStr) === 'Care Due', 'Today date returns Care Due');
  assert(computePlantStatus(tomorrowStr) === 'Care Due', 'Tomorrow date returns Care Due');
  assert(computePlantStatus(futureStr) === 'Healthy', 'Future date returns Healthy');

  // Test 2: Sample Data Loader
  console.log('\n[2] Testing Sample Data Integrity:');
  const sampleUserId = 'test-user-rithika';
  const { getSamplePlantsData } = await import('../src/services/sampleData.ts');
  const sample = getSamplePlantsData(sampleUserId);

  assert(sample.plants.length === 4, 'Generates exactly 4 sample plants');
  assert(sample.plants.some(p => p.name === 'Money Plant'), 'Contains Money Plant');
  assert(sample.plants.some(p => p.name === 'Tulsi'), 'Contains Tulsi');
  assert(sample.plants.some(p => p.name === 'Aloe Vera'), 'Contains Aloe Vera');
  assert(sample.plants.some(p => p.name === 'Snake Plant'), 'Contains Snake Plant');
  assert(sample.tasks.length >= 4, 'Generates realistic sample care tasks');
  assert(sample.records.length >= 4, 'Generates realistic past care history');

  // Test 3: Plant Operations & Watering Flow
  console.log('\n[3] Testing Plant CRUD & Watering Recalibration:');
  const { savePlant, fetchUserPlants, markPlantAsWatered, deletePlant } = await import('../src/services/plantService.ts');
  
  // Save sample plants for User A
  for (const p of sample.plants) {
    await savePlant(p);
  }
  const loadedPlants = await fetchUserPlants(sampleUserId);
  assert(loadedPlants.length === 4, `Successfully persisted 4 plants for user ${sampleUserId}`);

  // Test Mark as Watered
  const moneyPlant = loadedPlants.find(p => p.name === 'Money Plant');
  const waterResult = await markPlantAsWatered(moneyPlant, 'Test watering with organic fertilizer');
  
  assert(waterResult.plant.lastWatered === todayStr, 'Last watered date updated to today');
  assert(waterResult.plant.status === 'Healthy', 'Status reset to Healthy after watering');
  assert(waterResult.record.action === 'Watered', 'CareRecord logged with action "Watered"');
  assert(waterResult.nextTask.dueDate === addDays(todayStr, moneyPlant.wateringFrequency), 'Next watering task accurately scheduled');

  // Test 4: Task Timeline Grouping
  console.log('\n[4] Testing Care Planner Timeline Bucketing:');
  const { groupTasksByTimeline } = await import('../src/services/careTaskService.ts');
  const testTasks = [
    { id: '1', userId: sampleUserId, plantId: 'p1', plantName: 'Aloe', taskType: 'Water', dueDate: pastStr, status: 'pending', createdAt: '' },
    { id: '2', userId: sampleUserId, plantId: 'p2', plantName: 'Tulsi', taskType: 'Water', dueDate: todayStr, status: 'pending', createdAt: '' },
    { id: '3', userId: sampleUserId, plantId: 'p3', plantName: 'Money', taskType: 'Check Soil', dueDate: tomorrowStr, status: 'pending', createdAt: '' },
    { id: '4', userId: sampleUserId, plantId: 'p4', plantName: 'Snake', taskType: 'Water', dueDate: addDays(todayStr, 3), status: 'pending', createdAt: '' },
    { id: '5', userId: sampleUserId, plantId: 'p5', plantName: 'Fern', taskType: 'Prune', dueDate: futureStr, status: 'pending', createdAt: '' },
    { id: '6', userId: sampleUserId, plantId: 'p6', plantName: 'Lily', taskType: 'Water', dueDate: todayStr, status: 'completed', createdAt: '' },
  ];

  const grouped = groupTasksByTimeline(testTasks);
  assert(grouped.overdue.length === 1 && grouped.overdue[0].plantName === 'Aloe', 'Overdue task categorized correctly');
  assert(grouped.today.length === 1 && grouped.today[0].plantName === 'Tulsi', 'Today task categorized correctly');
  assert(grouped.tomorrow.length === 1 && grouped.tomorrow[0].plantName === 'Money', 'Tomorrow task categorized correctly');
  assert(grouped.in3Days.length === 1 && grouped.in3Days[0].plantName === 'Snake', 'In 3 Days task categorized correctly');
  assert(grouped.later.length === 1 && grouped.later[0].plantName === 'Fern', 'Later task categorized correctly');
  assert(grouped.completed.length === 1 && grouped.completed[0].plantName === 'Lily', 'Completed task separated');

  // Test 5: Agentic AI Assistant Behavior & Tools
  console.log('\n[5] Testing Agentic AI Assistant Tools & Reasoning:');
  const { runAgentQuery, executeConfirmedAction } = await import('../src/services/agentService.ts');

  // Scenario 1: Plants needing attention
  const attentionQuery = await runAgentQuery('Which of my plants need attention today?', sampleUserId, []);
  assert(attentionQuery.role === 'assistant', 'Agent responds with assistant role');
  assert(attentionQuery.toolsExecuted.some(t => t.tool === 'getUserPlants'), 'Tool getUserPlants invoked');
  assert(attentionQuery.toolsExecuted.some(t => t.tool === 'getUpcomingCareTasks'), 'Tool getUpcomingCareTasks invoked');
  assert(attentionQuery.content.includes('Plant Attention Report'), 'Generates formatted Plant Attention Report');

  // Scenario 2: Vacation Planning (7 days) with Human Confirmation
  const vacationQuery = await runAgentQuery("I'm going on vacation for 7 days. What should I do?", sampleUserId, []);
  assert(vacationQuery.toolsExecuted.some(t => t.tool === 'createVacationPlan'), 'Tool createVacationPlan invoked');
  assert(vacationQuery.pendingAction !== undefined, 'Returns pendingAction requiring human approval');
  assert(vacationQuery.pendingAction.actionType === 'CREATE_VACATION_PLAN', 'Action type is CREATE_VACATION_PLAN');
  assert(vacationQuery.pendingAction.status === 'pending', 'Action starts in pending state');

  // Test Human Confirmation Execution
  const confirmResult = await executeConfirmedAction(vacationQuery.pendingAction, sampleUserId);
  assert(confirmResult.success === true, 'Confirmed vacation plan committed to tasks successfully');

  // Scenario 3: Missed watering
  const missedQuery = await runAgentQuery('I forgot to water my Money Plant.', sampleUserId, []);
  assert(missedQuery.toolsExecuted.some(t => t.tool === 'getPlantDetails'), 'Tool getPlantDetails invoked for Money Plant');
  assert(missedQuery.pendingAction !== undefined, 'Missed watering offers schedule update confirmation');
  assert(missedQuery.pendingAction.actionType === 'UPDATE_CARE_SCHEDULE', 'Action type is UPDATE_CARE_SCHEDULE');

  // Scenario 4: Cautious diagnostic
  const diagQuery = await runAgentQuery('Why are my Money Plant leaves turning yellow?', sampleUserId, []);
  assert(diagQuery.isDiagnostic === true, 'Diagnostic inquiry flagged with isDiagnostic=true');
  assert(
    diagQuery.content.includes('possible cause') || diagQuery.content.includes('sometimes indicate') || diagQuery.content.includes('Consider checking'),
    'Cautious botanical diagnostic language utilized'
  );

  // Test 6: User Data Isolation (Multi-tenant security)
  console.log('\n[6] Testing Multi-User Data Isolation:');
  const userB_Id = 'different-user-charlie';
  const userB_Plants = await fetchUserPlants(userB_Id);
  assert(userB_Plants.length === 0, 'User B cannot see User A plants (Zero leakage)');

  console.log(`\n=========================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`=========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});