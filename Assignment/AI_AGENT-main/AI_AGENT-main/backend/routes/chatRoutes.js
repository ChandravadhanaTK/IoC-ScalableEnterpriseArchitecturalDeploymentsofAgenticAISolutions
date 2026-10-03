import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { runAcademicAgent } from '../../ai/agent/orchestrator.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { message, conversationMemory = {} } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const result = await runAcademicAgent({
      studentId: req.user.studentId || req.user.id,
      message,
      conversationMemory,
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to process message.' });
  }
});

export default router;
