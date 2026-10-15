export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface CleanupTask {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  estimatedMinutes: number;
  status: TaskStatus;
}

export interface CleanupPlan {
  summary: string;
  totalEstimatedMinutes: number;
  tasks: CleanupTask[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}
