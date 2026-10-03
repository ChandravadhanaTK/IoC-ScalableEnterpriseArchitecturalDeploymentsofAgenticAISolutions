import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCollection } from '../config/db.js';

const router = express.Router();

router.use(requireAuth);

router.get('/students', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can access this route.' });
  }

  const collection = await getCollection('students');
  const records = await collection.find({});
  return res.json(await records.toArray ? records.toArray() : records);
});

router.get('/documents', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can access this route.' });
  }

  const collection = await getCollection('documents');
  const records = await collection.find({});
  return res.json(await records.toArray ? records.toArray() : records);
});

router.post('/documents', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can upload documents.' });
  }

  const { title, section, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ message: 'Document title and content are required.' });
  }

  const collection = await getCollection('documents');
  const item = { _id: `doc-${Date.now()}`, title, section: section || 'General', content };
  await collection.insertOne(item);
  return res.status(201).json(item);
});

router.post('/students', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can add students.' });
  }

  const collection = await getCollection('students');
  const student = {
    _id: `student-${Date.now()}`,
    ...req.body,
  };

  await collection.insertOne(student);
  return res.status(201).json(student);
});

export default router;
