export type UserRole = 'admin' | 'operator' | 'engineer' | 'auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  permissions: string[];
  sessionToken?: string;
  mfaVerified: boolean;
}

export type TaskPriority = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';

export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'backlog';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'hitl_approval' | 'completed' | 'blocked';

export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  agentCapable: boolean;
  agentStatus?: 'idle' | 'executing' | 'done' | 'failed' | 'waiting_approval';
  toolUsed?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  quadrant: EisenhowerQuadrant;
  status: TaskStatus;
  assignee: {
    id: string;
    name: string;
    avatar: string;
    isAgent?: boolean;
  };
  createdBy: string;
  createdAt: string;
  dueDate: string;
  impactScore: number; // 1 - 10
  urgencyScore: number; // 1 - 10
  estimatedHours: number;
  tags: string[];
  dependencies: string[]; // task IDs
  subtasks: Subtask[];
  agentNotes?: string;
  securityLevel: SecurityLevel;
  hitlRequired: boolean;
  toolRequirements: string[];
  confidenceScore?: number; // 0 - 100%
  completedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resourceType: 'task' | 'agent' | 'auth' | 'security' | 'deployment';
  resourceId: string;
  details: string;
  previousHash: string;
  hash: string;
  ipAddress: string;
  verified: boolean;
}

export interface AgentExecutionStep {
  id: string;
  stepNumber: number;
  title: string;
  role: 'Intake Agent' | 'Prioritization Agent' | 'Task Decomposition' | 'Tool Orchestrator' | 'Safety Evaluator' | 'Reflection Critic';
  status: 'pending' | 'running' | 'completed' | 'hitl_blocked' | 'failed';
  inputSummary: string;
  outputSummary?: string;
  toolInvoked?: string;
  toolPayload?: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
  latencyMs: number;
  tokensUsed: number;
  requiresHITL: boolean;
  hitlApproved?: boolean;
  hitlNotes?: string;
  failureFallbackPath?: string;
}

export type CapstoneDeliverableId = 
  | 'overview'
  | 'architecture'
  | 'workflow'
  | 'deployment'
  | 'security'
  | 'monitoring';

export interface MonitoringMetricCard {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
}

export interface TraceSpan {
  id: string;
  name: string;
  service: string;
  durationMs: number;
  status: 'ok' | 'error' | 'warning';
  children?: TraceSpan[];
  metadata?: Record<string, string | number>;
}
