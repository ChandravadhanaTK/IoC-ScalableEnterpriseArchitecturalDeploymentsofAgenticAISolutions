import type { Response } from 'express';
import { db } from '../db.ts';
import type { AuthRequest } from '../middleware/auth.ts';

export async function getMyNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const notifications = await db.notifications.find({ userId: req.user._id });
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    await db.notifications.updateOne({ _id: id, userId: req.user._id }, { $set: { read: true } });

    res.status(200).json({ message: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const notifications = await db.notifications.find({ userId: req.user._id });
    for (const n of notifications) {
      if (!n.read) {
        await db.notifications.updateOne({ _id: n._id }, { $set: { read: true } });
      }
    }

    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read.' });
  }
}
