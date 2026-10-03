import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Target, 
  PlusCircle, 
  Trophy, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Clock, 
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { agentApi, goalsApi } from '../services/api';
import NextActionCard from '../components/NextActionCard';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalDetail, setGoalDetail] = useState<any>(null);

  const loadDashboard = async () => {
    try {
      const res = await agentApi.dashboard();
      setData(res.data);
      if (res.data.primary_goal && !selectedGoalId) {
        setSelectedGoalId(res.data.primary_goal.id);
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // When selected goal changes, fetch its specific details and task if needed
  useEffect(() => {
    if (!selectedGoalId) return;
    goalsApi.get(selectedGoalId)
      .then(res => setGoalDetail(res.data))
      .catch(err => console.error(err));
  }, [selectedGoalId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-electric-400 animate-spin mx-auto" />
          <p className="text-xs text-white/50">NextStep Agent is syncing your progress…</p>
        </div>
      </div>
    );
  }

  const primaryGoal = data?.primary_goal;
  const currentTask = goalDetail?.agent_state?.current_task || data?.current_task;
  const goalsList = data?.goals || [];
  const stats = data?.stats || { total_goals: 0, active_goals: 0, completed_goals: 0, avg_progress: 0 };

  // Other goals user can switch to
  const otherGoals = goalsList.filter((g: any) => g.id !== selectedGoalId);
  const activeOtherGoals = otherGoals.filter((g: any) => g.status === 'active');
  const isGoalCompleted = primaryGoal?.status === 'completed' || (primaryGoal?.progress === 100);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Today's Next Step"
        subtitle={`Welcome back, ${user?.name || 'Student'}! Focus on one action at a time.`}
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Goal Selector Bar if user has multiple goals */}
        {goalsList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs text-white/40 uppercase tracking-wider font-semibold whitespace-nowrap pl-1">
              Switch Goal:
            </span>
            {goalsList.map((g: any) => {
              const isSelected = g.id === selectedGoalId;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoalId(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${g.status === 'completed' ? 'bg-accent-green' : 'bg-electric-400'}`} />
                  <span className="truncate max-w-[160px]">{g.title}</span>
                  <span className="text-[10px] text-white/40 font-mono">{Math.round(g.progress)}%</span>
                </button>
              );
            })}
            <button
              onClick={() => navigate('/create-goal')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-dashed border-white/20 flex items-center gap-1 shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        )}

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <span className="text-xs text-white/40 block mb-1">Active Goals</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{stats.active_goals}</span>
              <Target className="w-5 h-5 text-electric-400" />
            </div>
          </div>

          <div className="card p-4">
            <span className="text-xs text-white/40 block mb-1">Completed Goals</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-accent-green">{stats.completed_goals}</span>
              <Trophy className="w-5 h-5 text-accent-green" />
            </div>
          </div>

          <div className="card p-4">
            <span className="text-xs text-white/40 block mb-1">Average Progress</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{stats.avg_progress}%</span>
              <TrendingUp className="w-5 h-5 text-accent-amber" />
            </div>
          </div>

          <div className="card p-4">
            <span className="text-xs text-white/40 block mb-1">Total Goals Tracked</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{stats.total_goals}</span>
              <Layers className="w-5 h-5 text-accent-purple" />
            </div>
          </div>
        </div>

        {/* MAIN FOCUS SECTION: One Clear Next Action OR Completed Celebration */}
        {isGoalCompleted || !currentTask ? (
          /* When goal is completed OR no tasks left -> Seamless Next Goal Flow */
          <div className="card border-accent-green/30 bg-gradient-to-b from-navy-800 to-accent-green/5 p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-accent-green/20 border border-accent-green/30 flex items-center justify-center text-accent-green mx-auto">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-white">
                {primaryGoal ? `Goal Completed: "${primaryGoal.title}"!` : "You have no active goals right now!"}
              </h2>
              <p className="text-sm text-white/60">
                {primaryGoal 
                  ? "Every single step and milestone has been checked off. Ready to take on your next challenge?" 
                  : "Let's set a new target. Tell NextStep what you want to achieve and we'll break it down."}
              </p>
            </div>

            {/* Seamless switch to another active goal if student has one */}
            {activeOtherGoals.length > 0 && (
              <div className="pt-2 pb-4">
                <span className="text-xs text-white/40 uppercase tracking-wider font-semibold block mb-3">
                  Continue with another active goal:
                </span>
                <div className="flex flex-wrap justify-center gap-3">
                  {activeOtherGoals.map((g: any) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setSelectedGoalId(g.id);
                        loadDashboard();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <Target className="w-4 h-4 text-electric-400" />
                      <span>{g.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prominent CTA to start next goal */}
            <div className="pt-2">
              <button
                onClick={() => navigate('/create-goal')}
                className="btn-primary py-3.5 px-8 text-sm font-semibold inline-flex items-center gap-2 shadow-xl shadow-electric-500/30 hover:scale-105 transition-transform"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Start Next Goal with AI Plan</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Next Action Card */
          <div className="space-y-4">
            <NextActionCard
              goalId={selectedGoalId || primaryGoal.id}
              goalTitle={goalDetail?.goal?.title || primaryGoal.title}
              task={currentTask}
              agentState={goalDetail?.agent_state?.state || data.agent_state}
              onActionComplete={() => {
                loadDashboard();
                if (selectedGoalId) {
                  goalsApi.get(selectedGoalId).then(r => setGoalDetail(r.data));
                }
              }}
            />

            {/* Goal Progress Bar */}
            <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center text-electric-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {goalDetail?.goal?.title || primaryGoal?.title}
                  </h4>
                  <p className="text-xs text-white/40">
                    Category: <span className="capitalize">{primaryGoal?.category || 'general'}</span> • Status: <span className="text-accent-green uppercase font-semibold text-[10px]">{primaryGoal?.status}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex-1 sm:w-48 bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-electric-500 to-accent-green h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(goalDetail?.goal?.progress ?? primaryGoal?.progress ?? 0, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-white min-w-[40px] text-right">
                  {Math.round(goalDetail?.goal?.progress ?? primaryGoal?.progress ?? 0)}%
                </span>
                <button
                  onClick={() => navigate(`/goals/${selectedGoalId || primaryGoal.id}`)}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <span>View All Steps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Section: Goals Overview List */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Your Learning Goals</h3>
              <p className="text-xs text-white/40">Switch focus or view comprehensive breakdown</p>
            </div>
            <button
              onClick={() => navigate('/create-goal')}
              className="text-xs text-electric-400 hover:text-electric-300 font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>

          {goalsList.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-xs">
              No goals created yet. Click "Add Goal" above to create your first one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {goalsList.map((g: any) => {
                const isCurrent = g.id === selectedGoalId;
                const isDone = g.status === 'completed';

                return (
                  <div
                    key={g.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-electric-500/10 border-electric-500/40 shadow-lg shadow-electric-500/10'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        isDone 
                          ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' 
                          : 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                      }`}>
                        {g.status}
                      </span>
                      <span className="text-[11px] text-white/40 font-mono">
                        {g.completed_task_count}/{g.task_count} tasks
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2 line-clamp-1">{g.title}</h4>

                    {/* Mini progress bar */}
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-3 overflow-hidden">
                      <div
                        className="bg-electric-500 h-full rounded-full"
                        style={{ width: `${Math.min(g.progress, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          setSelectedGoalId(g.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`text-xs font-semibold ${
                          isCurrent ? 'text-electric-400' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {isCurrent ? '● Active Focus' : 'Set as Focus'}
                      </button>

                      <button
                        onClick={() => navigate(`/goals/${g.id}`)}
                        className="text-xs text-white/40 hover:text-white flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
