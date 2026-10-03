export type UnitPreference = 'kg' | 'lb';

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  is_private: boolean;
  unit_preference: UnitPreference;
  created_at: string;
  followers_count?: number;
  following_count?: number;
  workout_count?: number;
  total_volume_kg?: number;
  streak?: number;
  is_following?: boolean;
  is_me?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  created_by?: string | null;
}

export type SetType = 'normal' | 'warmup' | 'drop';

export interface WorkoutSet {
  id?: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  set_type: SetType;
  completed?: boolean;
  previous_weight_kg?: number;
  previous_reps?: number;
}

export interface WorkoutExercise {
  id?: string;
  exercise_id: string;
  exercise: Exercise;
  position: number;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  notes?: string | null;
  started_at: string;
  ended_at?: string | null;
  is_shared: boolean;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    is_private?: boolean;
  };
  workout_exercises: WorkoutExercise[];
  is_liked_by_me?: boolean;
  like_count?: number;
  total_volume_kg?: number;
}

export interface DraftWorkout {
  title: string;
  notes: string;
  started_at: string;
  is_shared: boolean;
  exercises: {
    exercise_id: string;
    exercise: Exercise;
    sets: WorkoutSet[];
  }[];
}
