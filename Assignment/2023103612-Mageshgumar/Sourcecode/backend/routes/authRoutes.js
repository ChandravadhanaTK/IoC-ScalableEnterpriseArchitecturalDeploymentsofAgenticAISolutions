import express from 'express';
import bcrypt from 'bcryptjs';
import { loginUser } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { getCollection } from '../config/db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await loginUser(email, password);
    return res.json(result);
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Authentication failed.' });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await loginUser(email, password);
    if (result.user.role !== 'admin') {
      return res.status(403).json({ message: 'This account is not an admin account.' });
    }
    return res.json(result);
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Admin authentication failed.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const collection = await getCollection('users');
    const user = await collection.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.studentId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to load user profile.' });
  }
});

router.post('/seed-defaults', async (req, res) => {
  try {
    const collection = await getCollection('users');
    const existing = await collection.findOne({ email: 'student@college.edu' });
    if (!existing) {
      const passwordHash = await bcrypt.hash('student123', 10);
      await collection.insertOne({
        _id: 'user-student-1',
        email: 'student@college.edu',
        passwordHash,
        role: 'student',
        studentId: 'CS2024001',
        name: 'Aisha Patel',
      });
    }

    const admin = await collection.findOne({ email: 'admin@college.edu' });
    if (!admin) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await collection.insertOne({
        _id: 'user-admin-1',
        email: 'admin@college.edu',
        passwordHash: adminHash,
        role: 'admin',
        name: 'Admission Office',
      });
    }

    return res.json({ message: 'Default accounts created.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to seed accounts.' });
  }
});

export default router;
