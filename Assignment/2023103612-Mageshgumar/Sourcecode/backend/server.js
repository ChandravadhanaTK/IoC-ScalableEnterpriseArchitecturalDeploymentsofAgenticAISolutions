import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, ensureSeedData, getDbStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (req, res) => {
  const dbMode = await getDbStatus();
  res.json({ status: 'ok', db: dbMode, timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

async function startServer() {
  await connectDB();
  await ensureSeedData();

  app.listen(port, () => {
    console.log(`Academic agent API running on http://localhost:${port}`);
  });
}

startServer();
