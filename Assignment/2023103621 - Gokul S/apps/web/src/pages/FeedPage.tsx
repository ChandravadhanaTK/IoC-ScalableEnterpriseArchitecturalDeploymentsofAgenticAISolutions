import React, { useState, useEffect } from 'react';
import { Home, RefreshCw, Users, Plus, Flame } from 'lucide-react';
import { Workout } from '../types';
import { socialApi } from '../api/client';
import { WorkoutCard } from '../components/WorkoutCard';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';

interface FeedPageProps {
  onNavigateToTab: (tab: string, param?: string) => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({ onNavigateToTab }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const fetchFeed = async (isRefresh = false) => {
    if (isRefresh) setLoading(true);
    try {
      const res = await socialApi.getFeed();
      setWorkouts(res.feed);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(true);
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || fetchingMore) return;
    setFetchingMore(true);
    try {
      const res = await socialApi.getFeed(nextCursor);
      setWorkouts((prev) => [...prev, ...res.feed]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.error('Failed to fetch more feed:', err);
    } finally {
      setFetchingMore(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 md:pb-12">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Home className="w-6 h-6 text-cyan-400" /> Community Activity
          </h1>
          <p className="text-xs text-slate-400">See latest workouts from athletes you follow</p>
        </div>
        <button
          onClick={() => fetchFeed(true)}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-48 animate-pulse bg-slate-800/40" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center space-y-4 border border-[#262a3a]">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-200">Your feed is quiet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Follow other gym athletes or log your first workout to get the activity started!
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToTab('search')}
              className="px-5 py-2.5 bg-cyan-500 text-black font-extrabold text-xs rounded-xl shadow-glow"
            >
              Find People to Follow
            </button>
            <button
              onClick={() => onNavigateToTab('log')}
              className="px-5 py-2.5 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-700"
            >
              Log Workout
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onSelectWorkout={(workout) => setSelectedWorkout(workout)}
              onSelectUser={(username) => onNavigateToTab('profile', username)}
            />
          ))}

          {nextCursor && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={fetchingMore}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs rounded-xl border border-slate-700 transition"
              >
                {fetchingMore ? 'Loading more...' : 'Load More Workouts'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onSelectUser={(username) => onNavigateToTab('profile', username)}
      />
    </div>
  );
};
