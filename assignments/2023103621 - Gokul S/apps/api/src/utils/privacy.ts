import { prisma } from '../db.js';

export async function canViewWorkout(viewerId: string | undefined | null, workoutId: string): Promise<boolean> {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      user: {
        select: {
          id: true,
          is_private: true
        }
      }
    }
  });

  if (!workout) return false;

  // Owner can always view their own workout
  if (viewerId && workout.user_id === viewerId) return true;

  // Unshared workout cannot be viewed by anyone else
  if (!workout.is_shared) return false;

  // Public user profile workout that is shared can be viewed by anyone
  if (!workout.user.is_private) return true;

  // If owner is private, viewer must follow owner
  if (!viewerId) return false;

  const follow = await prisma.follow.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: viewerId,
        following_id: workout.user_id
      }
    }
  });

  return !!follow;
}

export async function canViewUserWorkouts(viewerId: string | undefined | null, ownerId: string): Promise<boolean> {
  if (viewerId === ownerId) return true;

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { is_private: true }
  });

  if (!owner) return false;
  if (!owner.is_private) return true;
  if (!viewerId) return false;

  const follow = await prisma.follow.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: viewerId,
        following_id: ownerId
      }
    }
  });

  return !!follow;
}
