import { 
  User, 
  Room, 
  Reservation, 
  WorkplaceRequest, 
  AuditEvent, 
  TelemetryMetrics 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_ROOMS, 
  INITIAL_RESERVATIONS, 
  INITIAL_REQUESTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_TELEMETRY 
} from '../data/initialData';

const KEYS = {
  CURRENT_USER: 'officeops_current_user_v1',
  ROOMS: 'officeops_rooms_v1',
  RESERVATIONS: 'officeops_reservations_v1',
  REQUESTS: 'officeops_requests_v1',
  AUDIT_LOGS: 'officeops_audit_logs_v1',
  TELEMETRY: 'officeops_telemetry_v1'
};

class MemoryStorage {
  private data: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.data[key] || null;
  }
  setItem(key: string, value: string): void {
    this.data[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.data[key];
  }
  clear(): void {
    this.data = {};
  }
}

const memoryStorage = new MemoryStorage();

function getStorageBackend() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return memoryStorage;
}

class StorageService {
  private listeners: Set<() => void> = new Set();
  private store = getStorageBackend();

  constructor() {
    this.initDefaults();
  }

  private initDefaults() {
    if (!this.store.getItem(KEYS.CURRENT_USER)) {
      this.store.setItem(KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    }
    if (!this.store.getItem(KEYS.ROOMS)) {
      this.store.setItem(KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    }
    if (!this.store.getItem(KEYS.RESERVATIONS)) {
      this.store.setItem(KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
    }
    if (!this.store.getItem(KEYS.REQUESTS)) {
      this.store.setItem(KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    }
    if (!this.store.getItem(KEYS.AUDIT_LOGS)) {
      this.store.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!this.store.getItem(KEYS.TELEMETRY)) {
      this.store.setItem(KEYS.TELEMETRY, JSON.stringify(INITIAL_TELEMETRY));
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // Users & Auth
  public getCurrentUser(): User {
    const raw = this.store.getItem(KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : INITIAL_USERS[0];
  }

  public setCurrentUser(user: User) {
    this.store.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    this.notify();
  }

  public getUsers(): User[] {
    return INITIAL_USERS;
  }

  // Rooms
  public getRooms(): Room[] {
    const raw = this.store.getItem(KEYS.ROOMS);
    return raw ? JSON.parse(raw) : INITIAL_ROOMS;
  }

  public updateRoom(updated: Room) {
    const rooms = this.getRooms();
    const index = rooms.findIndex((r) => r.id === updated.id);
    if (index !== -1) {
      rooms[index] = updated;
      this.store.setItem(KEYS.ROOMS, JSON.stringify(rooms));
      this.notify();
    }
  }

  // Reservations
  public getReservations(): Reservation[] {
    const raw = this.store.getItem(KEYS.RESERVATIONS);
    return raw ? JSON.parse(raw) : INITIAL_RESERVATIONS;
  }

  public addReservation(reservation: Reservation) {
    const reservations = this.getReservations();
    reservations.unshift(reservation);
    this.store.setItem(KEYS.RESERVATIONS, JSON.stringify(reservations));
    
    // Increment telemetry
    const telemetry = this.getTelemetry();
    telemetry.totalReservations += 1;
    this.setTelemetry(telemetry);

    this.notify();
  }

  // Workplace Requests
  public getRequests(): WorkplaceRequest[] {
    const raw = this.store.getItem(KEYS.REQUESTS);
    return raw ? JSON.parse(raw) : INITIAL_REQUESTS;
  }

  public addRequest(request: WorkplaceRequest) {
    const requests = this.getRequests();
    requests.unshift(request);
    this.store.setItem(KEYS.REQUESTS, JSON.stringify(requests));

    const telemetry = this.getTelemetry();
    telemetry.totalRequests += 1;
    this.setTelemetry(telemetry);

    this.notify();
  }

  public updateRequest(updated: WorkplaceRequest) {
    const requests = this.getRequests();
    const index = requests.findIndex((r) => r.id === updated.id);
    if (index !== -1) {
      requests[index] = updated;
      this.store.setItem(KEYS.REQUESTS, JSON.stringify(requests));
      this.notify();
    }
  }

  // Audit Logs
  public getAuditLogs(): AuditEvent[] {
    const raw = this.store.getItem(KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
  }

  public addAuditLog(entry: Omit<AuditEvent, 'id' | 'timestamp'>) {
    const logs = this.getAuditLogs();
    const newEntry: AuditEvent = {
      ...entry,
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newEntry);
    this.store.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100))); // keep latest 100
    this.notify();
    return newEntry;
  }

  // Telemetry
  public getTelemetry(): TelemetryMetrics {
    const raw = this.store.getItem(KEYS.TELEMETRY);
    return raw ? JSON.parse(raw) : INITIAL_TELEMETRY;
  }

  public setTelemetry(metrics: TelemetryMetrics) {
    this.store.setItem(KEYS.TELEMETRY, JSON.stringify(metrics));
    this.notify();
  }

  public recordAgentExecution(success: boolean, responseTimeMs: number) {
    const t = this.getTelemetry();
    t.agentExecutions += 1;
    if (success) {
      t.successCount += 1;
    } else {
      t.failureCount += 1;
    }
    // Exponential moving average for response time
    t.avgResponseTimeMs = Math.round(t.avgResponseTimeMs * 0.9 + responseTimeMs * 0.1);
    this.setTelemetry(t);
  }

  public resetAllData() {
    this.store.setItem(KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    this.store.setItem(KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    this.store.setItem(KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
    this.store.setItem(KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    this.store.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    this.store.setItem(KEYS.TELEMETRY, JSON.stringify(INITIAL_TELEMETRY));
    this.notify();
  }
}

export const storage = new StorageService();
