import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Target, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Sparkles 
} from 'lucide-react';
import Header from '../components/Header';
import { goalsApi } from '../services/api';

export default function GoalWorkspacePage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState(false);

  const loadGoal = async () => {
    if (!goalId) return;
    try {
      const res = await goalsApi.get(goalId);
      setData(res.data);
      // Expand all milestones by default
      const initialExpanded: Record<string, boolean> = {};
      res.data?.milestones?.forEach((m: any) => {
        initialExpanded[m.id] = true;
      });
      setExpandedMilestones(initialExpanded);
    } catch (err) {
      console.error('Failed to load goal', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoal();
  }, [goalId]);

  const toggleMilestone = (id: string) => {
    setExpandedMilestones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async () => {
    if (!goalId) return;
    if (!confirm('Are you sure you want to delete this goal and its plan?')) return;
    setDeleting(true);
    try {
      await goalsApi.delete(goalId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete goal', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 text-electric-400 animate-spin" />
      </div>
    );
  }

  const goal = data?.goal;
  const milestones = data?.milestones || [];
  const agentState = data?.agent_state;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={goal?.title || 'Goal Plan'}
        subtitle="Full milestone roadmap & decomposed tasks"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-white/50 hover:text-white flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting…' : 'Delete Goal'}</span>
          </button>
        </div>

        {/* Goal Banner */}
        <div className="card p-6 border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <span className="badge bg-electric-500/20 text-electric-400 border border-electric-500/30 uppercase text-[11px] font-bold">
              {goal?.category || 'Goal'}
            </span>
            <span className="text-xs font-mono font-bold text-accent-green">
              {Math.round(goal?.progress || 0)}% Complete
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{goal?.title}</h2>
          {goal?.description && (
            <p className="text-xs text-white/60 leading-relaxed mb-4">{goal?.description}</p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-electric-500 to-accent-green h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(goal?.progress || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Milestones and Tasks list */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-electric-400" />
            <span>Plan Breakdown ({milestones.length} Milestones)</span>
          </h3>

          {milestones.map((m: any, mIdx: number) => {
            const isExpanded = expandedMilestones[m.id];
            const completedCount = m.tasks?.filter((t: any) => t.status === 'completed').length || 0;
            const totalCount = m.tasks?.length || 0;
            const isDone = completedCount === totalCount && totalCount > 0;

            return (
              <div key={m.id} className="card p-4 border-white/10">
                <button
                  onClick={() => toggleMilestone(m.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 text-white/70 text-xs font-bold flex items-center justify-center">
                      {mIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{m.title}</h4>
                      <p className="text-[11px] text-white/40">
                        {completedCount}/{totalCount} tasks completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isDone && (
                      <span className="badge bg-accent-green/20 text-accent-green border border-accent-green/30 text-[10px]">
                        Milestone Done
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    {m.tasks?.map((t: any) => {
                      const isTaskDone = t.status === 'completed';
                      const isInProgress = t.status === 'in_progress';

                      return (
                        <div
                          key={t.id}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                            isTaskDone
                              ? 'bg-accent-green/5 border-accent-green/20 text-white/60'
                              : isInProgress
                              ? 'bg-electric-500/10 border-electric-500/40 text-white'
                              : 'bg-white/5 border-white/5 text-white/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isTaskDone ? (
                              <CheckCircle2 className="w-4 h-4 text-accent-green shrink-0" />
                            ) : isInProgress ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-electric-400 animate-ping shrink-0" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-white/20 shrink-0" />
                            )}
                            <span className={`font-medium ${isTaskDone ? 'line-through text-white/40' : ''}`}>
                              {t.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t.estimated_minutes || 30}m
                            </span>
                            <span className="text-[10px] uppercase font-bold text-white/40 px-1.5 py-0.5 rounded bg-white/5">
                              {t.difficulty || 'med'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
