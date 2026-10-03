import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.set.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.user.deleteMany();

  // 1. Built-in exercises
  const exercisesData = [
    { name: 'Barbell Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
    { name: 'Incline Dumbbell Press', muscle_group: 'Chest', equipment: 'Dumbbell' },
    { name: 'Cable Chest Flyes', muscle_group: 'Chest', equipment: 'Cable' },
    { name: 'Push Ups', muscle_group: 'Chest', equipment: 'Bodyweight' },
    
    { name: 'Barbell Deadlift', muscle_group: 'Back', equipment: 'Barbell' },
    { name: 'Lat Pulldown', muscle_group: 'Back', equipment: 'Cable' },
    { name: 'Barbell Bent Over Row', muscle_group: 'Back', equipment: 'Barbell' },
    { name: 'Pull-ups', muscle_group: 'Back', equipment: 'Bodyweight' },
    { name: 'Seated Cable Row', muscle_group: 'Back', equipment: 'Cable' },
    
    { name: 'Barbell Back Squat', muscle_group: 'Legs', equipment: 'Barbell' },
    { name: 'Leg Press', muscle_group: 'Legs', equipment: 'Machine' },
    { name: 'Romanian Deadlift', muscle_group: 'Legs', equipment: 'Barbell' },
    { name: 'Leg Extension', muscle_group: 'Legs', equipment: 'Machine' },
    { name: 'Lying Leg Curl', muscle_group: 'Legs', equipment: 'Machine' },
    
    { name: 'Overhead Barbell Press', muscle_group: 'Shoulders', equipment: 'Barbell' },
    { name: 'Dumbbell Lateral Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell' },
    { name: 'Face Pulls', muscle_group: 'Shoulders', equipment: 'Cable' },
    
    { name: 'Dumbbell Bicep Curl', muscle_group: 'Arms', equipment: 'Dumbbell' },
    { name: 'Tricep Rope Pushdown', muscle_group: 'Arms', equipment: 'Cable' },
    { name: 'EZ Bar Skullcrusher', muscle_group: 'Arms', equipment: 'Barbell' },
    { name: 'Hammer Curls', muscle_group: 'Arms', equipment: 'Dumbbell' },
    
    { name: 'Hanging Leg Raise', muscle_group: 'Core', equipment: 'Bodyweight' },
    { name: 'Ab Wheel Rollout', muscle_group: 'Core', equipment: 'Other' }
  ];

  const createdExercises = await Promise.all(
    exercisesData.map(ex => prisma.exercise.create({ data: ex }))
  );

  const exMap = new Map<string, string>();
  createdExercises.forEach(e => exMap.set(e.name, e.id));

  // 2. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.create({
    data: {
      username: 'demo_athlete',
      email: 'demo@example.com',
      password_hash: passwordHash,
      display_name: 'Alex Rivera',
      bio: 'Lifting heavy & staying consistent 💪 | Hypertrophy & Powerlifting',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      unit_preference: 'kg',
      is_private: false
    }
  });

  const sarah = await prisma.user.create({
    data: {
      username: 'sarah_lifts',
      email: 'sarah@example.com',
      password_hash: passwordHash,
      display_name: 'Sarah Jenkins',
      bio: 'Crossfit coach & Powerlifter 🏋️‍♀️ | 400kg Total',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
      unit_preference: 'kg',
      is_private: false
    }
  });

  const marcus = await prisma.user.create({
    data: {
      username: 'marcus_power',
      email: 'marcus@example.com',
      password_hash: passwordHash,
      display_name: 'Marcus Thorne',
      bio: 'Bodybuilding enthusiast | Push Pull Legs 6x/week 🚀',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      unit_preference: 'kg',
      is_private: false
    }
  });

  const elena = await prisma.user.create({
    data: {
      username: 'elena_fit',
      email: 'elena@example.com',
      password_hash: passwordHash,
      display_name: 'Elena Rostova',
      bio: 'Functional strength and mobility 🏃‍♀️',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
      unit_preference: 'kg',
      is_private: false
    }
  });

  // 3. Follows
  await prisma.follow.createMany({
    data: [
      { follower_id: demoUser.id, following_id: sarah.id },
      { follower_id: demoUser.id, following_id: marcus.id },
      { follower_id: sarah.id, following_id: demoUser.id },
      { follower_id: marcus.id, following_id: demoUser.id },
      { follower_id: elena.id, following_id: demoUser.id },
      { follower_id: marcus.id, following_id: sarah.id }
    ]
  });

  // Helper date utility
  const daysAgo = (d: number, hour: number = 10) => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  // 4. Past Workouts for Demo User (Calendar & Progress)
  const demoWorkouts = [
    {
      title: 'Heavy Chest & Triceps Blast',
      notes: 'Felt strong on bench today! Hit a new PR on incline.',
      started_at: daysAgo(0, 9),
      ended_at: daysAgo(0, 10),
      is_shared: true,
      exercises: [
        {
          name: 'Barbell Bench Press',
          sets: [
            { weight_kg: 60, reps: 10, set_type: 'warmup' },
            { weight_kg: 80, reps: 8, set_type: 'normal' },
            { weight_kg: 90, reps: 6, set_type: 'normal' },
            { weight_kg: 95, reps: 5, set_type: 'normal' }
          ]
        },
        {
          name: 'Incline Dumbbell Press',
          sets: [
            { weight_kg: 30, reps: 10, set_type: 'normal' },
            { weight_kg: 34, reps: 8, set_type: 'normal' },
            { weight_kg: 34, reps: 7, set_type: 'normal' }
          ]
        },
        {
          name: 'Tricep Rope Pushdown',
          sets: [
            { weight_kg: 25, reps: 12, set_type: 'normal' },
            { weight_kg: 30, reps: 10, set_type: 'normal' },
            { weight_kg: 30, reps: 10, set_type: 'drop' }
          ]
        }
      ]
    },
    {
      title: 'Leg Day Annihilation',
      notes: 'Squats felt crisp. Deep range of motion.',
      started_at: daysAgo(1, 16),
      ended_at: daysAgo(1, 17),
      is_shared: true,
      exercises: [
        {
          name: 'Barbell Back Squat',
          sets: [
            { weight_kg: 70, reps: 10, set_type: 'warmup' },
            { weight_kg: 100, reps: 8, set_type: 'normal' },
            { weight_kg: 120, reps: 6, set_type: 'normal' },
            { weight_kg: 130, reps: 4, set_type: 'normal' }
          ]
        },
        {
          name: 'Romanian Deadlift',
          sets: [
            { weight_kg: 80, reps: 10, set_type: 'normal' },
            { weight_kg: 90, reps: 8, set_type: 'normal' }
          ]
        },
        {
          name: 'Leg Extension',
          sets: [
            { weight_kg: 50, reps: 15, set_type: 'normal' },
            { weight_kg: 60, reps: 12, set_type: 'normal' }
          ]
        }
      ]
    },
    {
      title: 'Back & Biceps Hypertrophy',
      notes: 'Mind-muscle connection was insane on lat pulldowns.',
      started_at: daysAgo(2, 11),
      ended_at: daysAgo(2, 12),
      is_shared: true,
      exercises: [
        {
          name: 'Barbell Deadlift',
          sets: [
            { weight_kg: 100, reps: 5, set_type: 'warmup' },
            { weight_kg: 140, reps: 5, set_type: 'normal' },
            { weight_kg: 160, reps: 3, set_type: 'normal' }
          ]
        },
        {
          name: 'Lat Pulldown',
          sets: [
            { weight_kg: 60, reps: 12, set_type: 'normal' },
            { weight_kg: 70, reps: 10, set_type: 'normal' },
            { weight_kg: 75, reps: 8, set_type: 'normal' }
          ]
        },
        {
          name: 'Dumbbell Bicep Curl',
          sets: [
            { weight_kg: 16, reps: 10, set_type: 'normal' },
            { weight_kg: 18, reps: 8, set_type: 'normal' }
          ]
        }
      ]
    },
    {
      title: 'Shoulders & Arms Pump',
      notes: 'Quick 45 min session.',
      started_at: daysAgo(4, 18),
      ended_at: daysAgo(4, 19),
      is_shared: true,
      exercises: [
        {
          name: 'Overhead Barbell Press',
          sets: [
            { weight_kg: 50, reps: 8, set_type: 'normal' },
            { weight_kg: 55, reps: 6, set_type: 'normal' }
          ]
        },
        {
          name: 'Dumbbell Lateral Raise',
          sets: [
            { weight_kg: 12, reps: 15, set_type: 'normal' },
            { weight_kg: 14, reps: 12, set_type: 'normal' }
          ]
        }
      ]
    },
    {
      title: 'Upper Body Power',
      notes: 'Previous week benchmark workout.',
      started_at: daysAgo(7, 10),
      ended_at: daysAgo(7, 11),
      is_shared: true,
      exercises: [
        {
          name: 'Barbell Bench Press',
          sets: [
            { weight_kg: 85, reps: 6, set_type: 'normal' },
            { weight_kg: 90, reps: 5, set_type: 'normal' }
          ]
        },
        {
          name: 'Barbell Back Squat',
          sets: [
            { weight_kg: 115, reps: 6, set_type: 'normal' }
          ]
        }
      ]
    }
  ];

  for (const wData of demoWorkouts) {
    const workout = await prisma.workout.create({
      data: {
        user_id: demoUser.id,
        title: wData.title,
        notes: wData.notes,
        started_at: wData.started_at,
        ended_at: wData.ended_at,
        is_shared: wData.is_shared
      }
    });

    for (let i = 0; i < wData.exercises.length; i++) {
      const ex = wData.exercises[i];
      const exId = exMap.get(ex.name)!;
      const we = await prisma.workoutExercise.create({
        data: {
          workout_id: workout.id,
          exercise_id: exId,
          position: i
        }
      });

      for (let sIdx = 0; sIdx < ex.sets.length; sIdx++) {
        const s = ex.sets[sIdx];
        await prisma.set.create({
          data: {
            workout_exercise_id: we.id,
            set_number: sIdx + 1,
            weight_kg: s.weight_kg,
            reps: s.reps,
            set_type: s.set_type
          }
        });
      }
    }

    // Add likes from Sarah & Marcus to demoUser's workouts
    await prisma.like.create({ data: { user_id: sarah.id, workout_id: workout.id } });
    if (Math.random() > 0.5) {
      await prisma.like.create({ data: { user_id: marcus.id, workout_id: workout.id } });
    }
  }

  // 5. Workouts for Sarah
  const sarahWorkout = await prisma.workout.create({
    data: {
      user_id: sarah.id,
      title: 'Deadlift PR Session 💥',
      notes: 'Locked out 190kg for 3 reps! Personal best!',
      started_at: daysAgo(0, 14),
      ended_at: daysAgo(0, 15),
      is_shared: true
    }
  });

  const sarahWe = await prisma.workoutExercise.create({
    data: {
      workout_id: sarahWorkout.id,
      exercise_id: exMap.get('Barbell Deadlift')!,
      position: 0
    }
  });

  await prisma.set.createMany({
    data: [
      { workout_exercise_id: sarahWe.id, set_number: 1, weight_kg: 140, reps: 5, set_type: 'warmup' },
      { workout_exercise_id: sarahWe.id, set_number: 2, weight_kg: 170, reps: 3, set_type: 'normal' },
      { workout_exercise_id: sarahWe.id, set_number: 3, weight_kg: 190, reps: 3, set_type: 'normal' }
    ]
  });

  await prisma.like.create({ data: { user_id: demoUser.id, workout_id: sarahWorkout.id } });

  // 6. Workouts for Marcus
  const marcusWorkout = await prisma.workout.create({
    data: {
      user_id: marcus.id,
      title: 'Push Day - Hypertrophy focus',
      notes: 'Pump was immaculate. High volume high density.',
      started_at: daysAgo(1, 11),
      ended_at: daysAgo(1, 12),
      is_shared: true
    }
  });

  const marcusWe = await prisma.workoutExercise.create({
    data: {
      workout_id: marcusWorkout.id,
      exercise_id: exMap.get('Barbell Bench Press')!,
      position: 0
    }
  });

  await prisma.set.createMany({
    data: [
      { workout_exercise_id: marcusWe.id, set_number: 1, weight_kg: 100, reps: 10, set_type: 'normal' },
      { workout_exercise_id: marcusWe.id, set_number: 2, weight_kg: 110, reps: 8, set_type: 'normal' },
      { workout_exercise_id: marcusWe.id, set_number: 3, weight_kg: 115, reps: 6, set_type: 'normal' }
    ]
  });

  await prisma.like.create({ data: { user_id: demoUser.id, workout_id: marcusWorkout.id } });

  console.log('✅ Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
