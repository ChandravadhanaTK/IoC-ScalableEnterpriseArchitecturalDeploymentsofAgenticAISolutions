import React, { useState } from 'react';
import { Heart, Share2, Calendar, Dumbbell, Trophy, Lock, Globe } from 'lucide-react';
import { Workout } from '../types';
import { formatWeight } from '../utils/units';
import { useAuth } from '../context/AuthContext';
import { socialApi } from '../api/client';
import { formatDistanceToNow } from 'date-fns';

interface WorkoutCardProps {
  workout: Workout;
  onSelectWorkout?: (workout: Workout) => void;
  onSelectUser?: (username: string) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onSelectWorkout,
  onSelectUser
}) => {
  const { user } = useAuth();
  const unit = user?.unit_preference || 'kg';

  const [isLiked, setIsLiked] = useState(workout.is_liked_by_me || false);
  const [likeCount, setLikeCount] = useState(workout.like_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || likeLoading) return;

    setLikeLoading(true);
    try {
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        await socialApi.unlikeWorkout(workout.id);
      } else {
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        await socialApi.likeWorkout(workout.id);
      }
    } catch (err) {
      // Revert if error
      setIsLiked(workout.is_liked_by_me || false);
      setLikeCount(workout.like_count || 0);
    } finally {
      setLikeLoading(false);
    }
  };

  // Calculate unique muscles
  const muscleGroups = Array.from(
    new Set(workout.workout_exercises?.map((we) => we.exercise.muscle_group) || [])
  );

  // Total volume
  const totalVolumeKg =
    workout.total_volume_kg ??
    workout.workout_exercises?.reduce((sum, we) => {
      return sum + we.sets.reduce((sSum, s) => sSum + s.weight_kg * s.reps, 0);
    }, 0) ?? 0;

  const totalSets = workout.workout_exercises?.reduce((sum, we) => sum + we.sets.length, 0) || 0;

  return (
    <div
      onClick={() => onSelectWorkout && onSelectWorkout(workout)}
      className="glass-card rounded-2xl p-5 border border-[#262a3a] hover:border-cyan-500/40 transition cursor-pointer shadow-lg space-y-4 group"
    >
      {/* Header: User Avatar & Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectUser && onSelectUser(workout.user.username);
            }}
            className="w-11 h-11 rounded-full overflow-hidden border border-slate-700 hover:border-cyan-400 transition bg-slate-800"
          >
            <img
              src={workout.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${workout.user.username}`}
              alt={workout.user.display_name}
              className="w-full h-full object-cover"
            />
          </button>
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectUser && onSelectUser(workout.user.username);
              }}
              className="font-bold text-slate-100 hover:text-cyan-400 text-base transition text-left"
            >
              {workout.user.display_name}
            </button>
            <p className="text-xs text-slate-400">
              @{workout.user.username} • {formatDistanceToNow(new Date(workout.started_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workout.is_shared ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
              <Globe className="w-3 h-3" /> Shared
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
              <Lock className="w-3 h-3" /> Private
            </span>
          )}
        </div>
      </div>

      {/* Title & Notes */}
      <div>
        <h3 className="font-extrabold text-lg text-slate-100 group-hover:text-cyan-400 transition">
          {workout.title}
        </h3>
        {workout.notes && <p className="text-sm text-slate-300 mt-1 italic line-clamp-2">{workout.notes}</p>}
      </div>

      {/* Muscle Group Tags */}
      <div className="flex flex-wrap gap-1.5">
        {muscleGroups.map((muscle) => (
          <span
            key={muscle}
            className="text-[11px] font-semibold bg-slate-800/80 text-cyan-300 px-2.5 py-0.5 rounded-md border border-slate-700"
          >
            {muscle}
          </span>
        ))}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2 bg-[#0d0f17] p-3 rounded-xl border border-slate-800/80 text-center">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Exercises</p>
          <p className="text-base font-extrabold text-slate-100">{workout.workout_exercises?.length || 0}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Sets</p>
          <p className="text-base font-extrabold text-slate-100">{totalSets}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Volume</p>
          <p className="text-base font-extrabold text-cyan-400">{formatWeight(totalVolumeKg, unit)}</p>
        </div>
      </div>

      {/* Exercise List Highlights */}
      <div className="space-y-1.5">
        {workout.workout_exercises?.slice(0, 3).map((we) => {
          const maxWeight = we.sets.reduce((max, s) => Math.max(max, s.weight_kg), 0);
          return (
            <div key={we.id || we.exercise_id} className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold text-slate-200">{we.sets.length}× {we.exercise.name}</span>
              <span className="font-mono text-slate-400">
                Best: <strong className="text-slate-200">{formatWeight(maxWeight, unit)}</strong>
              </span>
            </div>
          );
        })}
        {workout.workout_exercises && workout.workout_exercises.length > 3 && (
          <p className="text-[11px] text-cyan-400 font-semibold pt-1">
            +{workout.workout_exercises.length - 3} more exercise(s)...
          </p>
        )}
      </div>

      {/* Footer: Like Action Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
            isLiked
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
        </button>

        <span className="text-slate-400 text-[11px]">Tap to inspect breakdown</span>
      </div>
    </div>
  );
};
