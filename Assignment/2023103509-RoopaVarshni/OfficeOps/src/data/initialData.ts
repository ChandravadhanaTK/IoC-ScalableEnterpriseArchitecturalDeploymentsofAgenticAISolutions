import { User, Room, Reservation, WorkplaceRequest, AuditEvent, TelemetryMetrics } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Roopa Varshni R',
    email: 'employee@officeops.enterprise.internal',
    role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    title: 'Senior Solutions Engineer',
    department: 'Enterprise AI & Solutions'
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'ops.manager@officeops.enterprise.internal',
    role: 'operations_manager',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    title: 'Director of Workplace Operations',
    department: 'Global Facilities'
  },
  {
    id: 'usr-3',
    name: 'Sarah Jenkins',
    email: 'admin@officeops.enterprise.internal',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    title: 'Head of IT Infrastructure & Governance',
    department: 'Enterprise SecOps'
  }
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-alpha',
    name: 'Room Alpha',
    capacity: 15,
    equipment: {
      projector: true,
      videoConferencing: true,
      whiteboard: true
    },
    status: 'available',
    floor: 'Floor 3 (Wing A)',
    location: 'North Tower - Building 4',
    description: 'Executive boardroom fitted with dual 4K beam projector, Cisco telepresence, and acoustic soundproofing.',
    hourlyRate: 'Internal Resource'
  },
  {
    id: 'room-beta',
    name: 'Room Beta',
    capacity: 8,
    equipment: {
      projector: true,
      videoConferencing: true,
      whiteboard: false
    },
    status: 'available',
    floor: 'Floor 2 (Wing B)',
    location: 'South Tower - Building 2',
    description: 'Compact team huddle room equipped with high-def short-throw projector and Zoom Room telepresence bar.',
    hourlyRate: 'Internal Resource'
  },
  {
    id: 'room-conference-hall',
    name: 'Conference Hall',
    capacity: 30,
    equipment: {
      projector: true,
      videoConferencing: true,
      whiteboard: true
    },
    status: 'occupied',
    floor: 'Floor 1 (Executive Wing)',
    location: 'Central Atrium - Building 1',
    description: 'Large auditorium hall with dual widescreen projection, multi-mic ceiling array, and live streaming capabilities.',
    hourlyRate: 'Executive Priority'
  },
  {
    id: 'room-innovation',
    name: 'Innovation Room',
    capacity: 20,
    equipment: {
      projector: true,
      videoConferencing: false,
      whiteboard: true
    },
    status: 'available',
    floor: 'Floor 4 (Tech Hub)',
    location: 'North Tower - Building 4',
    description: 'Collaborative workshop lab featuring 360-degree magnetic whiteboards and laser projector for design sprints.',
    hourlyRate: 'Internal Resource'
  }
];

// Calculate tomorrow's date string YYYY-MM-DD
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
export const TOMORROW_STR = tomorrow.toISOString().split('T')[0];

const today = new Date();
export const TODAY_STR = today.toISOString().split('T')[0];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res-101',
    roomId: 'room-conference-hall',
    roomName: 'Conference Hall',
    requesterName: 'Executive Leadership Team',
    requesterEmail: 'leadership@officeops.enterprise.internal',
    requesterRole: 'operations_manager',
    date: TOMORROW_STR,
    time: '15:00',
    durationHours: 2,
    attendeeCount: 28,
    equipment: ['projector', 'videoConferencing', 'whiteboard'],
    purpose: 'Quarterly Global Operations Review',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    agentRunId: 'AGT-8491'
  },
  {
    id: 'res-102',
    roomId: 'room-beta',
    roomName: 'Room Beta',
    requesterName: 'Design Guild',
    requesterEmail: 'design@officeops.enterprise.internal',
    requesterRole: 'employee',
    date: TODAY_STR,
    time: '11:00',
    durationHours: 1,
    attendeeCount: 6,
    equipment: ['projector', 'videoConferencing'],
    purpose: 'Mobile UI Sync',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    agentRunId: 'AGT-8302'
  }
];

export const INITIAL_REQUESTS: WorkplaceRequest[] = [
  {
    id: 'REQ-4091',
    type: 'it_support',
    title: 'Dual 4K Monitor dock not calibrating in Lab 304',
    requester: 'Roopa Varshni R',
    requesterEmail: 'employee@officeops.enterprise.internal',
    department: 'Enterprise AI & Solutions',
    priority: 'high',
    status: 'in_progress',
    description: 'Docking station display link flickers when connecting USB-C laptops.',
    createdAt: '2026-10-03T09:15:00Z'
  },
  {
    id: 'REQ-4092',
    type: 'equipment_request',
    title: 'Wireless boundary microphones for Conference Room Beta',
    requester: 'David Miller',
    requesterEmail: 'dmiller@officeops.enterprise.internal',
    department: 'Sales Engineering',
    priority: 'medium',
    status: 'approved',
    description: 'Require 2 additional boundary mics for hybrid client demonstration.',
    createdAt: '2026-10-03T10:45:00Z'
  },
  {
    id: 'REQ-4093',
    type: 'maintenance',
    title: 'HVAC temperature adjustment on 3rd Floor East Wing',
    requester: 'Elena Rostova',
    requesterEmail: 'erostova@officeops.enterprise.internal',
    department: 'People Operations',
    priority: 'low',
    status: 'pending',
    description: 'Thermostat set to 66F, requesting adjustment to 72F.',
    createdAt: '2026-10-03T11:30:00Z'
  },
  {
    id: 'REQ-4094',
    type: 'visitor_management',
    title: 'Client delegation access badges (5 visitors from Tokyo)',
    requester: 'Marcus Vance',
    requesterEmail: 'ops.manager@officeops.enterprise.internal',
    department: 'Global Facilities',
    priority: 'urgent',
    status: 'pending',
    description: 'VIP security badges and guest Wi-Fi provisioning for Oct 4-6.',
    createdAt: '2026-10-03T13:20:00Z'
  },
  {
    id: 'REQ-4095',
    type: 'employee_onboarding',
    title: 'Workstation and badge setup for incoming DevOps engineer',
    requester: 'Sarah Jenkins',
    requesterEmail: 'admin@officeops.enterprise.internal',
    department: 'Enterprise SecOps',
    priority: 'medium',
    status: 'resolved',
    description: 'Hardware provisioning and access permissions configured.',
    createdAt: '2026-10-02T14:00:00Z',
    resolvedAt: '2026-10-03T08:30:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'AUD-9011',
    timestamp: '2026-10-03T13:40:12Z',
    actor: 'Roopa Varshni R',
    actorRole: 'employee',
    action: 'PIPELINE_INITIATED',
    targetResource: 'Multi-Agent Orchestrator',
    decision: 'executed',
    details: 'Triggered natural language query: "Meeting room for 12 tomorrow 3 PM with projector"',
    agentRunId: 'AGT-9011'
  },
  {
    id: 'AUD-9010',
    timestamp: '2026-10-03T12:15:33Z',
    actor: 'Marcus Vance',
    actorRole: 'operations_manager',
    action: 'ROOM_STATUS_CHANGED',
    targetResource: 'Conference Hall',
    decision: 'executed',
    details: 'Status transitioned to OCCUPIED for executive symposium block'
  },
  {
    id: 'AUD-9009',
    timestamp: '2026-10-03T10:50:00Z',
    actor: 'Sarah Jenkins',
    actorRole: 'admin',
    action: 'POLICY_VERIFIED',
    targetResource: 'HITL Governance Gate',
    decision: 'approved',
    details: 'Confirmed zero-autonomous action enforcement policy across all agent microservices'
  },
  {
    id: 'AUD-9008',
    timestamp: '2026-10-02T16:22:18Z',
    actor: 'Roopa Varshni R',
    actorRole: 'employee',
    action: 'RESERVATION_CONFIRMED',
    targetResource: 'Room Beta',
    decision: 'approved',
    details: 'Human user approved proposed booking res-102 after Recommendation Agent scoring (92/100)',
    agentRunId: 'AGT-8302'
  }
];

export const INITIAL_TELEMETRY: TelemetryMetrics = {
  totalRequests: 132,
  agentExecutions: 418,
  successCount: 409,
  failureCount: 9,
  avgResponseTimeMs: 245,
  pendingApprovals: 2,
  totalReservations: 47
};
