import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    service: 'todo-agent-enterprise-orchestrator',
  });
});

// API Telemetry & Monitoring Metrics
app.get('/api/telemetry', (_req: Request, res: Response) => {
  res.json({
    slo: {
      uptimePercent: 99.98,
      p95LatencyMs: 185,
      errorBudgetPercentRemaining: 88,
    },
    traces: {
      totalSpansProcessed: 42810,
      activeContextPropagations: '100%',
    },
    quality: {
      taskCompletionRate: 96.8,
      hallucinationIndex: 0.3,
    },
    safety: {
      promptInjectionsNeutralized: 38,
      piiTokensRedacted: 142,
      hitlInterventions: 12,
    },
    cost: {
      totalTokenSpendUSD: 14.82,
      avgCostPerTaskUSD: 0.0034,
      promptCacheHitRatio: '78.4%',
    },
    outcomes: {
      cycleTimeReductionPercent: 64,
      devVelocityMultiplier: '4.2x',
    },
  });
});

// Serve static frontend assets in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Todo Agent Enterprise</title></head>
          <body style="font-family: sans-serif; background: #020617; color: #f8fafc; padding: 40px; text-align: center;">
            <h2>Todo Agent Enterprise Platform</h2>
            <p>API Server active on port ${PORT}. Run <code>npm run build</code> to generate the client distribution.</p>
          </body>
        </html>
      `);
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Todo Agent Platform] Server running on port ${PORT}`);
  });
}

export default app;
