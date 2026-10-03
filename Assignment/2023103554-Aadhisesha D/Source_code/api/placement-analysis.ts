import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePlacementAnalysis } from '../server/placementAnalysis.js';
import { clientError } from '../server/gemini.js';
import type { PlacementRequest } from '../src/types/placement';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Request body must be a JSON object.' });
    const result = await handlePlacementAnalysis(req.body as PlacementRequest);
    return res.status(200).json(result);
  } catch (error) {
    const safeError = clientError(error);
    if (safeError.statusCode >= 500) console.error(`Placement analysis failed (${error instanceof Error ? error.stack || error.message : 'unknown error'}).`);
    return res.status(safeError.statusCode).json({ error: safeError.message });
  }
}
