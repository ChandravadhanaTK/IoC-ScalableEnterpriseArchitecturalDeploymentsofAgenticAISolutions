import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { seedDemoData } from './server/seed.ts';
import { createExpressApp } from './server/app.ts';
import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd ? parseInt(process.env.PORT || '8080', 10) : 3000;

async function startServer() {
  // Initialize Database (MongoDB / embedded persistent store)
  await db.init();

  // Populate Demo Data (1 Admin, 2 Students, 10 Issues) if needed
  await seedDemoData();

  const app = createExpressApp();

  if (!isProd) {
    // Development mode: mount Vite dev server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('Production mode enabled but dist directory not found. Please build the client.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusFix server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting CampusFix server:', err);
  process.exit(1);
});
