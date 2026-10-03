import type { PlacementAnalysis, PlacementRequest, StoredRun, TrainingEvaluation, QuestionType } from '../types/placement';

const KEY = 'placementpilot-state-v2';

type TrainingAttempt = { id: string; createdAt: string; score: number; type: QuestionType; role: string; verdict: TrainingEvaluation['verdict'] };
type LocalState = { profile?: { name: string; careerGoal: string }; resumeText?: string; jobDescription?: string; lastAnalysis?: PlacementAnalysis; recentRuns: StoredRun[]; trainingAttempts: TrainingAttempt[] };
const defaultState: LocalState = { recentRuns: [], trainingAttempts: [] };

function readState(): LocalState {
  try { const raw = localStorage.getItem(KEY); return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState }; }
  catch { return { ...defaultState }; }
}
function writeState(state: LocalState) { localStorage.setItem(KEY, JSON.stringify(state)); }

export function saveSession(request: PlacementRequest) { const state = readState(); state.resumeText = request.resumeText; state.jobDescription = request.jobDescription; state.profile = state.profile ?? { name: '', careerGoal: request.careerGoal }; state.profile.careerGoal = request.careerGoal; writeState(state); }
export function saveAnalysis(analysis: PlacementAnalysis) {
  const state = readState(); state.lastAnalysis = analysis; state.recentRuns = [{ id: analysis.agentRun.runId, createdAt: analysis.generatedAt, jobTitle: analysis.job.role, company: analysis.job.company || 'Target role', matchPercentage: analysis.skillGap.matchPercentage, steps: analysis.agentRun.steps }, ...state.recentRuns.filter((run) => run.id !== analysis.agentRun.runId)].slice(0, 8); writeState(state);
}
export function saveTrainingAttempt(attempt: TrainingAttempt) { const state = readState(); state.trainingAttempts = [attempt, ...state.trainingAttempts].slice(0, 40); writeState(state); }
export function loadState(): LocalState { return readState(); }
export function clearState() { localStorage.removeItem(KEY); }
