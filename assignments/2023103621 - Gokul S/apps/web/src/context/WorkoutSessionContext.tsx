import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exercise, WorkoutSet, Workout, SetType } from '../types';
import { workoutsApi, exercisesApi } from '../api/client';
import { useAuth } from './AuthContext';

const DRAFT_KEY = 'hevy_in_progress_workout_v1';

export interface ActiveWorkoutExercise {
  exercise_id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface ActiveWorkout {
  title: string;
  notes: string;
  started_at: string;
  is_shared: boolean;
  exercises: ActiveWorkoutExercise[];
}

interface WorkoutSessionContextType {
  activeWorkout: ActiveWorkout | null;
  isWorkoutActive: boolean;
  elapsedSeconds: number;
  restTimerSeconds: number;
  restTimerInitial: number;
  isRestTimerActive: boolean;
  lastWorkoutSavedAt: number;
  startWorkout: (title?: string) => void;
  addExercise: (exercise: Exercise) => Promise<void>;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateSet: (exerciseId: string, setIndex: number, field: keyof WorkoutSet, value: any) => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => void;
  setWorkoutTitle: (title: string) => void;
  setWorkoutNotes: (notes: string) => void;
  setWorkoutShared: (isShared: boolean) => void;
  finishWorkout: () => Promise<Workout | null>;
  cancelWorkout: () => void;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
}

const WorkoutSessionContext = createContext<WorkoutSessionContextType | undefined>(undefined);

export const WorkoutSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(0);
  const [restTimerInitial, setRestTimerInitial] = useState<number>(90);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [lastWorkoutSavedAt, setLastWorkoutSavedAt] = useState<number>(Date.now());

  // Sync to localStorage on change
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [activeWorkout]);

  // Main workout timer
  useEffect(() => {
    if (!activeWorkout) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(activeWorkout.started_at).getTime();
    const updateElapsed = () => {
      const nowMs = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.started_at]);

  // Rest timer countdown
  useEffect(() => {
    if (!isRestTimerActive || restTimerSeconds <= 0) return;

    const interval = setInterval(() => {
      setRestTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsRestTimerActive(false);
          // Audio alert sound effect
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch (e) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRestTimerActive, restTimerSeconds]);

  const startWorkout = (title = 'Custom Workout') => {
    const newWorkout: ActiveWorkout = {
      title,
      notes: '',
      started_at: new Date().toISOString(),
      is_shared: true,
      exercises: []
    };
    setActiveWorkout(newWorkout);
  };

  const addExercise = async (exercise: Exercise) => {
    if (!activeWorkout) return;

    let previousSets: WorkoutSet[] = [];
    try {
      if (user) {
        const historyData = await exercisesApi.getHistory(exercise.id);
        if (historyData.last_workout_sets && historyData.last_workout_sets.length > 0) {
          previousSets = historyData.last_workout_sets.map((s: any) => ({
            previous_weight_kg: s.weight_kg,
            previous_reps: s.reps
          }));
        }
      }
    } catch (e) {}

    // Default 3 sets
    const defaultSets: WorkoutSet[] = [1, 2, 3].map((num, idx) => {
      const prev = previousSets[idx];
      return {
        set_number: num,
        weight_kg: prev ? prev.previous_weight_kg || 0 : 0,
        reps: prev ? prev.previous_reps || 10 : 10,
        set_type: 'normal' as SetType,
        completed: false,
        previous_weight_kg: prev?.previous_weight_kg,
        previous_reps: prev?.previous_reps
      };
    });

    const newEx: ActiveWorkoutExercise = {
      exercise_id: exercise.id,
      exercise,
      sets: defaultSets
    };

    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newEx]
    });
  };

  const removeExercise = (exerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.filter((e) => e.exercise_id !== exerciseId)
    });
  };

  const addSet = (exerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.exercise_id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          set_number: ex.sets.length + 1,
          weight_kg: lastSet ? lastSet.weight_kg : 0,
          reps: lastSet ? lastSet.reps : 10,
          set_type: 'normal',
          completed: false,
          previous_weight_kg: lastSet?.previous_weight_kg,
          previous_reps: lastSet?.previous_reps
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    });
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.exercise_id !== exerciseId) return ex;
        const updatedSets = ex.sets
          .filter((_, idx) => idx !== setIndex)
          .map((s, idx) => ({ ...s, set_number: idx + 1 }));
        return { ...ex, sets: updatedSets };
      })
    });
  };

  const updateSet = (exerciseId: string, setIndex: number, field: keyof WorkoutSet, value: any) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.exercise_id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
        return { ...ex, sets: updatedSets };
      })
    });
  };

  const toggleSetCompleted = (exerciseId: string, setIndex: number) => {
    if (!activeWorkout) return;

    let markCompleted = false;

    setActiveWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.exercise_id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        const isComp = !updatedSets[setIndex].completed;
        markCompleted = isComp;
        updatedSets[setIndex] = { ...updatedSets[setIndex], completed: isComp };
        return { ...ex, sets: updatedSets };
      });
      return { ...prev, exercises: updatedExercises };
    });

    if (markCompleted) {
      startRestTimer(90); // Auto start 90s rest timer on completing set
    }
  };

  const setWorkoutTitle = (title: string) => {
    if (activeWorkout) setActiveWorkout({ ...activeWorkout, title });
  };

  const setWorkoutNotes = (notes: string) => {
    if (activeWorkout) setActiveWorkout({ ...activeWorkout, notes });
  };

  const setWorkoutShared = (is_shared: boolean) => {
    if (activeWorkout) setActiveWorkout({ ...activeWorkout, is_shared });
  };

  const startRestTimer = (seconds: number) => {
    setRestTimerInitial(seconds);
    setRestTimerSeconds(seconds);
    setIsRestTimerActive(true);
  };

  const stopRestTimer = () => {
    setIsRestTimerActive(false);
    setRestTimerSeconds(0);
  };

  const finishWorkout = async (): Promise<Workout | null> => {
    if (!activeWorkout) return null;

    const payload = {
      title: activeWorkout.title || 'Workout',
      notes: activeWorkout.notes || undefined,
      started_at: activeWorkout.started_at,
      ended_at: new Date().toISOString(),
      is_shared: activeWorkout.is_shared,
      exercises: activeWorkout.exercises.map((ex, idx) => ({
        exercise_id: ex.exercise_id,
        position: idx,
        sets: ex.sets
          .filter((s) => s.reps > 0 || s.completed)
          .map((s, sIdx) => ({
            set_number: sIdx + 1,
            weight_kg: Number(s.weight_kg) || 0,
            reps: Number(s.reps) || 0,
            set_type: s.set_type
          }))
      }))
    };

    try {
      const res = await workoutsApi.createWorkout(payload);
      setActiveWorkout(null);
      localStorage.removeItem(DRAFT_KEY);
      stopRestTimer();
      setLastWorkoutSavedAt(Date.now());
      return res.workout;
    } catch (err) {
      console.error('Failed to finish workout:', err);
      throw err;
    }
  };

  const cancelWorkout = () => {
    setActiveWorkout(null);
    localStorage.removeItem(DRAFT_KEY);
    stopRestTimer();
  };

  return (
    <WorkoutSessionContext.Provider
      value={{
        activeWorkout,
        isWorkoutActive: !!activeWorkout,
        elapsedSeconds,
        restTimerSeconds,
        restTimerInitial,
        isRestTimerActive,
        lastWorkoutSavedAt,
        startWorkout,
        addExercise,
        removeExercise,
        addSet,
        removeSet,
        updateSet,
        toggleSetCompleted,
        setWorkoutTitle,
        setWorkoutNotes,
        setWorkoutShared,
        finishWorkout,
        cancelWorkout,
        startRestTimer,
        stopRestTimer
      }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  );
};

export const useWorkoutSession = () => {
  const context = useContext(WorkoutSessionContext);
  if (!context) throw new Error('useWorkoutSession must be used within WorkoutSessionProvider');
  return context;
};
