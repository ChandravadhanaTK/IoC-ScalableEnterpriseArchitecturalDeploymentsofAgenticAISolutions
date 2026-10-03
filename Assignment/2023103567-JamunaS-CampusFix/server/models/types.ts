export type UserRole = 'student' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string; // bcrypt hash
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

export interface IStatusHistoryItem {
  status: IssueStatus;
  changedBy: string; // User Name or "System"
  changedByRole: UserRole | 'system';
  timestamp: string;
  remarks?: string;
  department?: string;
}

export interface IIssue {
  _id: string;
  issueId: string; // e.g. CF-2026-1001
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
  statusHistory: IStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
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
