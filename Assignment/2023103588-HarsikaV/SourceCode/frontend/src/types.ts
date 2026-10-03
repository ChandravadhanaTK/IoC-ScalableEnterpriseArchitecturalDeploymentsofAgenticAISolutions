export type Role = 'student' | 'staff' | 'maintenance' | 'admin';

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  role: Role;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category?: string;
  priority?: string;
  location: string;
  building?: string;
  room_number?: string;
  status: string;
  assigned_team_id?: number | null;
  assigned_to_id?: number | null;
  reporter_id?: number;
  ai_reasoning?: string;
  suggested_resolution?: string;
  resolution_notes?: string;
  confidence?: string;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
}

export interface AnalysisSummary {
  total_tickets: number;
  open_tickets: number;
  high_priority_tickets: number;
  critical_tickets: number;
  resolved_tickets: number;
  average_resolution_time_days: number;
  ai_analysis_success_rate: number;
  tickets_by_category: Array<{ name: string; count: number }>;
  tickets_by_priority: Array<{ name: string; count: number }>;
  tickets_by_status: Array<{ name: string; count: number }>;
}
