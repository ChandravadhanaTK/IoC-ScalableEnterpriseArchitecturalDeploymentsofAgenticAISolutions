export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
export type Level = (typeof LEVELS)[number];

export type UserSkill = { name: string; level: number }; // 1..4

export type SkillGap = {
  skill: string;
  required: number; // 1..4
  current: number; // 0..4
  gap: "None" | "Low" | "Medium" | "High";
  priority: "Low" | "Medium" | "High";
  category: "Technical" | "Supporting";
  reason: string;
};

export type ProposalChange = { type: "add" | "move" | "delay" | "note"; text: string };

export type NewTask = {
  phase_index: number;
  phase_title: string;
  milestone: string;
  title: string;
  description: string;
  skill: string;
  estimated_hours: number;
};

export function levelName(n: number) {
  return n <= 0 ? "None" : LEVELS[Math.min(4, n) - 1];
}
