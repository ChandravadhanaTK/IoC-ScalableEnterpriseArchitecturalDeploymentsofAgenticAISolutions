import React, { useState, useEffect } from 'react';
import { History, Search, Dumbbell, Trash2 } from 'lucide-react';
import { workoutsApi } from '../api/client';
import { Workout } from '../types';
import { WorkoutCard } from '../components/WorkoutCard';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';

import { useWorkoutSession } from '../context/WorkoutSessionContext';

export const HistoryPage: React.FC = () => {
  const { lastWorkoutSavedAt } = useWorkoutSession();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await workoutsApi.getMyHistory(p, 10);
      setWorkouts(res.workouts);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page, lastWorkoutSavedAt]);

  const filteredWorkouts = workouts.filter((w) =>
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    (w.notes && w.notes.toLowerCase().includes(search.toLowerCase())) ||
    w.workout_exercises?.some((we) => we.exercise.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" /> Workout History
          </h1>
          <p className="text-xs text-slate-400">View and review all your past logged training sessions</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by title, notes, or exercise name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-sm"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-40 animate-pulse bg-slate-800/40" />
          ))}
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center space-y-3 border border-[#262a3a]">
          <Dumbbell className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-extrabold text-base text-slate-300">No workout records found</h3>
          <p className="text-xs text-slate-400">Log a new workout to populate your history catalog.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onSelectWorkout={(workout) => setSelectedWorkout(workout)}
            />
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-xs font-bold text-slate-400 flex items-center">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
      />
    </div>
  );
};
