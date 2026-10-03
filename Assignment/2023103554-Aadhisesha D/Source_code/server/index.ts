import express from 'express';
import { handlePlacementAnalysis } from './placementAnalysis';
import type { PlacementRequest, TrainingRequest } from '../src/types/placement';
import { evaluateTrainingAnswer, generateTrainingQuestion } from './training';
import { GeminiRequestError, getGeminiConfig, loadLocalEnvironment } from './gemini';

loadLocalEnvironment();

const app = express();
const port = Number(process.env.PORT || 8787);
app.use(express.json({ limit: '1mb' }));

function health() {
  const config = getGeminiConfig();
  return { status: 'ok', provider: 'gemini', model: config.model, apiKeyConfigured: Boolean(config.apiKey) };
}

app.get('/api/health', (_req, res) => res.json(health()));

function sendError(res: express.Response, error: unknown, context: string) {
  const safeError = error instanceof GeminiRequestError
    ? { statusCode: error.statusCode, message: error.message }
    : { statusCode: 500, message: 'The request could not be completed. Please check the input and retry.' };
  if (error instanceof GeminiRequestError) console.warn(`${context}: Gemini request failed with status ${error.statusCode}.`);
  else console.error(`${context}: request failed (${error instanceof Error ? error.name : 'unknown error'}).`);
  if (safeError.statusCode === 400) return res.status(400).json({ error: safeError.message });
  return res.status(safeError.statusCode).json({ error: safeError.message });
}

app.post('/api/placement-analysis', async (req, res) => {
  try {
    res.json(await handlePlacementAnalysis(req.body as PlacementRequest));
  } catch (error) {
    sendError(res, error, 'Placement analysis');
  }
});

app.post('/api/training-question', async (req, res) => {
  try {
    const payload = req.body as TrainingRequest;
    const result = payload.mode === 'evaluate'
      ? await evaluateTrainingAnswer(payload)
      : await generateTrainingQuestion(payload);
    res.json(result);
  } catch (error) {
    sendError(res, error, 'Training request');
  }
});

app.listen(port, '127.0.0.1', () => {
  const config = getGeminiConfig();
  console.log(`PlacementPilot API running at http://127.0.0.1:${port}`);
  console.log(`  GEMINI_API_KEY: ${config.apiKey ? 'loaded' : 'missing'}`);
  console.log(`  MODEL:          ${config.model}`);
  console.log(`  BASE URL:       ${config.baseUrl}`);
});
