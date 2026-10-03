import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import issueRoutes from './routes/issueRoutes.ts';
import notificationRoutes from './routes/notificationRoutes.ts';
import aiRoutes from './routes/aiRoutes.ts';

export function createExpressApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/ai', aiRoutes);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'CampusFix API',
      timestamp: new Date().toISOString(),
    });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      error: 'An unexpected server error occurred. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}
