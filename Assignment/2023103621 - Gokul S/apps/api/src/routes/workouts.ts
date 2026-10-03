import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateToken, optionalAuthenticateToken, AuthRequest } from '../middleware/auth.js';
import { canViewWorkout } from '../utils/privacy.js';

const router = Router();

const setSchema = z.object({
  set_number: z.number().int().min(1),
  weight_kg: z.number().min(0),
  reps: z.number().int().min(0),
  set_type: z.enum(['normal', 'warmup', 'drop']).default('normal')
});

const exerciseInputSchema = z.object({
  exercise_id: z.string().uuid().or(z.string().min(1)),
  position: z.number().int().default(0),
  sets: z.array(setSchema)
});

const createWorkoutSchema = z.object({
  title: z.string().min(1).max(100),
  notes: z.string().optional().nullable(),
  started_at: z.string().optional(),
  ended_at: z.string().optional().nullable(),
  is_shared: z.boolean().default(false),
  exercises: z.array(exerciseInputSchema)
});

const patchWorkoutSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  notes: z.string().optional().nullable(),
  is_shared: z.boolean().optional()
});

// POST /workouts - Create workout with nested exercises and sets
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validated = createWorkoutSchema.parse(req.body);
    const userId = req.user!.id;

    const startedAt = validated.started_at ? new Date(validated.started_at) : new Date();
    const endedAt = validated.ended_at ? new Date(validated.ended_at) : new Date();

    const workout = await prisma.workout.create({
      data: {
        user_id: userId,
        title: validated.title,
        notes: validated.notes || null,
        started_at: startedAt,
        ended_at: endedAt,
        is_shared: validated.is_shared,
        workout_exercises: {
          create: validated.exercises.map((ex, idx) => ({
            exercise_id: ex.exercise_id,
            position: ex.position ?? idx,
            sets: {
              create: ex.sets.map((s, sIdx) => ({
                set_number: s.set_number ?? (sIdx + 1),
                weight_kg: s.weight_kg,
                reps: s.reps,
                set_type: s.set_type
              }))
            }
          }))
        }
      },
      include: {
        workout_exercises: {
          include: {
            exercise: true,
            sets: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true
          }
        }
      }
    });

    return res.status(201).json({ workout });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create workout error:', error);
    return res.status(500).json({ error: 'Failed to save workout' });
  }
});

// GET /workouts - My workout history (paginated)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where: { user_id: req.user!.id },
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
          likes: true,
          _count: {
            select: { likes: true }
          }
        },
        orderBy: { started_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.workout.count({ where: { user_id: req.user!.id } })
    ]);

    return res.json({
      workouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// GET /calendar/dates - Distinct trained dates for calendar
router.get('/calendar/dates', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const monthParam = req.query.month as string; // format: "2026-09"
    const userId = req.user!.id;

    let startDate: Date;
    let endDate: Date;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [year, month] = monthParam.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, 1));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    } else {
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }

    const workouts = await prisma.workout.findMany({
      where: {
        user_id: userId,
        started_at: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        title: true,
        started_at: true,
        workout_exercises: {
          select: {
            exercise: { select: { name: true } },
            sets: { select: { weight_kg: true, reps: true } }
          }
        }
      }
    });

    // Group workouts by trained date (YYYY-MM-DD)
    const datesMap: Record<string, any[]> = {};

    workouts.forEach(w => {
      const dateStr = w.started_at.toISOString().split('T')[0];
      if (!datesMap[dateStr]) {
        datesMap[dateStr] = [];
      }
      
      const totalVolume = w.workout_exercises.reduce((sum, we) => {
        return sum + we.sets.reduce((sSum, s) => sSum + s.weight_kg * s.reps, 0);
      }, 0);

      datesMap[dateStr].push({
        id: w.id,
        title: w.title,
        started_at: w.started_at,
        exercise_count: w.workout_exercises.length,
        total_volume_kg: totalVolume
      });
    });

    const trainedDates = Object.keys(datesMap);

    return res.json({
      month: monthParam || `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}`,
      trainedDates,
      workoutsByDate: datesMap
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// GET /workouts/:id - Workout Detail (with Privacy check)
router.get('/:id', optionalAuthenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const workoutId = req.params.id;
    const viewerId = req.user?.id;

    const canView = await canViewWorkout(viewerId, workoutId);
    if (!canView) {
      return res.status(403).json({ error: 'Workout is private or not accessible' });
    }

    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
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
            sets: {
              orderBy: { set_number: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true
              }
            }
          }
        }
      }
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    const isLikedByMe = viewerId ? workout.likes.some(l => l.user_id === viewerId) : false;

    return res.json({ workout, isLikedByMe });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

// PATCH /workouts/:id - Edit title, notes, or toggle share
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const workoutId = req.params.id;
    const userId = req.user!.id;

    const existing = await prisma.workout.findUnique({ where: { id: workoutId } });
    if (!existing) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this workout' });
    }

    const validated = patchWorkoutSchema.parse(req.body);

    const updated = await prisma.workout.update({
      where: { id: workoutId },
      data: validated,
      include: {
        workout_exercises: {
          include: {
            exercise: true,
            sets: true
          }
        }
      }
    });

    return res.json({ workout: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update workout' });
  }
});

// DELETE /workouts/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const workoutId = req.params.id;
    const userId = req.user!.id;

    const existing = await prisma.workout.findUnique({ where: { id: workoutId } });
    if (!existing) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this workout' });
    }

    await prisma.workout.delete({ where: { id: workoutId } });

    return res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete workout' });
  }
});

export default router;
