export type Priority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  estimatedMinutes: number;
  day: number;
  completed: boolean;
}

export interface Progress {
  total: number;
  completed: number;
  pending: number;
  percent: number;
}

export interface ActivityEntry {
  id: string;
  message: string;
  time: string;
  status: "done" | "running" | "error";
}
