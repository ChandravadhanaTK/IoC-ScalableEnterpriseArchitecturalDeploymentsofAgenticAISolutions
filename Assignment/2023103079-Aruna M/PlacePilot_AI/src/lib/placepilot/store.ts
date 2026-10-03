import { useSyncExternalStore } from "react";
import type { AuditEntry, Opportunity, Student, Trace } from "./types";
import { DEFAULT_STUDENT, SAMPLES } from "./samples";
import { assemble, deterministicExtract } from "./engine";

export interface AppState {
  student: Student;
  opportunities: Opportunity[];
  traces: Trace[];
  audit: AuditEntry[];
}

const KEY = "placepilot.v1";
const EMPTY: AppState = { student: DEFAULT_STUDENT, opportunities: [], traces: [], audit: [] };
let state: AppState | null = null;
const listeners = new Set<() => void>();

function seed(): AppState {
  const raw = SAMPLES[0]!.text;
  const { opp, trace } = assemble(raw, deterministicExtract(raw), DEFAULT_STUDENT, "demo", null, 42, { in: 0, out: 0 });
  return { ...EMPTY, opportunities: [opp], traces: [trace] };
}

function load(): AppState {
  if (state) return state;
  try {
    const s = localStorage.getItem(KEY);
    state = s ? (JSON.parse(s) as AppState) : seed();
  } catch {
    state = seed();
  }
  return state;
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(load());
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function resetDemo() {
  state = seed();
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useApp(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    load,
    () => EMPTY,
  );
}

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const entryPayload = (e: Omit<AuditEntry, "hash">) => `${e.seq}|${e.at}|${e.actor}|${e.action}|${e.detail}|${e.prevHash}`;

export async function audit(actor: string, action: string, detail: string) {
  const s = load();
  const prev = s.audit[s.audit.length - 1];
  const base = { seq: (prev?.seq ?? 0) + 1, at: new Date().toISOString(), actor, action, detail, prevHash: prev?.hash ?? "GENESIS" };
  const hash = await sha256(entryPayload(base));
  setState((st) => ({ ...st, audit: [...st.audit, { ...base, hash }] }));
}

export async function verifyChain(entries: AuditEntry[]) {
  let prev = "GENESIS";
  for (const e of entries) {
    if (e.prevHash !== prev || (await sha256(entryPayload(e))) !== e.hash) return e.seq;
    prev = e.hash;
  }
  return null;
}
