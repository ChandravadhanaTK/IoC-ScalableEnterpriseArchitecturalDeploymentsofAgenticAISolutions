import { describe, it, expect } from "vitest";
import { questionAgent, evaluationAgent, studyPlannerAgent, mergeTopics, keywords, type Question } from "./agents";
const text = "Process scheduling decides which process runs on the processor next. Deadlock occurs when processes wait forever for resources held by each other. Virtual memory lets a process use more memory than the physical memory available. Paging divides memory into fixed size blocks called pages for allocation. Scheduling algorithms include round robin and priority scheduling for processes. Segmentation divides memory into logical segments of varying length sizes.";
describe("question agent", () => {
  it("generates the requested number", () => expect(questionAgent(text, "easy", 5).length).toBe(5));
  it("mcq contains answer", () => { const q = questionAgent(text, "easy", 6).find(x => x.type === "mcq")!; expect(q.options).toContain(q.answer); });
  it("extracts keywords", () => expect(keywords(text)).toContain("memory"));
});
describe("evaluation agent", () => {
  const qs: Question[] = [{ id: "1", type: "mcq", topic: "paging", prompt: "", options: ["a", "b"], answer: "a" }, { id: "2", type: "tf", topic: "deadlock", prompt: "", answer: "True" }];
  it("scores answers", () => { const r = evaluationAgent(qs, { "1": "a", "2": "False" }); expect(r.score).toBe(1); expect(r.accuracy).toBe(50); expect(r.weaknesses).toEqual(["deadlock"]); });
  it("short answer by keywords", () => { const q: Question = { id: "s", type: "short", topic: "t", prompt: "", answer: "", keywords: ["process", "memory"] }; expect(evaluationAgent([q], { s: "process uses memory" }).score).toBe(1); });
});
describe("study planner", () => {
  it("plans weak topics first", () => { const p = studyPlannerAgent({ deadlock: { correct: 0, total: 2 }, paging: { correct: 2, total: 2 } }); expect(p.weakTopics).toEqual(["deadlock"]); expect(p.tasks[0].day).toBe(1); });
  it("merges history", () => expect(mergeTopics([{ a: { correct: 1, total: 2 } }, { a: { correct: 1, total: 1 } }]).a).toEqual({ correct: 2, total: 3 }));
});
