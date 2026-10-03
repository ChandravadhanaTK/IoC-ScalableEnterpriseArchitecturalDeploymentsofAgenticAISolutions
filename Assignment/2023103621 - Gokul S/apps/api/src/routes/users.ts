import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(250).optional().nullable(),
  avatar_url: z.string().url().or(z.string().length(0)).optional().nullable(),
  is_private: z.boolean().optional(),
  unit_preference: z.enum(['kg', 'lb']).optional()
});

// PATCH /users/me - Update profile settings
router.patch('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validated = updateProfileSchema.parse(req.body);
    const userId = req.user!.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validated.display_name !== undefined && { display_name: validated.display_name }),
        ...(validated.bio !== undefined && { bio: validated.bio }),
        ...(validated.avatar_url !== undefined && { avatar_url: validated.avatar_url || null }),
        ...(validated.is_private !== undefined && { is_private: validated.is_private }),
        ...(validated.unit_preference !== undefined && { unit_preference: validated.unit_preference })
      },
      select: {
        id: true,
        username: true,
        email: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        is_private: true,
        unit_preference: true,
        created_at: true
      }
    });

    return res.json({ user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /users/:id/followers
router.get('/:id/followers', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;

    const followers = await prisma.follow.findMany({
      where: { following_id: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
            is_private: true
          }
        }
      }
    });

    return res.json({ followers: followers.map(f => f.follower) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /users/:id/following
router.get('/:id/following', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;

    const following = await prisma.follow.findMany({
      where: { follower_id: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
            is_private: true
          }
        }
      }
    });

    return res.json({ following: following.map(f => f.following) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
});

export default router;
