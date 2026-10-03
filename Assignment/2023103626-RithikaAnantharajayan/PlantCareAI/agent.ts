export type AgentToolName =
  | 'getUserPlants'
  | 'getPlantDetails'
  | 'getUpcomingCareTasks'
  | 'getCareHistory'
  | 'createCarePlan'
  | 'createVacationPlan'
  | 'updateCareTask'
  | 'rescheduleCare';

export interface PendingAction {
  id: string;
  actionType: 'UPDATE_CARE_SCHEDULE' | 'CREATE_CARE_PLAN' | 'CREATE_VACATION_PLAN' | 'COMPLETE_TASK';
  title: string;
  description: string;
  payload: Record<string, any>;
  status: 'pending' | 'confirmed' | 'cancelled';
  executedAt?: string;
}

export interface ToolExecutionRecord {
  tool: AgentToolName;
  input?: any;
  resultSummary: string;
  timestamp: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolsExecuted?: ToolExecutionRecord[];
  pendingAction?: PendingAction;
  isDiagnostic?: boolean;
}
