export type UserRole = 'student' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  role: UserRole;
  createdAt: string;
}

export type IssueCategory =
  | 'Hostel'
  | 'Classroom'
  | 'Laboratory'
  | 'Library'
  | 'Canteen'
  | 'Transport'
  | 'Electricity'
  | 'Water'
  | 'Internet'
  | 'Cleanliness'
  | 'Other';

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected';

export interface StatusHistoryItem {
  status: IssueStatus;
  changedBy: string;
  changedByRole: UserRole | 'system';
  timestamp: string;
  remarks?: string;
  department?: string;
}

export interface Issue {
  _id: string;
  issueId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentDepartment: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  priority: IssuePriority;
  status: IssueStatus;
  assignedDepartment: string;
  adminRemarks: string;
  imageUrl?: string;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  message: string;
  type: 'submission' | 'assigned' | 'status_change' | 'resolved' | 'remark' | 'system';
  issueId?: string;
  read: boolean;
  createdAt: string;
}

export interface AIClassificationResult {
  category: IssueCategory;
  priority: IssuePriority;
  department: string;
  reasoning: string;
  confidence: number;
}

export interface AdminStats {
  totalIssues: number;
  pending: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  critical: number;
  resolutionRate: number;
}

export interface StudentStats {
  totalIssues: number;
  pending: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}
