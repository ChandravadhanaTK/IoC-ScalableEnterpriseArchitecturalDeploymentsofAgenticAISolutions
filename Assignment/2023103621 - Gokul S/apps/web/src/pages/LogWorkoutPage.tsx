import React, { useState } from 'react';
import { Plus, Trash2, Check, Timer, Globe, Lock, Clock, Sparkles, Dumbbell, AlertTriangle } from 'lucide-react';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { useAuth } from '../context/AuthContext';
import { ExerciseSelectorModal } from '../components/ExerciseSelectorModal';
import { formatWeight, displayWeightNum, inputToKg } from '../utils/units';
import { SetType } from '../types';

interface LogWorkoutPageProps {
  onWorkoutFinished?: () => void;
}

export const LogWorkoutPage: React.FC<LogWorkoutPageProps> = ({ onWorkoutFinished }) => {
  const { user } = useAuth();
  const unit = user?.unit_preference || 'kg';

  const {
    activeWorkout,
    isWorkoutActive,
    elapsedSeconds,
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
    startRestTimer
  } = useWorkoutSession();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishingLoading, setFinishingLoading] = useState(false);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isWorkoutActive || !activeWorkout) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-glow">
          <Dumbbell className="w-10 h-10 text-black" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-100">Ready to train?</h1>
          <p className="text-slate-400 text-sm">
            Start logging sets, track rest timers, and see previous performance numbers live.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <button
            onClick={() => startWorkout('Push Workout')}
            className="p-5 glass-card rounded-2xl border border-[#262a3a] hover:border-cyan-400 text-left transition group space-y-2"
          >
            <span className="font-extrabold text-slate-100 text-base group-hover:text-cyan-400">
              Push Day
            </span>
            <p className="text-xs text-slate-400">Chest, Shoulders & Triceps</p>
          </button>
          <button
            onClick={() => startWorkout('Pull Workout')}
            className="p-5 glass-card rounded-2xl border border-[#262a3a] hover:border-cyan-400 text-left transition group space-y-2"
          >
            <span className="font-extrabold text-slate-100 text-base group-hover:text-cyan-400">
              Pull Day
            </span>
            <p className="text-xs text-slate-400">Back, Rear Delts & Biceps</p>
          </button>
          <button
            onClick={() => startWorkout('Leg Day')}
            className="p-5 glass-card rounded-2xl border border-[#262a3a] hover:border-cyan-400 text-left transition group space-y-2"
          >
            <span className="font-extrabold text-slate-100 text-base group-hover:text-cyan-400">
              Leg Day
            </span>
            <p className="text-xs text-slate-400">Squats, Hamstrings & Calves</p>
          </button>
          <button
            onClick={() => startWorkout('Full Body Session')}
            className="p-5 glass-card rounded-2xl border border-[#262a3a] hover:border-cyan-400 text-left transition group space-y-2"
          >
            <span className="font-extrabold text-slate-100 text-base group-hover:text-cyan-400">
              Full Body
            </span>
            <p className="text-xs text-slate-400">High energy compound routine</p>
          </button>
        </div>

        <div className="pt-4">
          <button
            onClick={() => startWorkout('Empty Workout')}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold rounded-2xl shadow-glow text-base transition hover:brightness-110"
          >
            Start Empty Workout
          </button>
        </div>
      </div>
    );
  }

  const handleFinishSubmit = async () => {
    setFinishingLoading(true);
    try {
      await finishWorkout();
      setIsFinishing(false);
      onWorkoutFinished && onWorkoutFinished();
    } catch (err) {
      console.error('Finish error:', err);
    } finally {
      setFinishingLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28">
      {/* Top Header: Title, Timer, Finish Button */}
      <div className="glass-card p-5 rounded-3xl border border-[#262a3a] sticky top-14 md:top-4 z-20 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={activeWorkout.title}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              className="bg-transparent font-extrabold text-xl sm:text-2xl text-slate-100 focus:outline-none focus:border-b border-cyan-400 w-full"
              placeholder="Workout Name..."
            />
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                <Clock className="w-3.5 h-3.5" />
                {formatTimer(elapsedSeconds)}
              </span>
              <span>{activeWorkout.exercises.length} Exercise(s)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => startRestTimer(90)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl transition border border-slate-700"
              title="Start 90s Rest Timer"
            >
              <Timer className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFinishing(true)}
              disabled={activeWorkout.exercises.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-black font-extrabold text-sm rounded-xl shadow-glow transition disabled:opacity-50"
            >
              Finish
            </button>
          </div>
        </div>

        {/* Workout Notes */}
        <textarea
          value={activeWorkout.notes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          placeholder="Add workout notes or thoughts..."
          rows={1}
          className="w-full mt-3 px-3 py-2 text-xs bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
      </div>

      {/* Exercises List */}
      <div className="space-y-6">
        {activeWorkout.exercises.map((ex, exIndex) => (
          <div
            key={ex.exercise_id + exIndex}
            className="glass-card rounded-3xl p-5 border border-[#262a3a] space-y-4"
          >
            {/* Exercise Title Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-100">{ex.exercise.name}</h3>
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20">
                  {ex.exercise.muscle_group}
                </span>
              </div>
              <button
                onClick={() => removeExercise(ex.exercise_id)}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Sets Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-800 text-[10px] uppercase">
                    <th className="pb-2 px-2 w-12 text-center">Set</th>
                    <th className="pb-2 px-2 w-16">Type</th>
                    <th className="pb-2 px-2">Previous ({unit})</th>
                    <th className="pb-2 px-2">{unit.toUpperCase()}</th>
                    <th className="pb-2 px-2">Reps</th>
                    <th className="pb-2 px-2 w-12 text-center">Done</th>
                    <th className="pb-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {ex.sets.map((set, setIndex) => {
                    const displayWeight = displayWeightNum(set.weight_kg, unit);

                    return (
                      <tr
                        key={setIndex}
                        className={`transition ${
                          set.completed ? 'bg-cyan-950/20' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Set Number */}
                        <td className="py-2.5 px-2 text-center font-bold text-slate-300">
                          {set.set_number}
                        </td>

                        {/* Set Type Tag */}
                        <td className="py-2.5 px-2">
                          <select
                            value={set.set_type}
                            onChange={(e) =>
                              updateSet(ex.exercise_id, setIndex, 'set_type', e.target.value as SetType)
                            }
                            className="bg-slate-800 text-slate-200 text-[10px] font-bold rounded px-1.5 py-1 border border-slate-700 focus:outline-none"
                          >
                            <option value="normal">N</option>
                            <option value="warmup">W</option>
                            <option value="drop">D</option>
                          </select>
                        </td>

                        {/* Previous Numbers display */}
                        <td className="py-2.5 px-2 text-slate-400 font-sans text-xs">
                          {set.previous_weight_kg !== undefined ? (
                            <span>
                              {formatWeight(set.previous_weight_kg, unit)} × {set.previous_reps}
                            </span>
                          ) : (
                            <span className="text-slate-400/60">—</span>
                          )}
                        </td>

                        {/* Weight Input */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={displayWeight || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateSet(ex.exercise_id, setIndex, 'weight_kg', inputToKg(val, unit));
                            }}
                            className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs text-center focus:border-cyan-400 focus:outline-none"
                          />
                        </td>

                        {/* Reps Input */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={set.reps || ''}
                            onChange={(e) =>
                              updateSet(ex.exercise_id, setIndex, 'reps', parseInt(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs text-center focus:border-cyan-400 focus:outline-none"
                          />
                        </td>

                        {/* Complete Set Toggle Button */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSetCompleted(ex.exercise_id, setIndex)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                              set.completed
                                ? 'bg-cyan-500 text-black shadow-glow font-bold'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>

                        {/* Remove Set Button */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeSet(ex.exercise_id, setIndex)}
                            className="text-slate-400 hover:text-rose-400 transition p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Set Button */}
            <button
              onClick={() => addSet(ex.exercise_id)}
              className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Set
            </button>
          </div>
        ))}
      </div>

      {/* Add Exercise & Cancel Bar */}
      <div className="space-y-3">
        <button
          onClick={() => setIsSelectorOpen(true)}
          className="w-full py-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-glow"
        >
          <Plus className="w-5 h-5" /> Add Exercise to Workout
        </button>

        <button
          onClick={cancelWorkout}
          className="w-full py-2.5 text-rose-400 hover:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Discard Workout
        </button>
      </div>

      {/* Exercise Selector Modal */}
      <ExerciseSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectExercise={(ex) => addExercise(ex)}
      />

      {/* Finish Workout Confirmation Modal */}
      {isFinishing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#12141c] border border-[#262a3a] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="font-extrabold text-xl text-slate-100">Finish Workout</h2>
              <p className="text-xs text-slate-400">
                Great session! Save this workout to your history and calendar.
              </p>
            </div>

            {/* Share to Social Feed Toggle */}
            <div className="bg-[#181b26] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeWorkout.is_shared ? (
                  <Globe className="w-5 h-5 text-cyan-400" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="font-bold text-sm text-slate-200">Share to Social Feed</p>
                  <p className="text-xs text-slate-400">Followers can view & like this workout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWorkoutShared(!activeWorkout.is_shared)}
                className={`w-12 h-6 rounded-full transition p-1 flex items-center ${
                  activeWorkout.is_shared ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black shadow-md" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsFinishing(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-sm"
              >
                Keep Editing
              </button>
              <button
                onClick={handleFinishSubmit}
                disabled={finishingLoading}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-black font-extrabold rounded-xl transition shadow-glow text-sm"
              >
                {finishingLoading ? 'Saving...' : 'Save & Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
