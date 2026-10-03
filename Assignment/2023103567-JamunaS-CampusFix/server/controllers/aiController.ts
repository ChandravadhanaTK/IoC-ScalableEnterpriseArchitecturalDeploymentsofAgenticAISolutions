import type { Request, Response } from 'express';
import { classifyIssue } from '../services/aiClassifier.ts';

export async function handleAIClassify(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, category, priority } = req.body;

    if (!title && !description) {
      res.status(400).json({ error: 'Please provide an issue title or description for classification.' });
      return;
    }

    const result = await classifyIssue(title || '', description || '', category, priority);
    res.status(200).json({ result });
  } catch (error) {
    console.error('AI classify error:', error);
    res.status(500).json({ error: 'Failed to generate AI suggestions.' });
  }
}
