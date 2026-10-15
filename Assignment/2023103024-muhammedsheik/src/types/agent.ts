export type NavigationTab = 
  | 'dashboard'
  | 'assistant'
  | 'workflow'
  | 'architecture'
  | 'deployment'
  | 'security'
  | 'monitoring';

export type TaskStatus = 'Received' | 'Planning' | 'Executing' | 'Validating' | 'Completed' | 'Failed' | 'Waiting for Approval';

export type AgentRole = 
  | 'Orchestrator Agent'
  | 'Planning Agent'
  | 'Research Agent'
  | 'Analysis Agent'
  | 'Validation Agent'
  | 'Response Agent'
  | 'General Assistant'
  | 'Planner'
  | 'Specialist Agent'
  | 'Tool Sandbox'
  | 'Security Validator';

export type SimulatedToolName = 
  | 'Knowledge Search'
  | 'Calculator'
  | 'Document Search'
  | 'Data Analyzer'
  | 'Web Search simulation'
  | 'None';

export type PipelineStepName = 
  | 'User Request'
  | 'Intent Detection'
  | 'Task Planning'
  | 'Agent Selection'
  | 'Tool Execution'
  | 'Validation'
  | 'Final Response';

export interface PipelineExecutionStep {
  id: string;
  stepNumber: number;
  stepName: PipelineStepName;
  agentResponsible: AgentRole;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  startTime: string;
  durationMs: number;
  result: string;
  success: boolean;
  toolUsed?: SimulatedToolName;
  details?: string;
  parameters?: Record<string, any>;
}

export interface TraceStep {
  id: string;
  stepNumber: number;
  agent: AgentRole;
  toolUsed?: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  timestamp: string;
  durationMs: number;
  tokensUsed: number;
  details: string;
  payload?: Record<string, any>;
  output?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: TaskStatus;
  currentAgent?: AgentRole;
  activeTool?: string;
  tokens?: number;
  latencyMs?: number;
  traceSteps?: TraceStep[];
  pipelineSteps?: PipelineExecutionStep[];
  selectedAgent?: AgentRole;
  selectedTool?: SimulatedToolName;
  humanApprovalRequired?: boolean;
  approvalPayload?: {
    action: string;
    target: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

export interface WorkflowNode {
  id: string;
  label: string;
  sublabel: string;
  role: AgentRole | 'User' | 'Output';
  status: 'Pending' | 'Running' | 'Waiting for Approval' | 'Completed' | 'Failed';
  color: 'blue' | 'purple' | 'green' | 'orange' | 'cyan';
  icon: string;
  model?: string;
  description: string;
  inputs: string[];
  outputs: string[];
  systemPromptSnippet?: string;
  metrics?: {
    avgLatency: string;
    successRate: string;
    callsToday: number;
  };
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  description: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'cyan';
  securityLevel: string;
  components: {
    name: string;
    type: string;
    protocol: string;
    description: string;
    badge?: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  ipAddress: string;
  details: string;
}

export interface TraceItem {
  id: string;
  traceId: string;
  timestamp: string;
  taskTitle: string;
  tenant: string;
  agents: AgentRole[];
  durationMs: number;
  tokens: number;
  costUsd: number;
  status: 'Completed' | 'Failed' | 'Blocked';
  spans: {
    name: string;
    agent: AgentRole;
    startOffsetMs: number;
    durationMs: number;
    status: 'ok' | 'error';
    details: string;
  }[];
}

export interface GuardrailRule {
  id: string;
  name: string;
  category: 'Prompt Injection' | 'PII Redaction' | 'Hallucination' | 'Toxicity' | 'Data Exfiltration';
  action: 'BLOCK' | 'REDACT' | 'FLAG_FOR_REVIEW';
  status: 'ACTIVE' | 'AUDIT_ONLY' | 'DISABLED';
  blockedCount: number;
  threshold: number;
}
