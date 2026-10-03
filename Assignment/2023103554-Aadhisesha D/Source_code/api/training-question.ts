import type { VercelRequest, VercelResponse } from '@vercel/node';
import { evaluateTrainingAnswer, generateTrainingQuestion } from '../server/training.js';
import { clientError } from '../server/gemini.js';
import type { TrainingRequest } from '../src/types/placement';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const payload = req.body as TrainingRequest;
    const result = payload.mode === 'evaluate' ? await evaluateTrainingAnswer(payload) : await generateTrainingQuestion(payload);
    return res.status(200).json(result);
  } catch (error) {
    const safeError = clientError(error);
    if (safeError.statusCode >= 500) console.error(`Training request failed (${error instanceof Error ? error.name : 'unknown error'}).`);
    return res.status(safeError.statusCode).json({ error: safeError.message });
  }
}
