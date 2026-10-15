import type { CleanupPlan } from '../types';

const STORAGE_KEYS = {
  roomDescription: 'room-organization-assistant:roomDescription',
  cleanupPlan: 'room-organization-assistant:cleanupPlan',
};

export function loadRoomDescription(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.roomDescription) ?? '';
  } catch {
    return '';
  }
}

export function saveRoomDescription(description: string): void {
  try {
    if (!description.trim()) {
      localStorage.removeItem(STORAGE_KEYS.roomDescription);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.roomDescription, description.trim());
  } catch {
    // Ignore localStorage failures gracefully.
  }
}

export function loadCleanupPlan(): CleanupPlan | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.cleanupPlan);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as CleanupPlan;
    if (!parsed || !Array.isArray(parsed.tasks)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveCleanupPlan(plan: CleanupPlan): void {
  try {
    localStorage.setItem(STORAGE_KEYS.cleanupPlan, JSON.stringify(plan));
  } catch {
    // Ignore localStorage failures gracefully.
  }
}

export function clearAllCleanupData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.cleanupPlan);
    localStorage.removeItem(STORAGE_KEYS.roomDescription);
  } catch {
    // Ignore localStorage failures gracefully.
  }
}
