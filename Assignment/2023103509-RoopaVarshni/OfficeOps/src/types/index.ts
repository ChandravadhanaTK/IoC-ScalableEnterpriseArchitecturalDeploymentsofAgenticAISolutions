export type UserRole = 'employee' | 'operations_manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  department: string;
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface RoomEquipment {
  projector: boolean;
  videoConferencing: boolean;
  whiteboard: boolean;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: RoomEquipment;
  status: RoomStatus;
  floor: string;
  location: string;
  description: string;
  hourlyRate?: string;
  image?: string;
}

export type ReservationStatus = 'confirmed' | 'pending_approval' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: UserRole;
  date: string;
  time: string;
  durationHours: number;
  attendeeCount: number;
  equipment: string[];
  purpose: string;
  status: ReservationStatus;
  createdAt: string;
  agentRunId: string;
}

export type WorkplaceRequestType = 
  | 'it_support' 
  | 'maintenance' 
  | 'visitor_management' 
  | 'equipment_request' 
  | 'employee_onboarding';

export type WorkplaceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkplaceRequestStatus = 'pending' | 'in_progress' | 'approved' | 'resolved' | 'rejected';

export interface WorkplaceRequest {
  id: string;
  type: WorkplaceRequestType;
  title: string;
  requester: string;
  requesterEmail: string;
  department: string;
  priority: WorkplaceRequestPriority;
  status: WorkplaceRequestStatus;
  description: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ParsedRequirements {
  intent: string;
  rawInput: string;
  capacityNeeded: number;
  date: string;
  time: string;
  durationHours: number;
  requiredEquipment: string[];
  preferredRoom?: string;
  constraints: string[];
}

export interface ScoredRoom {
  room: Room;
  capacityScore: number;
  equipmentScore: number;
  availabilityScore: number;
  totalScore: number;
  fitCategory: 'optimal' | 'acceptable' | 'suboptimal' | 'conflict';
  reasoning: string;
  isConflict?: boolean;
  conflictReason?: string;
}

export interface RecommendationPayload {
  requirements: ParsedRequirements;
  primaryRecommendation: ScoredRoom | null;
  alternatives: ScoredRoom[];
  reasoning: string;
  status: 'ready_for_approval' | 'no_match' | 'conflict_detected';
  conflictNotice?: string;
}

export interface AgentStepLog {
  agentName: 'Requirement Agent' | 'Resource Agent' | 'Scheduling Agent' | 'Recommendation Agent';
  stepNumber: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  title: string;
  details: string;
  durationMs: number;
  data?: any;
  timestamp: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  targetResource: string;
  decision: 'approved' | 'rejected' | 'executed' | 'flagged' | 'created';
  details: string;
  agentRunId?: string;
}

export interface TelemetryMetrics {
  totalRequests: number;
  agentExecutions: number;
  successCount: number;
  failureCount: number;
  avgResponseTimeMs: number;
  pendingApprovals: number;
  totalReservations: number;
}
