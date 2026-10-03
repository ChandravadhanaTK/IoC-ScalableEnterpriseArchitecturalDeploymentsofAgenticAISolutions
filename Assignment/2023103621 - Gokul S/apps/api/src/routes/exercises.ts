import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createExerciseSchema = z.object({
  name: z.string().min(2).max(60),
  muscle_group: z.string().min(2),
  equipment: z.string().min(2)
});

// GET /exercises?search=&muscle=
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, muscle } = req.query;

    const whereClause: any = {
      OR: [
        { created_by: null },
        { created_by: req.user!.id }
      ]
    };

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.name = {
        contains: search.trim()
      };
    }

    if (muscle && typeof muscle === 'string' && muscle.trim() !== '' && muscle !== 'All') {
      whereClause.muscle_group = {
        equals: muscle.trim()
      };
    }

    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    return res.json({ exercises });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// POST /exercises
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validated = createExerciseSchema.parse(req.body);

    const exercise = await prisma.exercise.create({
      data: {
        name: validated.name,
        muscle_group: validated.muscle_group,
        equipment: validated.equipment,
        created_by: req.user!.id
      }
    });

    return res.status(201).json({ exercise });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// GET /exercises/:id/history (Previous sets and progress chart data)
router.get('/:id/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const exerciseId = req.params.id;
    const userId = req.user!.id;

    // Find all workout exercises for this exercise performed by this user
    const workoutExercises = await prisma.workoutExercise.findMany({
      where: {
        exercise_id: exerciseId,
        workout: {
          user_id: userId
        }
      },
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            started_at: true
          }
        },
        sets: {
          orderBy: { set_number: 'asc' }
        }
      },
      orderBy: {
        workout: {
          started_at: 'desc'
        }
      }
    });

    // Format progress chart points (date, maxWeight, totalVolume, estimated1RM)
    const history = workoutExercises.map(we => {
      const maxWeight = we.sets.reduce((max, s) => Math.max(max, s.weight_kg), 0);
      const totalVolume = we.sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
      // Brzycki formula for 1RM: weight * (36 / (37 - reps))
      const estimated1RM = we.sets.reduce((max, s) => {
        const e1rm = s.reps > 0 ? s.weight_kg * (36 / Math.max(37 - s.reps, 1)) : s.weight_kg;
        return Math.max(max, Math.round(e1rm * 10) / 10);
      }, 0);

      return {
        workout_id: we.workout.id,
        workout_title: we.workout.title,
        date: we.workout.started_at,
        max_weight_kg: maxWeight,
        total_volume_kg: totalVolume,
        estimated_1rm_kg: estimated1RM,
        sets: we.sets
      };
    });

    // Also get exercise details
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    });

    return res.json({
      exercise,
      last_workout_sets: history.length > 0 ? history[0].sets : [],
      history
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch exercise history' });
  }
});

export default router;
