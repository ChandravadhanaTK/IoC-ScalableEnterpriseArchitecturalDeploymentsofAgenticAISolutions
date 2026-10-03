import {
  Profile,
  Asset,
  AssetRequest,
  Approval,
  AssetAssignment,
  Transfer,
  Repair,
  AgentEvent,
  AuditLog,
  AppRole,
} from '../types';

export interface StorageData {
  profiles: Profile[];
  assets: Asset[];
  asset_requests: AssetRequest[];
  approvals: Approval[];
  asset_assignments: AssetAssignment[];
  transfers: Transfer[];
  repairs: Repair[];
  agent_events: AgentEvent[];
  audit_logs: AuditLog[];
  currentUser: Profile | null;
}

const STORAGE_KEY = 'assetcare_hq_db_v1';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-1',
    name: 'Alex Rivera',
    email: 'employee@assetcarehq.demo',
    role: 'employee',
    department: 'Engineering',
    location: 'Bengaluru',
    manager_id: 'usr-2',
  },
  {
    id: 'usr-2',
    name: 'Sarah Chen',
    email: 'manager@assetcarehq.demo',
    role: 'manager',
    department: 'Engineering',
    location: 'Bengaluru',
  },
  {
    id: 'usr-3',
    name: 'David Miller',
    email: 'admin@assetcarehq.demo',
    role: 'admin',
    department: 'IT Operations',
    location: 'Bengaluru',
  },
  {
    id: 'usr-4',
    name: 'Priya Sharma',
    email: 'priya.s@assetcarehq.demo',
    role: 'employee',
    department: 'Engineering',
    location: 'Hyderabad',
    manager_id: 'usr-2',
  },
  {
    id: 'usr-5',
    name: 'Marcus Vance',
    email: 'marcus.v@assetcarehq.demo',
    role: 'employee',
    department: 'Design',
    location: 'Bengaluru',
    manager_id: 'usr-2',
  },
  {
    id: 'usr-6',
    name: 'Elena Rostova',
    email: 'elena.r@assetcarehq.demo',
    role: 'employee',
    department: 'Finance',
    location: 'Mumbai',
  },
  {
    id: 'usr-7',
    name: 'Karthik Raja',
    email: 'karthik.r@assetcarehq.demo',
    role: 'employee',
    department: 'Operations',
    location: 'Bengaluru',
  },
  {
    id: 'usr-8',
    name: 'Aisha Patel',
    email: 'aisha.p@assetcarehq.demo',
    role: 'employee',
    department: 'Human Resources',
    location: 'Pune',
  },
  {
    id: 'usr-9',
    name: 'James Wilson',
    email: 'james.w@assetcarehq.demo',
    role: 'manager',
    department: 'Finance',
    location: 'Mumbai',
  },
  {
    id: 'usr-10',
    name: 'Devin Thorne',
    email: 'devin.t@assetcarehq.demo',
    role: 'employee',
    department: 'Marketing',
    location: 'Bengaluru',
  },
];

export const INITIAL_ASSETS: Asset[] = [
  // AVAILABLE Laptops
  {
    id: 'ast-1',
    tag: 'LT-1042',
    type: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro 14" M3',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 18,
    storage: 512,
    cpu: 'Apple M3 Pro',
    value: 199900,
    age_years: 0.8,
    health: 96,
    warranty_until: '2027-02-15',
    replacement_score: 12,
    repairs_count: 0,
  },
  {
    id: 'ast-2',
    tag: 'LT-1043',
    type: 'Laptop',
    brand: 'Dell',
    model: 'Latitude 7440',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 16,
    storage: 512,
    cpu: 'Intel Core i7-1365U',
    value: 48500,
    age_years: 1.1,
    health: 92,
    warranty_until: '2026-11-20',
    replacement_score: 18,
    repairs_count: 0,
  },
  {
    id: 'ast-3',
    tag: 'LT-1044',
    type: 'Laptop',
    brand: 'Lenovo',
    model: 'ThinkPad T14s Gen 4',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 32,
    storage: 1024,
    cpu: 'AMD Ryzen 7 PRO 7840U',
    value: 135000,
    age_years: 0.6,
    health: 98,
    warranty_until: '2027-06-30',
    replacement_score: 8,
    repairs_count: 0,
  },
  {
    id: 'ast-4',
    tag: 'LT-1045',
    type: 'Laptop',
    brand: 'HP',
    model: 'EliteBook 840 G10',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Finance',
    location: 'Mumbai',
    ram: 16,
    storage: 512,
    cpu: 'Intel Core i5-1335U',
    value: 46000,
    age_years: 1.4,
    health: 89,
    warranty_until: '2026-08-10',
    replacement_score: 22,
    repairs_count: 0,
  },
  {
    id: 'ast-5',
    tag: 'LT-1046',
    type: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Air 15" M2',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Design',
    location: 'Bengaluru',
    ram: 16,
    storage: 512,
    cpu: 'Apple M2',
    value: 134900,
    age_years: 1.5,
    health: 91,
    warranty_until: '2026-09-01',
    replacement_score: 19,
    repairs_count: 0,
  },
  {
    id: 'ast-6',
    tag: 'LT-1047',
    type: 'Laptop',
    brand: 'Dell',
    model: 'Precision 5680 Workstation',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 64,
    storage: 2048,
    cpu: 'Intel Core i9-13900H RTX 3500',
    value: 340000,
    age_years: 0.5,
    health: 99,
    warranty_until: '2027-10-15',
    replacement_score: 5,
    repairs_count: 0,
  },

  // IN USE Laptops
  {
    id: 'ast-7',
    tag: 'LT-1020',
    type: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro 16" M2 Max',
    status: 'IN_USE',
    owner_id: 'usr-1',
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 32,
    storage: 1024,
    cpu: 'Apple M2 Max',
    value: 289900,
    age_years: 2.1,
    health: 84,
    warranty_until: '2026-04-10',
    replacement_score: 32,
    repairs_count: 1,
  },
  {
    id: 'ast-8',
    tag: 'LT-1021',
    type: 'Laptop',
    brand: 'Dell',
    model: 'XPS 15 9530',
    status: 'IN_USE',
    owner_id: 'usr-2',
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 32,
    storage: 1024,
    cpu: 'Intel Core i7-13700H',
    value: 215000,
    age_years: 1.8,
    health: 88,
    warranty_until: '2026-07-20',
    replacement_score: 25,
    repairs_count: 0,
  },

  // Old Assets / REPLACEMENT RECOMMENDED & RECURRING REPAIR
  {
    id: 'ast-9',
    tag: 'LT-0911',
    type: 'Laptop',
    brand: 'Dell',
    model: 'Latitude 7400',
    status: 'IN_USE',
    owner_id: 'usr-4',
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 16,
    storage: 256,
    cpu: 'Intel Core i5-8365U',
    value: 42000,
    age_years: 4.8,
    health: 48,
    warranty_until: '2023-01-10',
    replacement_score: 86,
    repairs_count: 4,
  },
  {
    id: 'ast-10',
    tag: 'LT-1041',
    type: 'Laptop',
    brand: 'Lenovo',
    model: 'ThinkPad T490',
    status: 'REPAIR',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 16,
    storage: 512,
    cpu: 'Intel Core i7-8565U',
    value: 39000,
    age_years: 4.5,
    health: 52,
    warranty_until: '2023-05-18',
    replacement_score: 84,
    repairs_count: 3,
  },
  {
    id: 'ast-11',
    tag: 'LT-0889',
    type: 'Laptop',
    brand: 'HP',
    model: 'EliteBook 840 G6',
    status: 'RETIRED',
    owner_id: null,
    department: 'Operations',
    location: 'Bengaluru',
    ram: 8,
    storage: 256,
    cpu: 'Intel Core i5-8265U',
    value: 25000,
    age_years: 5.4,
    health: 30,
    warranty_until: '2022-09-01',
    replacement_score: 95,
    repairs_count: 5,
  },

  // Desktops & Workstations
  {
    id: 'ast-12',
    tag: 'DK-2001',
    type: 'Desktop',
    brand: 'Apple',
    model: 'Mac Studio M2 Ultra',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 64,
    storage: 2048,
    cpu: 'Apple M2 Ultra 24-core',
    value: 419900,
    age_years: 0.9,
    health: 98,
    warranty_until: '2027-01-10',
    replacement_score: 6,
    repairs_count: 0,
  },
  {
    id: 'ast-13',
    tag: 'DK-2002',
    type: 'Desktop',
    brand: 'Dell',
    model: 'Precision 3660 Tower',
    status: 'IN_USE',
    owner_id: 'usr-5',
    department: 'Design',
    location: 'Bengaluru',
    ram: 32,
    storage: 1024,
    cpu: 'Intel Core i7-13700 RTX 4000',
    value: 245000,
    age_years: 1.2,
    health: 93,
    warranty_until: '2026-12-05',
    replacement_score: 15,
    repairs_count: 0,
  },

  // Monitors
  {
    id: 'ast-14',
    tag: 'MN-3001',
    type: 'Monitor',
    brand: 'Dell',
    model: 'UltraSharp U2723QE 4K',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 0,
    storage: 0,
    cpu: 'N/A',
    value: 58000,
    age_years: 1.0,
    health: 96,
    warranty_until: '2027-03-15',
    replacement_score: 10,
    repairs_count: 0,
  },
  {
    id: 'ast-15',
    tag: 'MN-3002',
    type: 'Monitor',
    brand: 'Dell',
    model: 'UltraSharp U3223QE 4K',
    status: 'IN_USE',
    owner_id: 'usr-1',
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 0,
    storage: 0,
    cpu: 'N/A',
    value: 82000,
    age_years: 1.1,
    health: 94,
    warranty_until: '2027-02-01',
    replacement_score: 12,
    repairs_count: 0,
  },
  {
    id: 'ast-16',
    tag: 'MN-3003',
    type: 'Monitor',
    brand: 'LG',
    model: 'UltraFine 27" 4K',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Design',
    location: 'Bengaluru',
    ram: 0,
    storage: 0,
    cpu: 'N/A',
    value: 39500,
    age_years: 1.5,
    health: 90,
    warranty_until: '2026-08-20',
    replacement_score: 20,
    repairs_count: 0,
  },

  // Tablets & Mobile
  {
    id: 'ast-17',
    tag: 'TB-4001',
    type: 'Tablet',
    brand: 'Apple',
    model: 'iPad Pro 11" M2',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 8,
    storage: 256,
    cpu: 'Apple M2',
    value: 79900,
    age_years: 1.2,
    health: 93,
    warranty_until: '2026-10-12',
    replacement_score: 14,
    repairs_count: 0,
  },
  {
    id: 'ast-18',
    tag: 'PH-5001',
    type: 'Phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro 256GB',
    status: 'IN_USE',
    owner_id: 'usr-3',
    department: 'IT Operations',
    location: 'Bengaluru',
    ram: 8,
    storage: 256,
    cpu: 'A17 Pro',
    value: 129900,
    age_years: 1.0,
    health: 95,
    warranty_until: '2026-11-01',
    replacement_score: 10,
    repairs_count: 0,
  },

  // Peripherals (Docks, Headsets, Keyboards)
  {
    id: 'ast-19',
    tag: 'DC-6001',
    type: 'Dock',
    brand: 'CalDigit',
    model: 'TS4 Thunderbolt 4',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 0,
    storage: 0,
    cpu: 'N/A',
    value: 36000,
    age_years: 0.8,
    health: 98,
    warranty_until: '2027-04-10',
    replacement_score: 6,
    repairs_count: 0,
  },
  {
    id: 'ast-20',
    tag: 'HS-7001',
    type: 'Headset',
    brand: 'Sony',
    model: 'WH-1000XM5 ANC',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 0,
    storage: 0,
    cpu: 'N/A',
    value: 26990,
    age_years: 0.7,
    health: 97,
    warranty_until: '2027-05-15',
    replacement_score: 8,
    repairs_count: 0,
  },
  {
    id: 'ast-21',
    tag: 'KB-8001',
    type: 'Keyboard',
    brand: 'Logitech',
    model: 'MX Keys S Wireless',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 0,
    storage: 0,
    cpu: 'N/A',
    value: 10500,
    age_years: 0.5,
    health: 99,
    warranty_until: '2027-08-01',
    replacement_score: 4,
    repairs_count: 0,
  },
  {
    id: 'ast-22',
    tag: 'MS-8501',
    type: 'Mouse',
    brand: 'Logitech',
    model: 'MX Master 3S',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 0,
    storage: 0,
    cpu: 'N/A',
    value: 9400,
    age_years: 0.5,
    health: 99,
    warranty_until: '2027-08-01',
    replacement_score: 4,
    repairs_count: 0,
  },
  {
    id: 'ast-23',
    tag: 'LT-1050',
    type: 'Laptop',
    brand: 'Dell',
    model: 'Vostro 3520',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Finance',
    location: 'Mumbai',
    ram: 16,
    storage: 512,
    cpu: 'Intel Core i5-1235U',
    value: 47990,
    age_years: 1.2,
    health: 91,
    warranty_until: '2026-10-30',
    replacement_score: 20,
    repairs_count: 0,
  },
  {
    id: 'ast-24',
    tag: 'LT-1051',
    type: 'Laptop',
    brand: 'Lenovo',
    model: 'IdeaPad 5 Pro',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 16,
    storage: 512,
    cpu: 'AMD Ryzen 5 7530U',
    value: 49500,
    age_years: 1.3,
    health: 90,
    warranty_until: '2026-09-15',
    replacement_score: 21,
    repairs_count: 0,
  },
  {
    id: 'ast-25',
    tag: 'LT-1052',
    type: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro 14" M2 Pro',
    status: 'AVAILABLE',
    owner_id: null,
    department: 'Engineering',
    location: 'Bengaluru',
    ram: 16,
    storage: 512,
    cpu: 'Apple M2 Pro',
    value: 179900,
    age_years: 1.6,
    health: 90,
    warranty_until: '2026-06-25',
    replacement_score: 24,
    repairs_count: 0,
  },
];

export const INITIAL_REQUESTS: AssetRequest[] = [
  {
    id: 'req-1024',
    code: 'REQ-1024',
    requester_id: 'usr-1',
    asset_type: 'Laptop',
    purpose: 'Software Development',
    department: 'Engineering',
    duration: '12 months',
    min_ram: 16,
    min_storage: 512,
    cpu_requirement: 'Any',
    preferred_location: 'Bengaluru',
    justification: 'Standard developer equipment for new sprint deliverables.',
    status: 'COMPLETED',
    risk: 'LOW',
    reason: 'Auto-approved by policy',
    recommended_asset_id: 'ast-7',
    auto_approved: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'req-1025',
    code: 'REQ-1025',
    requester_id: 'usr-4',
    asset_type: 'Laptop',
    purpose: 'Data Analysis',
    department: 'Engineering',
    duration: '6 months',
    min_ram: 32,
    min_storage: 1024,
    cpu_requirement: 'Intel Core i9',
    preferred_location: 'Bengaluru',
    justification: 'High-performance computing required for local LLM evaluation and PyTorch fine-tuning.',
    status: 'APPROVAL_REQUIRED',
    risk: 'MEDIUM',
    reason: 'High-value or above-standard requirement',
    recommended_asset_id: 'ast-6',
    auto_approved: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'req-1026',
    code: 'REQ-1026',
    requester_id: 'usr-5',
    asset_type: 'Laptop',
    purpose: 'Design',
    department: 'Design',
    duration: '12 months',
    min_ram: 128,
    min_storage: 2048,
    cpu_requirement: 'Xeon',
    preferred_location: 'Bengaluru',
    justification: 'Restricted high-memory configuration requested without enterprise budget sign-off.',
    status: 'APPROVAL_REQUIRED',
    risk: 'HIGH',
    reason: 'Policy violation or restricted requirement',
    recommended_asset_id: null,
    auto_approved: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const INITIAL_APPROVALS: Approval[] = [
  {
    id: 'appr-1',
    request_id: 'req-1025',
    approver_id: null,
    status: 'PENDING',
    reason: 'High-value or above-standard requirement (Dell Precision 5680)',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'appr-2',
    request_id: 'req-1026',
    approver_id: null,
    status: 'PENDING',
    reason: 'Policy violation or restricted requirement (>128GB RAM requested)',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const INITIAL_ASSIGNMENTS: AssetAssignment[] = [
  {
    id: 'asgn-1',
    asset_id: 'ast-7',
    user_id: 'usr-1',
    request_id: 'req-1024',
    assigned_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'asgn-2',
    asset_id: 'ast-8',
    user_id: 'usr-2',
    request_id: null,
    assigned_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
  },
  {
    id: 'asgn-3',
    asset_id: 'ast-9',
    user_id: 'usr-4',
    request_id: null,
    assigned_at: new Date(Date.now() - 3600000 * 24 * 300).toISOString(),
  },
  {
    id: 'asgn-4',
    asset_id: 'ast-13',
    user_id: 'usr-5',
    request_id: null,
    assigned_at: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
  },
  {
    id: 'asgn-5',
    asset_id: 'ast-15',
    user_id: 'usr-1',
    request_id: null,
    assigned_at: new Date(Date.now() - 3600000 * 24 * 120).toISOString(),
  },
  {
    id: 'asgn-6',
    asset_id: 'ast-18',
    user_id: 'usr-3',
    request_id: null,
    assigned_at: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
  },
];

export const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: 'trf-1',
    asset_id: 'ast-15',
    from_user_id: 'usr-1',
    to_user_id: 'usr-4',
    reason: 'Departmental project handover to Hyderabad team',
    status: 'PENDING_MANAGER_APPROVAL',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export const INITIAL_REPAIRS: Repair[] = [
  // Recurring issue on LT-0911 (Battery Failure 3 times!)
  {
    id: 'rep-1',
    asset_id: 'ast-9',
    issue: 'Battery Failure',
    cost: 8500,
    status: 'COMPLETED',
    repair_date: '2025-08-14',
  },
  {
    id: 'rep-2',
    asset_id: 'ast-9',
    issue: 'Battery Failure',
    cost: 9200,
    status: 'COMPLETED',
    repair_date: '2025-12-02',
  },
  {
    id: 'rep-3',
    asset_id: 'ast-9',
    issue: 'Battery Failure',
    cost: 9000,
    status: 'COMPLETED',
    repair_date: '2026-04-19',
  },
  {
    id: 'rep-4',
    asset_id: 'ast-9',
    issue: 'Display Backlight Flicker',
    cost: 14000,
    status: 'COMPLETED',
    repair_date: '2026-08-11',
  },
  // LT-1041 repairs
  {
    id: 'rep-5',
    asset_id: 'ast-10',
    issue: 'Motherboard Power Rail Failure',
    cost: 16500,
    status: 'IN_PROGRESS',
    repair_date: '2026-09-28',
  },
  {
    id: 'rep-6',
    asset_id: 'ast-10',
    issue: 'Keyboard Keypad Sticking',
    cost: 4500,
    status: 'COMPLETED',
    repair_date: '2025-11-10',
  },
];

export const INITIAL_AGENT_EVENTS: AgentEvent[] = [
  {
    id: 'evt-1',
    request_id: 'req-1024',
    agent: 'Orchestrator Agent',
    tool: 'Request Triage',
    stage: 'Request',
    status: 'SUCCESS',
    result: 'Request received and routed to Policy Agent',
    duration: 85,
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 1000).toISOString(),
  },
  {
    id: 'evt-2',
    request_id: 'req-1024',
    agent: 'Policy Agent',
    tool: 'Policy Check',
    stage: 'Policy',
    status: 'SUCCESS',
    result: 'Standard asset policy matched (Under ₹50,000 threshold eligible)',
    duration: 110,
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 2000).toISOString(),
  },
  {
    id: 'evt-3',
    request_id: 'req-1024',
    agent: 'Inventory Agent',
    tool: 'Asset Search',
    stage: 'Inventory',
    status: 'SUCCESS',
    result: '4 compatible assets found; LT-1043 ranked highest at 94% match',
    duration: 145,
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 3000).toISOString(),
  },
  {
    id: 'evt-4',
    request_id: 'req-1024',
    agent: 'Risk Agent',
    tool: 'Risk Evaluation',
    stage: 'Risk',
    status: 'SUCCESS',
    result: 'LOW risk — Standard policy compliant request',
    duration: 95,
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 4000).toISOString(),
  },
  {
    id: 'evt-5',
    request_id: 'req-1024',
    agent: 'Policy Agent',
    tool: 'Approval Decision',
    stage: 'Approval',
    status: 'SUCCESS',
    result: 'Auto-approved by policy',
    duration: 80,
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 5000).toISOString(),
  },
  {
    id: 'evt-6',
    request_id: 'req-1024',
    agent: 'Assignment Agent',
    tool: 'Asset Assignment',
    stage: 'Assignment',
    status: 'SUCCESS',
    result: 'LT-1042 reserved and assigned to Alex Rivera',
    duration: 125,
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 6000).toISOString(),
  },
  {
    id: 'evt-7',
    request_id: 'req-1024',
    agent: 'Orchestrator Agent',
    tool: 'Audit Logging',
    stage: 'Completed',
    status: 'SUCCESS',
    result: 'Workflow completed successfully and asset assigned',
    duration: 75,
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 7000).toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    actor_id: 'usr-1',
    actor: 'Alex Rivera',
    role: 'employee',
    agent: '',
    action: 'REQUEST_CREATED',
    resource: 'request',
    resource_id: 'REQ-1024',
    details: 'Laptop request created for Software Development',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'aud-2',
    actor_id: 'usr-1',
    actor: 'Alex Rivera',
    role: 'employee',
    agent: 'Policy Agent',
    action: 'AUTO_APPROVED',
    resource: 'request',
    resource_id: 'REQ-1024',
    details: 'LOW risk — auto-approved by enterprise policy',
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 5000).toISOString(),
  },
  {
    id: 'aud-3',
    actor_id: 'usr-1',
    actor: 'Alex Rivera',
    role: 'employee',
    agent: 'Assignment Agent',
    action: 'ASSET_ASSIGNED',
    resource: 'asset',
    resource_id: 'LT-1042',
    details: 'LT-1042 assigned to Alex Rivera for REQ-1024',
    created_at: new Date(Date.now() - 3600000 * 24 * 3 + 6000).toISOString(),
  },
  {
    id: 'aud-4',
    actor_id: 'usr-3',
    actor: 'David Miller',
    role: 'admin',
    agent: 'Lifecycle Agent',
    action: 'REPLACEMENT_RECOMMENDED',
    resource: 'asset',
    resource_id: 'LT-0911',
    details: 'Recurring battery failure (3 occurrences); replacement score 86',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
];

export class StorageService {
  private static load(): StorageData {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: StorageData = {
        profiles: INITIAL_PROFILES,
        assets: INITIAL_ASSETS,
        asset_requests: INITIAL_REQUESTS,
        approvals: INITIAL_APPROVALS,
        asset_assignments: INITIAL_ASSIGNMENTS,
        transfers: INITIAL_TRANSFERS,
        repairs: INITIAL_REPAIRS,
        agent_events: INITIAL_AGENT_EVENTS,
        audit_logs: INITIAL_AUDIT_LOGS,
        currentUser: INITIAL_PROFILES[0], // default to Employee
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return this.load();
    }
  }

  private static save(data: StorageData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  public static getData(): StorageData {
    return this.load();
  }

  public static resetDemo(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  public static getCurrentUser(): Profile {
    const data = this.load();
    return data.currentUser || INITIAL_PROFILES[0];
  }

  public static setCurrentUser(profile: Profile): void {
    const data = this.load();
    data.currentUser = profile;
    this.save(data);
  }

  public static updateAsset(id: string, updates: Partial<Asset>): Asset {
    const data = this.load();
    const idx = data.assets.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Asset ${id} not found`);
    data.assets[idx] = { ...data.assets[idx], ...updates };
    this.save(data);
    return data.assets[idx];
  }

  public static updateRequest(id: string, updates: Partial<AssetRequest>): AssetRequest {
    const data = this.load();
    const idx = data.asset_requests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Request ${id} not found`);
    data.asset_requests[idx] = { ...data.asset_requests[idx], ...updates };
    this.save(data);
    return data.asset_requests[idx];
  }

  public static addRequest(req: AssetRequest): void {
    const data = this.load();
    data.asset_requests.unshift(req);
    this.save(data);
  }

  public static addApproval(appr: Approval): void {
    const data = this.load();
    data.approvals.unshift(appr);
    this.save(data);
  }

  public static updateApproval(requestId: string, updates: Partial<Approval>): void {
    const data = this.load();
    const idx = data.approvals.findIndex((a) => a.request_id === requestId && a.status === 'PENDING');
    if (idx !== -1) {
      data.approvals[idx] = { ...data.approvals[idx], ...updates };
      this.save(data);
    }
  }

  public static addAgentEvent(event: AgentEvent): void {
    const data = this.load();
    data.agent_events.unshift(event);
    this.save(data);
  }

  public static addAuditLog(log: AuditLog): void {
    const data = this.load();
    data.audit_logs.unshift(log);
    this.save(data);
  }

  public static addAssignment(assignment: AssetAssignment): void {
    const data = this.load();
    data.asset_assignments.unshift(assignment);
    this.save(data);
  }

  public static addTransfer(transfer: Transfer): void {
    const data = this.load();
    data.transfers.unshift(transfer);
    this.save(data);
  }

  public static updateTransfer(id: string, updates: Partial<Transfer>): void {
    const data = this.load();
    const idx = data.transfers.findIndex((t) => t.id === id);
    if (idx !== -1) {
      data.transfers[idx] = { ...data.transfers[idx], ...updates };
      this.save(data);
    }
  }

  public static updateUserRole(userId: string, newRole: AppRole): void {
    const data = this.load();
    const idx = data.profiles.findIndex((p) => p.id === userId);
    if (idx !== -1) {
      data.profiles[idx].role = newRole;
      if (data.currentUser?.id === userId) {
        data.currentUser.role = newRole;
      }
      this.save(data);
    }
  }
}
