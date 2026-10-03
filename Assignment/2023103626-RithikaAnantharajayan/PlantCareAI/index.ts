export type CareStatus = 'Healthy' | 'Care Due' | 'Overdue';
export type EnvironmentType = 'indoor' | 'outdoor';
export type TaskType = 'Water' | 'Check Soil' | 'Fertilize' | 'Prune' | 'Repot' | 'Mist';
export type TaskStatus = 'pending' | 'completed';

export interface Plant {
  id: string;
  userId: string;
  name: string;
  species: string;
  environment: EnvironmentType;
  location: string;
  lastWatered: string; // ISO date string YYYY-MM-DD
  wateringFrequency: number; // in days
  nextWateringDate: string; // ISO date string YYYY-MM-DD
  status: CareStatus;
  notes?: string;
  imageUrl?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CareTask {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  taskType: TaskType;
  dueDate: string; // ISO date string YYYY-MM-DD
  status: TaskStatus;
  completedAt?: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface CareRecord {
  id: string;
  userId: string;
  plantId: string;
  plantName: string;
  action: string; // e.g. "Watered", "Checked Soil", "Fertilized", "Pruned"
  date: string; // ISO date string YYYY-MM-DD
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface AIInteraction {
  id: string;
  userId: string;
  requestType: string;
  promptSummary: string;
  timestamp: string;
  success: boolean;
  durationMs: number;
  toolsUsed: string[];
  actionConfirmed?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  createdAt: string;
  isDemoUser?: boolean;
}

export interface SystemHealth {
  auth: 'Healthy' | 'Degraded' | 'Offline';
  database: 'Healthy' | 'Degraded' | 'Offline';
  aiAssistant: 'Healthy' | 'Degraded' | 'Offline';
  latencyMs: number;
  lastChecked: string;
}
