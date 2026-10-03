import React from 'react';
import { X, Heart, Dumbbell, Clock, Flame, Globe, Lock, Share2 } from 'lucide-react';
import { Workout } from '../types';
import { formatWeight } from '../utils/units';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface WorkoutDetailModalProps {
  workout: Workout | null;
  onClose: () => void;
  onSelectUser?: (username: string) => void;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  workout,
  onClose,
  onSelectUser
}) => {
  if (!workout) return null;

  const { user } = useAuth();
  const unit = user?.unit_preference || 'kg';

  const startedAt = new Date(workout.started_at);
  const endedAt = workout.ended_at ? new Date(workout.ended_at) : null;
  const durationMins = endedAt
    ? Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))
    : null;

  const totalVolumeKg =
    workout.total_volume_kg ??
    workout.workout_exercises?.reduce((sum, we) => {
      return sum + we.sets.reduce((sSum, s) => sSum + s.weight_kg * s.reps, 0);
    }, 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12141c] border border-[#262a3a] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262a3a]">
          <div className="flex items-center gap-3">
            <img
              src={workout.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${workout.user.username}`}
              alt={workout.user.display_name}
              className="w-10 h-10 rounded-full border border-slate-700 object-cover cursor-pointer"
              onClick={() => {
                onClose();
                onSelectUser && onSelectUser(workout.user.username);
              }}
            />
            <div>
              <h2 className="font-extrabold text-lg text-slate-100">{workout.title}</h2>
              <p className="text-xs text-slate-400">
                Logged by <span className="text-cyan-400 font-semibold cursor-pointer" onClick={() => { onClose(); onSelectUser && onSelectUser(workout.user.username); }}>@{workout.user.username}</span> • {format(startedAt, 'PPP')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notes */}
          {workout.notes && (
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 text-sm text-slate-300 italic">
              "{workout.notes}"
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-[#181b26] p-4 rounded-2xl border border-slate-800 text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Duration</p>
              <p className="text-lg font-extrabold text-slate-100 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-cyan-400" />
                {durationMins ? `${durationMins}m` : '--'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Volume</p>
              <p className="text-lg font-extrabold text-cyan-400 flex items-center justify-center gap-1">
                <Dumbbell className="w-4 h-4 text-cyan-400" />
                {formatWeight(totalVolumeKg, unit)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Visibility</p>
              <p className="text-sm font-bold text-slate-200 mt-1 flex items-center justify-center gap-1">
                {workout.is_shared ? (
                  <span className="text-cyan-400 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Shared</span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Private</span>
                )}
              </p>
            </div>
          </div>

          {/* Detailed Exercises List */}
          <div className="space-y-5">
            <h3 className="font-bold text-base text-slate-200 tracking-wide uppercase text-xs">Exercises Breakdown</h3>
            {workout.workout_exercises?.map((we, index) => (
              <div key={we.id || index} className="bg-[#181b26] rounded-2xl p-4 border border-slate-800/90 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-100 text-base">{we.exercise.name}</h4>
                    <p className="text-xs text-slate-400">{we.exercise.muscle_group} • {we.exercise.equipment}</p>
                  </div>
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    {we.sets.length} Sets
                  </span>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="py-2 px-3">Set</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Weight</th>
                        <th className="py-2 px-3 text-right">Reps</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {we.sets.map((set) => (
                        <tr key={set.id || set.set_number} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-bold text-slate-300">{set.set_number}</td>
                          <td className="py-2 px-3 font-sans">
                            {set.set_type === 'warmup' && (
                              <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">W</span>
                            )}
                            {set.set_type === 'drop' && (
                              <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold">D</span>
                            )}
                            {set.set_type === 'normal' && (
                              <span className="text-slate-400 text-[10px]">N</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-100 font-bold">
                            {formatWeight(set.weight_kg, unit)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-100 font-bold">
                            {set.reps}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#262a3a] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
