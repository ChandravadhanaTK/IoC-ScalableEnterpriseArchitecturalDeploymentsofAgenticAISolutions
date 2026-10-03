import { Router } from 'express';
import { handleAIClassify } from '../controllers/aiController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

// Allows students & admins to query classification suggestions
router.post('/classify', authenticateToken, handleAIClassify);

export default router;
