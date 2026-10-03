import { Router } from 'express';
import {
  createIssue,
  getMyIssues,
  getAllIssues,
  getIssueById,
  trackIssue,
  updateIssue,
  getAdminStats,
  getStudentStats,
} from '../controllers/issueController.ts';
import { authenticateToken, requireRole } from '../middleware/auth.ts';

const router = Router();

// Public issue tracking by reference ID
router.get('/track/:issueId', trackIssue);

// Authenticated Student Routes
router.post('/', authenticateToken, createIssue);
router.get('/my', authenticateToken, getMyIssues);
router.get('/my/stats', authenticateToken, getStudentStats);

// Authenticated Admin Routes
router.get('/all', authenticateToken, requireRole(['admin']), getAllIssues);
router.get('/admin/stats', authenticateToken, requireRole(['admin']), getAdminStats);
router.put('/:id', authenticateToken, requireRole(['admin']), updateIssue);

// Detail route
router.get('/:id', authenticateToken, getIssueById);

export default router;
