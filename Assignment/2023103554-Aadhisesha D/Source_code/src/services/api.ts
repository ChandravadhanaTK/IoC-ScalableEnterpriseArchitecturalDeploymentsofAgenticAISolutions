import type { PlacementAnalysis, PlacementRequest, TrainingEvaluation, TrainingQuestion, TrainingRequest } from '../types/placement';

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  let body: unknown = null;
  try { body = await response.json(); } catch { /* handled below */ }
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'error' in body ? String((body as { error?: string }).error) : 'Request failed.';
    throw new Error(message);
  }
  return body as T;
}

export function runPlacementAnalysis(payload: PlacementRequest) {
  return postJson<PlacementAnalysis>('/api/placement-analysis', payload);
}

export function generateTrainingQuestion(payload: Omit<TrainingRequest, 'mode'> & { mode?: 'generate' }) {
  return postJson<TrainingQuestion>('/api/training-question', { ...payload, mode: 'generate' });
}

export function evaluateTrainingAnswer(payload: Omit<TrainingRequest, 'mode'> & { mode?: 'evaluate' }) {
  return postJson<TrainingEvaluation>('/api/training-question', { ...payload, mode: 'evaluate' });
}
