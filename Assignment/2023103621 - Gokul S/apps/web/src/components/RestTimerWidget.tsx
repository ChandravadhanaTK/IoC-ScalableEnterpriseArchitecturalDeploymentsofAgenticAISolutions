import React from 'react';
import { Timer, X, Plus, Play, Pause } from 'lucide-react';
import { useWorkoutSession } from '../context/WorkoutSessionContext';

export const RestTimerWidget: React.FC = () => {
  const {
    restTimerSeconds,
    restTimerInitial,
    isRestTimerActive,
    startRestTimer,
    stopRestTimer
  } = useWorkoutSession();

  if (!isRestTimerActive && restTimerSeconds === 0) return null;

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const progress = restTimerInitial > 0 ? (restTimerSeconds / restTimerInitial) * 100 : 0;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 bg-[#181b26]/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl w-72 animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
          <Timer className="w-4 h-4 animate-spin-slow" />
          <span>Rest Timer</span>
        </div>
        <button
          onClick={stopRestTimer}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between my-2">
        <div className="font-mono text-3xl font-extrabold text-white tracking-tight">
          {formatSecs(restTimerSeconds)}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startRestTimer(restTimerSeconds + 30)}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-lg border border-slate-700 transition"
          >
            +30s
          </button>
          <button
            onClick={() => startRestTimer(restTimerSeconds + 60)}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-lg border border-slate-700 transition"
          >
            +1m
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
        <span>Rest Preset</span>
        <div className="flex gap-1.5">
          {[60, 90, 120, 180].map((sec) => (
            <button
              key={sec}
              onClick={() => startRestTimer(sec)}
              className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400"
            >
              {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
