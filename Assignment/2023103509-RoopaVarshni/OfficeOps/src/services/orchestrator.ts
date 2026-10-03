import { RequirementAgent } from '../agents/requirementAgent';
import { ResourceAgent } from '../agents/resourceAgent';
import { SchedulingAgent } from '../agents/schedulingAgent';
import { RecommendationAgent } from '../agents/recommendationAgent';
import { storage } from './storage';
import { 
  AgentStepLog, 
  RecommendationPayload, 
  Reservation, 
  User 
} from '../types';

export interface PipelineExecutionResult {
  runId: string;
  success: boolean;
  logs: AgentStepLog[];
  payload: RecommendationPayload;
  totalDurationMs: number;
}

export type StepCallback = (stepLog: AgentStepLog) => void;

export class AgentOrchestrator {
  public static async executePipeline(
    userInput: string,
    onStepUpdate?: StepCallback
  ): Promise<PipelineExecutionResult> {
    const pipelineStartTime = performance.now();
    const runId = `AGT-${Math.floor(1000 + Math.random() * 9000)}`;
    const logs: AgentStepLog[] = [];

    // Helper to simulate asynchronous micro-step execution for visual agent feedback
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Log pipeline start in audit log
    const currentUser = storage.getCurrentUser();
    storage.addAuditLog({
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'AGENT_PIPELINE_INITIATED',
      targetResource: 'Workplace Operations Orchestrator',
      decision: 'executed',
      details: `Dispatched multi-agent workflow for query: "${userInput}"`,
      agentRunId: runId
    });

    // ───────────────────────────────────────────────
    // STEP 1: Requirement Agent
    // ───────────────────────────────────────────────
    await delay(320);
    const { requirements, log: reqLog } = RequirementAgent.parse(userInput);
    logs.push(reqLog);
    if (onStepUpdate) onStepUpdate(reqLog);

    // ───────────────────────────────────────────────
    // STEP 2: Resource Agent
    // ───────────────────────────────────────────────
    await delay(350);
    const allRooms = storage.getRooms();
    const { candidateRooms, overflowCapacity, maxCapacity, log: resLog } = 
      ResourceAgent.search(requirements, allRooms);
    logs.push(resLog);
    if (onStepUpdate) onStepUpdate(resLog);

    // If overflow capacity, we short-circuit to recommendation agent for failure explanation
    if (overflowCapacity) {
      await delay(300);
      const { recommendationPayload, log: recLog } = RecommendationAgent.rank([], requirements, allRooms);
      logs.push(recLog);
      if (onStepUpdate) onStepUpdate(recLog);

      const totalDurationMs = Math.round(performance.now() - pipelineStartTime);
      storage.recordAgentExecution(false, totalDurationMs);

      return {
        runId,
        success: false,
        logs,
        payload: recommendationPayload,
        totalDurationMs
      };
    }

    // ───────────────────────────────────────────────
    // STEP 3: Scheduling Agent
    // ───────────────────────────────────────────────
    await delay(380);
    const existingReservations = storage.getReservations();
    const { evaluatedSchedules, hasConflicts, availableCount, log: schedLog } = 
      SchedulingAgent.checkAvailability(candidateRooms, requirements, existingReservations, allRooms);
    logs.push(schedLog);
    if (onStepUpdate) onStepUpdate(schedLog);

    // ───────────────────────────────────────────────
    // STEP 4: Recommendation Agent
    // ───────────────────────────────────────────────
    await delay(420);
    const { recommendationPayload, log: recLog } = 
      RecommendationAgent.rank(evaluatedSchedules, requirements, allRooms);
    logs.push(recLog);
    if (onStepUpdate) onStepUpdate(recLog);

    const totalDurationMs = Math.round(performance.now() - pipelineStartTime);
    const pipelineSuccess = recommendationPayload.status === 'ready_for_approval';
    
    // Telemetry update
    storage.recordAgentExecution(pipelineSuccess, totalDurationMs);

    return {
      runId,
      success: pipelineSuccess,
      logs,
      payload: recommendationPayload,
      totalDurationMs
    };
  }

  // ───────────────────────────────────────────────
  // HUMAN-IN-THE-LOOP APPROVAL COMMIT
  // Consequential reservation action is ONLY committed here
  // ───────────────────────────────────────────────
  public static approveReservation(
    runId: string,
    payload: RecommendationPayload,
    user: User
  ): Reservation {
    if (!payload.primaryRecommendation) {
      throw new Error('Cannot approve booking without a valid recommended room.');
    }

    const { room } = payload.primaryRecommendation;
    const { requirements } = payload;

    const newReservation: Reservation = {
      id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      roomId: room.id,
      roomName: room.name,
      requesterName: user.name,
      requesterEmail: user.email,
      requesterRole: user.role,
      date: requirements.date,
      time: requirements.time,
      durationHours: requirements.durationHours,
      attendeeCount: requirements.capacityNeeded,
      equipment: requirements.requiredEquipment,
      purpose: requirements.rawInput,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      agentRunId: runId
    };

    // Commit to storage
    storage.addReservation(newReservation);

    // Record Immutable Audit Log
    storage.addAuditLog({
      actor: user.name,
      actorRole: user.role,
      action: 'HUMAN_APPROVAL_COMMITTED',
      targetResource: room.name,
      decision: 'approved',
      details: `User explicitly approved AI recommendation for ${room.name} on ${requirements.date} at ${requirements.time}. Reservation ID: ${newReservation.id}.`,
      agentRunId: runId
    });

    return newReservation;
  }

  // ───────────────────────────────────────────────
  // HUMAN-IN-THE-LOOP REJECTION
  // ───────────────────────────────────────────────
  public static rejectRecommendation(
    runId: string,
    payload: RecommendationPayload,
    user: User,
    reason: string = 'User declined proposed space configuration'
  ) {
    const roomName = payload.primaryRecommendation?.room.name || 'Candidate Space';
    
    storage.addAuditLog({
      actor: user.name,
      actorRole: user.role,
      action: 'HUMAN_APPROVAL_REJECTED',
      targetResource: roomName,
      decision: 'rejected',
      details: `User rejected proposed reservation for ${roomName}. Reason: "${reason}". Consequential state change aborted.`,
      agentRunId: runId
    });
  }
}
