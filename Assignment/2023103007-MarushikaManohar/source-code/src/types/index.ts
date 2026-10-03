export type Role =
  | "INVENTORY_OPERATOR"
  | "SUPPLY_CHAIN_MANAGER"
  | "PROCUREMENT_OFFICER"
  | "ADMINISTRATOR";

export type Permission =
  | "VIEW_INVENTORY"
  | "REQUEST_REPLENISHMENT"
  | "REVIEW_APPROVE"
  | "EXECUTE_PO"
  | "ADMIN_POLICIES";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type Trend = "UP" | "DOWN" | "STABLE";

export type WorkflowState =
  | "CREATED"
  | "ANALYZING"
  | "POLICY_CHECK"
  | "RISK_ASSESSMENT"
  | "RECOMMENDATION_READY"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PURCHASE_ORDER_CREATED"
  | "COMPLETED"
  | "RETRYING"
  | "ESCALATED"
  | "FAILED";

export type AgentName =
  | "OrchestratorAgent"
  | "DemandAgent"
  | "InventoryAgent"
  | "SupplierAgent"
  | "RiskAndPolicyAgent"
  | "ProcurementAgent";

export type ToolName =
  | "InventoryTool"
  | "DemandHistoryTool"
  | "SupplierTool"
  | "AvailabilityTool"
  | "PolicyTool"
  | "RiskMatrixTool"
  | "PurchaseOrderTool"
  | "NotificationTool"
  | "AuditTool"
  | "TelemetryTool";

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
}

export interface Warehouse {
  id: string;
  name: string;
  region: string;
}

export interface InventoryRecord {
  id: string;
  productId: string;
  warehouseId: string;
  onHand: number;
  safetyStock: number;
  reorderPoint: number;
  inTransit: number;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  reliability: number; // 0-100
  leadTimeDays: number;
  capacity: number; // max units per order
  active: boolean;
  blacklisted: boolean;
}

export interface SupplierProduct {
  supplierId: string;
  productId: string;
  unitPrice: number;
}

export interface DemandHistory {
  productId: string;
  warehouseId: string;
  daily: number[]; // oldest -> newest, 90 entries
}

export interface Policy {
  spendingLimit: number;
  hardSpendCeiling: number;
  minReliability: number;
  retryLimit: number;
  approvalSlaMinutes: number;
  planningHorizonDays: number;
  weights: { price: number; lead: number; reliability: number };
  seasonalFactors: Record<string, number>;
  updatedAt: string;
  updatedBy: string;
}

export interface TransitionRecord {
  from: WorkflowState | null;
  to: WorkflowState;
  at: string;
  actorId: string;
  role: Role | "SYSTEM";
  reason: string;
}

export interface DemandOutput {
  ma30: number;
  ma60: number;
  ma90: number;
  seasonalFactor: number;
  horizonDays: number;
  expectedDemand: number;
  trend: Trend;
}

export interface InventoryOutput {
  onHand: number;
  inTransit: number;
  safetyStock: number;
  expectedDemand: number;
  projectedStock: number;
  risk: RiskLevel;
}

export interface SupplierScore {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  leadTimeDays: number;
  reliability: number;
  priceScore: number;
  leadScore: number;
  total: number;
  available: boolean;
  capacity: number;
}

export interface SupplierOutput {
  selected: SupplierScore | null;
  ranking: SupplierScore[];
  fallbackUsed: boolean;
  primaryUnavailable?: string | undefined;
}

export interface RiskOutput {
  orderValue: number;
  approvalRequired: boolean;
  triggers: string[];
  hardViolation: string | null;
}

export interface FaultInjection {
  tool: ToolName;
  remainingFailures: number;
}

export interface WorkflowRun {
  id: string;
  requestId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  emergency: boolean;
  preferredDate: string;
  notes: string;
  requestedBy: string;
  scenario?: string | undefined;
  state: WorkflowState;
  resumeState?: WorkflowState | undefined;
  history: TransitionRecord[];
  retries: number;
  createdAt: string;
  updatedAt: string;
  awaitingSince?: string;
  demand?: DemandOutput;
  inventory?: InventoryOutput;
  supplier?: SupplierOutput;
  risk?: RiskOutput;
  poId?: string;
  outcomeReason?: string;
  fault?: FaultInjection | undefined;
}

export interface ReplenishmentRequest {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  emergency: boolean;
  preferredDate: string;
  notes: string;
  requestedBy: string;
  createdAt: string;
  workflowId: string;
}

export interface AgentExecution {
  id: string;
  workflowId: string;
  agent: AgentName;
  status: "SUCCESS" | "FAILED";
  attempt: number;
  startedAt: string;
  durationMs: number;
  toolCalls: ToolName[];
  input: unknown;
  output: unknown;
  evidence: string[];
  error?: string | undefined;
}

export interface PurchaseOrder {
  id: string;
  idempotencyKey: string;
  workflowId: string;
  supplierId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: "ISSUED" | "RECEIVED";
  createdAt: string;
  createdBy: string;
  receivedAt?: string;
  receivedBy?: string;
}

export interface Approval {
  id: string;
  workflowId: string;
  decision: "APPROVED" | "REJECTED" | "AUTO_APPROVED";
  decidedBy: string;
  role: Role | "SYSTEM";
  reason: string;
  at: string;
}

export type AuditResult = "SUCCESS" | "FAILURE" | "DENIED";
export type Severity = "INFO" | "WARN" | "CRITICAL";

export interface AuditLog {
  id: string;
  seq: number;
  timestamp: string;
  userId: string;
  role: Role | "SYSTEM";
  workflowId?: string | undefined;
  agent?: AgentName;
  action: string;
  fromState?: WorkflowState | null;
  toState?: WorkflowState;
  tool?: ToolName;
  result: AuditResult;
  severity: Severity;
  details: Record<string, unknown>;
}

export interface Notification {
  id: string;
  at: string;
  kind: "APPROVAL_REQUIRED" | "ESCALATION" | "FAILURE" | "INFO";
  message: string;
  workflowId?: string | undefined;
  targetRoles: Role[];
  read: boolean;
}

export interface TelemetryEvent {
  id: string;
  at: string;
  kind: "tool" | "agent";
  source: string;
  latencyMs: number;
  ok: boolean;
  workflowId?: string | undefined;
}

export interface AppState {
  version: number;
  sessionUserId: string;
  users: User[];
  products: Product[];
  warehouses: Warehouse[];
  inventory: InventoryRecord[];
  suppliers: Supplier[];
  supplierProducts: SupplierProduct[];
  demandHistory: DemandHistory[];
  policy: Policy;
  requests: ReplenishmentRequest[];
  workflows: WorkflowRun[];
  agentExecutions: AgentExecution[];
  purchaseOrders: PurchaseOrder[];
  approvals: Approval[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  telemetry: TelemetryEvent[];
  counters: { workflow: number; po: number; audit: number; id: number };
}
