export type AppRole = 'employee' | 'manager' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department: string;
  location: string;
  manager_id?: string;
}

export type AssetStatus = 'AVAILABLE' | 'RESERVED' | 'ASSIGNED' | 'IN_USE' | 'REPAIR' | 'RETIRED';

export interface Asset {
  id: string;
  tag: string;
  type: string;
  brand: string;
  model: string;
  status: AssetStatus;
  owner_id?: string | null;
  department: string;
  location: string;
  ram: number;
  storage: number;
  cpu: string;
  value: number; // in INR
  age_years: number;
  health: number; // 0 - 100
  warranty_until: string;
  replacement_score: number; // 0 - 100
  repairs_count: number;
}

export type RequestStatus =
  | 'RECEIVED'
  | 'ANALYZING'
  | 'POLICY_CHECK'
  | 'INVENTORY_MATCHING'
  | 'RISK_EVALUATION'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSIGNING'
  | 'COMPLETED'
  | 'FAILED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AssetRequest {
  id: string;
  code: string;
  requester_id: string;
  asset_type: string;
  purpose: string;
  department: string;
  duration: string;
  min_ram: number;
  min_storage: number;
  cpu_requirement: string;
  preferred_location: string;
  justification: string;
  status: RequestStatus;
  risk?: RiskLevel;
  reason?: string;
  recommended_asset_id?: string | null;
  auto_approved?: boolean;
  created_at: string;
}

export interface Approval {
  id: string;
  request_id: string;
  approver_id?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  created_at: string;
}

export interface AssetAssignment {
  id: string;
  asset_id: string;
  user_id: string;
  request_id?: string | null;
  assigned_at: string;
  returned_at?: string | null;
}

export interface Transfer {
  id: string;
  asset_id: string;
  from_user_id: string;
  to_user_id: string;
  reason: string;
  status: 'PENDING_MANAGER_APPROVAL' | 'APPROVED' | 'REJECTED';
  approver_id?: string | null;
  created_at: string;
}

export interface Repair {
  id: string;
  asset_id: string;
  issue: string;
  cost: number;
  status: 'COMPLETED' | 'IN_PROGRESS';
  repair_date: string;
}

export interface AgentEvent {
  id: string;
  request_id: string;
  agent: string;
  tool: string;
  stage: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REJECTED';
  result: string;
  duration: number; // in ms
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor: string;
  role: string;
  agent?: string;
  action: string;
  resource: string;
  resource_id: string;
  details: string;
  created_at: string;
}

export interface RequestInput {
  assetType: string;
  purpose: string;
  department: string;
  duration: string;
  minRam: number;
  minStorage: number;
  cpu: string;
  location: string;
  justification: string;
}
