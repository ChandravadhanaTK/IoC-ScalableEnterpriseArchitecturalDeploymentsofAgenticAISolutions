import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPipeline } from './orchestrator.js';
import { getApplications, createApplication, updateApplication, getReminders } from './agents/trackingAgent.js';
import { readDb } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const port = Number(process.env.PORT || 3000);

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 500000) throw new Error('Request too large');
  }
  return raw ? JSON.parse(raw) : {};
}

function serveStatic(req, res) {
  const requested = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const file = requested === '/' ? 'index.html' : requested.replace(/^\//, '');
  const safe = path.normalize(file).replace(/^\.\.(?:[\\/]|$)/, '');
  const full = path.join(publicDir, safe);
  if (!full.startsWith(publicDir)) return json(res, 403, { error: 'Forbidden' });
  fs.readFile(full, (err, data) => {
    if (err) return json(res, 404, { error: 'Not found' });
    const ext = path.extname(full);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    res.writeHead(200, { 'Content-Type': `${types[ext] || 'application/octet-stream'}; charset=utf-8` });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'CampusHire AI' });

    if (req.method === 'POST' && url.pathname === '/api/analyze') {
      const data = await body(req);
      if (!String(data.resume || '').trim() || !String(data.jobDescription || '').trim()) {
        return json(res, 400, { error: 'Resume and job description are required.' });
      }
      return json(res, 200, runPipeline(data));
    }

    if (req.method === 'GET' && url.pathname === '/api/applications') return json(res, 200, { applications: getApplications() });
    if (req.method === 'GET' && url.pathname === '/api/reminders') return json(res, 200, { reminders: getReminders() });

    if (req.method === 'POST' && url.pathname === '/api/applications') {
      const data = await body(req);
      return json(res, 201, createApplication(data));
    }

    const appMatch = url.pathname.match(/^\/api\/applications\/([^/]+)$/);
    if (req.method === 'PATCH' && appMatch) {
      const data = await body(req);
      const updated = updateApplication(appMatch[1], data);
      return updated ? json(res, 200, updated) : json(res, 404, { error: 'Application not found' });
    }

    if (req.method === 'GET' && url.pathname === '/api/monitoring') {
      const db = readDb();
      const traces = db.traces || [];
      const completed = traces.filter(t => t.status === 'COMPLETED').length;
      const failed = traces.filter(t => t.status === 'FAILED').length;
      return json(res, 200, {
        health: { totalRuns: traces.length, completed, failed, successRate: traces.length ? Math.round((completed / traces.length) * 100) : 100 },
        business: { applications: db.applications.length, reminders: getReminders().length },
        traces: traces.slice(-20).reverse()
      });
    }

    if (req.method === 'GET') return serveStatic(req, res);
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(port, () => {
  console.log(`CampusHire AI running at http://localhost:${port}`);
});
