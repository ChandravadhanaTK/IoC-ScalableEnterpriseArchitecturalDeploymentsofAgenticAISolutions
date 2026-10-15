import { useSyncExternalStore } from "react";
import {
  buildFollowUpSteps,
  buildSbar,
  buildSoap,
  classify,
  type Classification,
  type Intake,
  type Msg,
  type Sbar,
  type Soap,
} from "./triage-engine";

export type Appointment = {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  visitType: "In-Person" | "Telehealth";
  insurance: string;
  fhirId: string;
};

export type Encounter = {
  id: string;
  patient: string;
  age: number;
  mrn: string;
  intake: Intake;
  cls: Classification;
  transcript: Msg[];
  soap: Soap;
  sbar: Sbar;
  status: "Awaiting review" | "Approved" | "ED escalation";
  createdAt: string;
  appointment?: Appointment;
};

export type FollowStep = {
  label: string;
  offset: string;
  channel: "SMS" | "Email" | "Portal";
  message: string;
  status: "scheduled" | "sent" | "responded";
};

export type FollowUp = {
  id: string;
  encounterId: string;
  patient: string;
  cls: Classification;
  steps: FollowStep[];
  escalated: boolean;
};

export type Alert = { id: string; patient: string; text: string; at: string; channel: string };

type State = { encounters: Encounter[]; followUps: FollowUp[]; alerts: Alert[] };

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export function makeEncounter(
  patient: string,
  age: number,
  intake: Intake,
  cls: Classification,
  transcript: Msg[],
  appointment?: Appointment,
): Encounter {
  return {
    id: uid("ENC"),
    patient,
    age,
    mrn: `MRN-${100000 + Math.floor(Math.random() * 899999)}`,
    intake,
    cls,
    transcript,
    soap: buildSoap(intake, cls, age),
    sbar: buildSbar(intake, cls, patient, age),
    status: cls.esi <= 2 ? "ED escalation" : "Awaiting review",
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ...(appointment ? { appointment } : {}),
  };
}

function seed(): State {
  const rows: [string, number, Intake, string, string][] = [
    [
      "James Whitaker",
      49,
      { complaint: "Persistent dry cough for two weeks, mild wheeze at night", onset: "2 weeks ago, stable", pain: 2, history: "Mild asthma, albuterol inhaler as needed" },
      "Dr. Hiro Tanaka",
      "10:30",
    ],
    [
      "Aisha Rahman",
      34,
      { complaint: "Fell on outstretched wrist, swollen and painful", onset: "This morning, worsening", pain: 7, history: "No conditions, no allergies" },
      "Dr. Samuel Brooks",
      "13:00",
    ],
    [
      "Dorothy Kim",
      71,
      { complaint: "Routine blood pressure follow-up, readings 138/86", onset: "Quarterly follow-up", pain: 0, history: "Hypertension, amlodipine 5mg daily, type 2 diabetes" },
      "Dr. Grace Whitfield",
      "09:00",
    ],
  ];
  const encounters = rows.map(([name, age, intake, doc, time]) => {
    const cls = classify(intake, age);
    const transcript: Msg[] = [
      { role: "agent", agent: "Symptom Triage Agent", text: "What's bothering you today?" },
      { role: "patient", text: intake.complaint },
      { role: "agent", agent: "Symptom Triage Agent", text: "When did this start?" },
      { role: "patient", text: intake.onset },
      { role: "agent", agent: "Symptom Triage Agent", text: "Pain 1–10?" },
      { role: "patient", text: String(intake.pain) },
      { role: "agent", agent: "Symptom Triage Agent", text: "Medical history or medications?" },
      { role: "patient", text: intake.history },
    ];
    return makeEncounter(name, age, intake, cls, transcript, {
      doctor: doc,
      specialty: cls.specialty,
      date: new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
      time,
      visitType: "In-Person",
      insurance: "BlueShield PPO",
      fhirId: uid("Appointment"),
    });
  });
  const followUps: FollowUp[] = encounters.map((e, i) => ({
    id: uid("FU"),
    encounterId: e.id,
    patient: e.patient,
    cls: e.cls,
    escalated: false,
    steps: buildFollowUpSteps(e.cls).map((s, j) => ({
      ...s,
      status: j < i ? (j === 0 ? "responded" : "sent") : "scheduled",
    })),
  }));
  return { encounters, followUps, alerts: [] };
}

let state: State = seed();
const listeners = new Set<() => void>();
const set = (fn: (s: State) => State) => {
  state = fn(state);
  listeners.forEach((l) => l());
};

export const store = {
  addEncounter: (e: Encounter) => set((s) => ({ ...s, encounters: [e, ...s.encounters] })),
  updateEncounter: (id: string, patch: Partial<Encounter>) =>
    set((s) => ({ ...s, encounters: s.encounters.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
  addFollowUp: (f: FollowUp) => set((s) => ({ ...s, followUps: [f, ...s.followUps] })),
  updateFollowUp: (id: string, patch: Partial<FollowUp>) =>
    set((s) => ({ ...s, followUps: s.followUps.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
  addAlert: (a: Alert) => set((s) => ({ ...s, alerts: [a, ...s.alerts] })),
};

export function useClinic() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
