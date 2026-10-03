import { createSeedState, STATE_VERSION } from "@/data/seed";
import type { AppState } from "@/types";

/**
 * Persistence adapter.
 * Mode "local": browser LocalStorage (zero-config fallback, survives refresh).
 * A remote adapter (Supabase/PostgreSQL) can implement the same load/save
 * contract; it is selected only when VITE_SUPABASE_URL is configured.
 */
const STORAGE_KEY = "supplychainiq:state:v1";
const MAX_TELEMETRY = 3000;

export type PersistenceMode = "local" | "memory";

let state: AppState | null = null;
let draft: AppState | null = null;
let mode: PersistenceMode = "memory";
const listeners = new Set<() => void>();

function load(): AppState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    mode = "local";
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    mode = "memory";
  }
  return createSeedState();
}

function save(s: AppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    mode = "local";
  } catch {
    mode = "memory";
  }
}

function commit(next: AppState) {
  if (next.telemetry.length > MAX_TELEMETRY) next.telemetry = next.telemetry.slice(-MAX_TELEMETRY);
  state = next;
  save(next);
  listeners.forEach((l) => l());
}

export function getState(): AppState {
  if (draft) return draft;
  if (!state) state = load();
  return state;
}

/** Apply a mutation. Inside a transaction it targets the transaction draft. */
export function mutate(fn: (s: AppState) => void): void {
  if (draft) {
    fn(draft);
    return;
  }
  const next = structuredClone(getState());
  fn(next);
  commit(next);
}

/**
 * Atomic unit of work: all mutations inside `fn` commit together or not at all
 * (used for Approval + PO creation + workflow state + audit event).
 */
let durableQueue: Array<(s: AppState) => void> = [];

export function transaction<T>(fn: () => T): T {
  if (draft) return fn();
  draft = structuredClone(getState());
  durableQueue = [];
  try {
    const result = fn();
    const d = draft;
    draft = null;
    durableQueue = [];
    commit(d);
    return result;
  } catch (e) {
    draft = null;
    const replay = durableQueue;
    durableQueue = [];
    // Failure evidence (failed tool calls, telemetry, consumed faults) must survive rollback.
    if (replay.length) mutate((s) => replay.forEach((f) => f(s)));
    throw e;
  }
}

/** Like mutate, but the write is preserved even if the surrounding transaction rolls back. */
export function mutateDurable(fn: (s: AppState) => void): void {
  if (draft) durableQueue.push(fn);
  mutate(fn);
}

export function nextId(prefix: string): string {
  let id = "";
  mutate((s) => {
    s.counters.id += 1;
    id = `${prefix}_${s.counters.id.toString(36).padStart(5, "0")}`;
  });
  return id;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function replaceWithSeed(): void {
  draft = null;
  commit(createSeedState());
}

export function getPersistenceMode(): PersistenceMode {
  return mode;
}
