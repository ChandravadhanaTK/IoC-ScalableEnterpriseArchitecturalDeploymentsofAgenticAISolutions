// Automated Verification Script for OfficeOps Multi-Agent System
import { RequirementAgent } from './src/agents/requirementAgent.ts';
import { ResourceAgent } from './src/agents/resourceAgent.ts';
import { SchedulingAgent } from './src/agents/schedulingAgent.ts';
import { RecommendationAgent } from './src/agents/recommendationAgent.ts';
import { AgentOrchestrator } from './src/services/orchestrator.ts';
import { storage } from './src/services/storage.ts';
import { INITIAL_ROOMS, INITIAL_RESERVATIONS, INITIAL_USERS } from './src/data/initialData.ts';

console.log('====================================================');
console.log('OFFICEOPS — MULTI-AGENT VERIFICATION TEST SUITE');
console.log('Student: Roopa Varshni R | Roll Number: 2023103509');
console.log('====================================================\n');

let allPassed = true;

// ----------------------------------------------------
// TEST 1: SCENARIO 1 (Standard Fit: 12 people, 3 PM, projector)
// ----------------------------------------------------
console.log('▶ TEST 1: Running Scenario 1 (Standard Fit)...');
const q1 = "I need a meeting room for 12 people tomorrow at 3 PM with a projector.";
const req1 = RequirementAgent.parse(q1);
console.log('  Requirement Agent Output:', JSON.stringify(req1.requirements));
if (req1.requirements.capacityNeeded !== 12 || req1.requirements.time !== '15:00' || !req1.requirements.requiredEquipment.includes('projector')) {
  console.error('  ❌ FAILED: Requirement extraction incorrect');
  allPassed = false;
} else {
  console.log('  ✔ Requirement parsing validated.');
}

const res1 = ResourceAgent.search(req1.requirements, INITIAL_ROOMS);
console.log(`  Resource Agent: Found ${res1.candidateRooms.length} candidate rooms.`);
const sched1 = SchedulingAgent.checkAvailability(res1.candidateRooms, req1.requirements, INITIAL_RESERVATIONS, INITIAL_ROOMS);
console.log(`  Scheduling Agent: ${sched1.availableCount} available rooms, hasConflicts: ${sched1.hasConflicts}`);
const rec1 = RecommendationAgent.rank(sched1.evaluatedSchedules, req1.requirements, INITIAL_ROOMS);
console.log(`  Recommendation Agent: Top Pick = ${rec1.recommendationPayload.primaryRecommendation?.room.name} (Score: ${rec1.recommendationPayload.primaryRecommendation?.totalScore})`);

if (rec1.recommendationPayload.primaryRecommendation?.room.name === 'Room Alpha') {
  console.log('  ✔ Scenario 1 PASS: Room Alpha correctly selected as top choice.\n');
} else {
  console.error(`  ❌ FAILED: Expected Room Alpha, got ${rec1.recommendationPayload.primaryRecommendation?.room.name}\n`);
  allPassed = false;
}

// ----------------------------------------------------
// TEST 2: SCENARIO 2 (Capacity Overflow: 50 people)
// ----------------------------------------------------
console.log('▶ TEST 2: Running Scenario 2 (Exceeds Facility Capacity)...');
const q2 = "I need a room for 50 people.";
const req2 = RequirementAgent.parse(q2);
const res2 = ResourceAgent.search(req2.requirements, INITIAL_ROOMS);
console.log(`  Resource Agent: overflowCapacity = ${res2.overflowCapacity}, max = ${res2.maxCapacity}`);
const rec2 = RecommendationAgent.rank([], req2.requirements, INITIAL_ROOMS);
console.log(`  Recommendation Agent Status = ${rec2.recommendationPayload.status}`);
console.log(`  Reasoning = "${rec2.recommendationPayload.reasoning}"`);

if (res2.overflowCapacity && rec2.recommendationPayload.status === 'no_match' && rec2.recommendationPayload.reasoning.includes('30 people')) {
  console.log('  ✔ Scenario 2 PASS: Correctly identified capacity overflow and explained limitation.\n');
} else {
  console.error('  ❌ FAILED: Scenario 2 did not handle overflow properly\n');
  allPassed = false;
}

// ----------------------------------------------------
// TEST 3: SCENARIO 3 (Optimal Fit: 5 people with projector)
// ----------------------------------------------------
console.log('▶ TEST 3: Running Scenario 3 (Optimal Space Utilization: 5 people)...');
const q3 = "I need a room for 5 people with a projector.";
const req3 = RequirementAgent.parse(q3);
const res3 = ResourceAgent.search(req3.requirements, INITIAL_ROOMS);
const sched3 = SchedulingAgent.checkAvailability(res3.candidateRooms, req3.requirements, INITIAL_RESERVATIONS, INITIAL_ROOMS);
const rec3 = RecommendationAgent.rank(sched3.evaluatedSchedules, req3.requirements, INITIAL_ROOMS);

console.log(`  Recommendation Agent: Top Pick = ${rec3.recommendationPayload.primaryRecommendation?.room.name} (Capacity: ${rec3.recommendationPayload.primaryRecommendation?.room.capacity})`);
console.log(`  Alternatives Count: ${rec3.recommendationPayload.alternatives.length}`);

if (rec3.recommendationPayload.primaryRecommendation?.room.name === 'Room Beta' && rec3.recommendationPayload.alternatives.length >= 2) {
  console.log('  ✔ Scenario 3 PASS: Room Beta correctly chosen for optimal 8-seat efficiency with alternatives offered.\n');
} else {
  console.error('  ❌ FAILED: Scenario 3 ranking incorrect\n');
  allPassed = false;
}

// ----------------------------------------------------
// TEST 4: SCENARIO 4 (Conflict Detection on Conference Hall)
// ----------------------------------------------------
console.log('▶ TEST 4: Running Scenario 4 (Calendar Conflict Detection)...');
const q4 = "I need Conference Hall tomorrow at 3 PM.";
const req4 = RequirementAgent.parse(q4);
const res4 = ResourceAgent.search(req4.requirements, INITIAL_ROOMS);
const sched4 = SchedulingAgent.checkAvailability(res4.candidateRooms, req4.requirements, INITIAL_RESERVATIONS, INITIAL_ROOMS);
console.log(`  Scheduling Agent: hasConflicts = ${sched4.hasConflicts}`);
const rec4 = RecommendationAgent.rank(sched4.evaluatedSchedules, req4.requirements, INITIAL_ROOMS);

console.log(`  Recommendation Agent Status: ${rec4.recommendationPayload.status}`);
console.log(`  Conflict Notice: "${rec4.recommendationPayload.conflictNotice}"`);
console.log(`  Alternative Suggested: ${rec4.recommendationPayload.primaryRecommendation?.room.name}`);

if (sched4.hasConflicts && rec4.recommendationPayload.conflictNotice && rec4.recommendationPayload.primaryRecommendation?.room.name !== 'Conference Hall') {
  console.log('  ✔ Scenario 4 PASS: Conflict successfully detected, and alternative space proposed.\n');
} else {
  console.error('  ❌ FAILED: Scenario 4 conflict detection failed\n');
  allPassed = false;
}

// ----------------------------------------------------
// TEST 5: HUMAN-IN-THE-LOOP (HITL) APPROVAL & AUDIT COMMIT
// ----------------------------------------------------
console.log('▶ TEST 5: Running HITL Governance Commit Verification...');
// Mock localStorage in Node environment if needed
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  };
}

const mockUser = INITIAL_USERS[0];
const initialResCount = storage.getReservations().length;
const initialAuditCount = storage.getAuditLogs().length;

// Approve Scenario 1 recommendation
const approvedRes = AgentOrchestrator.approveReservation('AGT-TEST-001', rec1.recommendationPayload, mockUser);
const postResCount = storage.getReservations().length;
const postAuditCount = storage.getAuditLogs().length;

console.log(`  Created Reservation ID: ${approvedRes.id}`);
console.log(`  Reservations Count: ${initialResCount} -> ${postResCount}`);
console.log(`  Audit Logs Count: ${initialAuditCount} -> ${postAuditCount}`);

if (postResCount === initialResCount + 1 && postAuditCount === initialAuditCount + 1) {
  console.log('  ✔ Scenario 5 PASS: Human approval committed reservation to store and generated audit ledger entry.\n');
} else {
  console.error('  ❌ FAILED: HITL approval did not update stores properly.\n');
  allPassed = false;
}

// Final Summary
console.log('====================================================');
if (allPassed) {
  console.log('🎉 ALL 5 ENTERPRISE VERIFICATION TESTS PASSED WITH 100% SUCCESS!');
} else {
  console.error('⚠️ SOME TESTS ENCOUNTERED FAILURES.');
}
console.log('====================================================');
