import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, PlusCircle, ArrowRight, Trophy, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { goalsApi } from '../services/api';

export default function GoalsListPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    goalsApi.list()
      .then(res => setGoals(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredGoals = goals.filter(g => {
    if (filter === 'active') return g.status === 'active';
    if (filter === 'completed') return g.status === 'completed';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="My Goals & Plans"
        subtitle="Manage and view all your current and completed learning roadmaps."
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['all', 'active', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === f
                    ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
                }`}
              >
                {f} ({goals.filter(g => f === 'all' ? true : g.status === f).length})
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/create-goal')}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-electric-400 animate-spin mx-auto" />
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="card p-12 text-center space-y-3">
            <Target className="w-10 h-10 text-white/30 mx-auto" />
            <h4 className="text-base font-bold text-white">No goals found</h4>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              You haven't added any goals in this category yet. Start one now to let NextStep guide you.
            </p>
            <button
              onClick={() => navigate('/create-goal')}
              className="btn-primary text-xs inline-flex items-center gap-2 mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Goal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((g) => {
              const isDone = g.status === 'completed';

              return (
                <div key={g.id} className="card p-5 border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        isDone
                          ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                          : 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                      }`}>
                        {g.status}
                      </span>
                      <span className="text-[11px] text-white/40 font-mono">
                        {g.completed_task_count}/{g.task_count} tasks done
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{g.title}</h3>
                    {g.description && (
                      <p className="text-xs text-white/50 line-clamp-2 mb-4 leading-relaxed">
                        {g.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-electric-500 h-full rounded-full"
                          style={{ width: `${Math.min(g.progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-white">
                        {Math.round(g.progress)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="text-xs text-electric-400 hover:text-electric-300 font-semibold"
                      >
                        Set as Active Focus →
                      </button>

                      <button
                        onClick={() => navigate(`/goals/${g.id}`)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <span>View Plan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
