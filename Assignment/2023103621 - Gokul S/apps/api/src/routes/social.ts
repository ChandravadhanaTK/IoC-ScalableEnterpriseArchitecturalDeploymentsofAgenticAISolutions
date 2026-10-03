import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, optionalAuthenticateToken, AuthRequest } from '../middleware/auth.js';
import { calculateStreak } from '../utils/streak.js';
import { canViewUserWorkouts } from '../utils/privacy.js';

const router = Router();

// GET /feed?cursor= - Social feed of shared workouts from followed users + self
router.get('/feed', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cursor = req.query.cursor as string;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get following user IDs
    const following = await prisma.follow.findMany({
      where: { follower_id: userId },
      select: { following_id: true }
    });

    const followingIds = following.map(f => f.following_id);
    // Include self and people followed
    const allowedUserIds = Array.from(new Set([userId, ...followingIds]));

    const whereClause: any = {
      user_id: { in: allowedUserIds },
      is_shared: true
    };

    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    const workouts = await prisma.workout.findMany({
      where: whereClause,
      take: limit + 1, // take 1 extra to see if next page exists
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_private: true
          }
        },
        workout_exercises: {
          include: {
            exercise: true,
            sets: true
          },
          orderBy: { position: 'asc' }
        },
        likes: {
          select: { user_id: true }
        },
        _count: {
          select: { likes: true }
        }
      }
    });

    let nextCursor: string | null = null;
    if (workouts.length > limit) {
      const nextItem = workouts.pop();
      nextCursor = nextItem!.id;
    }

    // Format feed workouts with isLikedByMe flag
    const formattedWorkouts = workouts.map(w => {
      const isLikedByMe = w.likes.some(l => l.user_id === userId);
      const totalVolume = w.workout_exercises.reduce((sum, we) => {
        return sum + we.sets.reduce((sSum, s) => sSum + s.weight_kg * s.reps, 0);
      }, 0);

      return {
        ...w,
        is_liked_by_me: isLikedByMe,
        like_count: w._count.likes,
        total_volume_kg: totalVolume
      };
    });

    return res.json({
      feed: formattedWorkouts,
      nextCursor
    });
  } catch (error) {
    console.error('Feed error:', error);
    return res.status(500).json({ error: 'Failed to fetch social feed' });
  }
});

// GET /users?search= - Search users
router.get('/users', optionalAuthenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    const currentUserId = req.user?.id;

    if (!search || search.trim() === '') {
      // Return top suggested users
      const users = await prisma.user.findMany({
        take: 10,
        where: currentUserId ? { id: { not: currentUserId } } : undefined,
        select: {
          id: true,
          username: true,
          display_name: true,
          bio: true,
          avatar_url: true,
          is_private: true,
          _count: {
            select: { followers: true, workouts: true }
          }
        }
      });

      return res.json({ users });
    }

    const query = search.trim();
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { display_name: { contains: query } }
        ]
      },
      take: 20,
      select: {
        id: true,
        username: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        is_private: true,
        _count: {
          select: { followers: true, workouts: true }
        }
      }
    });

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

// GET /users/:username - Get user profile + stats
router.get('/users/:username', optionalAuthenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.params.username.toLowerCase();
    const viewerId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        is_private: true,
        unit_preference: true,
        created_at: true,
        _count: {
          select: {
            followers: true,
            following: true,
            workouts: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if viewer follows user
    let isFollowing = false;
    if (viewerId) {
      const follow = await prisma.follow.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: viewerId,
            following_id: user.id
          }
        }
      });
      isFollowing = !!follow;
    }

    // Calculate streak & stats
    const userWorkouts = await prisma.workout.findMany({
      where: { user_id: user.id },
      select: {
        started_at: true,
        workout_exercises: {
          select: {
            sets: { select: { weight_kg: true, reps: true } }
          }
        }
      }
    });

    const dates = userWorkouts.map(w => w.started_at);
    const { currentStreak, totalWorkouts } = calculateStreak(dates);

    const totalVolume = userWorkouts.reduce((sum, w) => {
      return sum + w.workout_exercises.reduce((weSum, we) => {
        return weSum + we.sets.reduce((sSum, s) => sSum + s.weight_kg * s.reps, 0);
      }, 0);
    }, 0);

    return res.json({
      user: {
        ...user,
        followers_count: user._count.followers,
        following_count: user._count.following,
        workout_count: totalWorkouts,
        total_volume_kg: totalVolume,
        streak: currentStreak,
        is_following: isFollowing,
        is_me: viewerId === user.id
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /users/:username/workouts - Get workouts for profile
router.get('/users/:username/workouts', optionalAuthenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.params.username.toLowerCase();
    const viewerId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, is_private: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMe = viewerId === user.id;
    const canView = await canViewUserWorkouts(viewerId, user.id);

    if (!canView && !isMe) {
      return res.status(403).json({ error: 'This profile is private' });
    }

    // If viewing own profile, show all workouts; if viewing someone else, show only shared
    const whereClause: any = { user_id: user.id };
    if (!isMe) {
      whereClause.is_shared = true;
    }

    const workouts = await prisma.workout.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true
          }
        },
        workout_exercises: {
          include: {
            exercise: true,
            sets: true
          },
          orderBy: { position: 'asc' }
        },
        likes: {
          select: { user_id: true }
        },
        _count: {
          select: { likes: true }
        }
      },
      orderBy: { started_at: 'desc' }
    });

    const formatted = workouts.map(w => ({
      ...w,
      is_liked_by_me: viewerId ? w.likes.some(l => l.user_id === viewerId) : false,
      like_count: w._count.likes
    }));

    return res.json({ workouts: formatted });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user workouts' });
  }
});

// POST /users/:id/follow
router.post('/users/:id/follow', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const followerId = req.user!.id;

    if (targetUserId === followerId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.follow.upsert({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: targetUserId
        }
      },
      create: {
        follower_id: followerId,
        following_id: targetUserId
      },
      update: {}
    });

    return res.json({ message: 'Followed successfully', is_following: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to follow user' });
  }
});

// DELETE /users/:id/follow
router.delete('/users/:id/follow', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const followerId = req.user!.id;

    await prisma.follow.deleteMany({
      where: {
        follower_id: followerId,
        following_id: targetUserId
      }
    });

    return res.json({ message: 'Unfollowed successfully', is_following: false });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// POST /workouts/:id/like
router.post('/workouts/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const workoutId = req.params.id;
    const userId = req.user!.id;

    await prisma.like.upsert({
      where: {
        user_id_workout_id: {
          user_id: userId,
          workout_id: workoutId
        }
      },
      create: {
        user_id: userId,
        workout_id: workoutId
      },
      update: {}
    });

    const count = await prisma.like.count({ where: { workout_id: workoutId } });

    return res.json({ message: 'Workout liked', like_count: count, is_liked: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to like workout' });
  }
});

// DELETE /workouts/:id/like
router.delete('/workouts/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const workoutId = req.params.id;
    const userId = req.user!.id;

    await prisma.like.deleteMany({
      where: {
        user_id: userId,
        workout_id: workoutId
      }
    });

    const count = await prisma.like.count({ where: { workout_id: workoutId } });

    return res.json({ message: 'Workout unliked', like_count: count, is_liked: false });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unlike workout' });
  }
});

export default router;
