import { useState, useEffect } from 'react';
import { Activity, Sparkles, CheckCircle2, AlertTriangle, SkipForward, Clock, RefreshCw, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { agentApi } from '../services/api';

export default function AgentActivityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalTitle, setGoalTitle] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const dash = await agentApi.dashboard();
      if (dash.data.primary_goal) {
        setGoalTitle(dash.data.primary_goal.title);
        const res = await agentApi.events(dash.data.primary_goal.id);
        setEvents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-accent-green" />;
      case 'student_stuck':
        return <AlertTriangle className="w-4 h-4 text-accent-amber" />;
      case 'task_skipped':
        return <SkipForward className="w-4 h-4 text-white/50" />;
      default:
        return <Sparkles className="w-4 h-4 text-electric-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Agent Activity Stream"
        subtitle={`Live decision and observation log for: ${goalTitle || 'Primary Goal'}`}
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Agent Loop Explanation Banner */}
        <div className="card p-5 bg-gradient-to-r from-electric-500/10 via-accent-purple/10 to-transparent border-electric-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-electric-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Autonomous Agent Loop Architecture
            </span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-mono">
            GOAL → UNDERSTAND → PLAN → SELECT NEXT ACTION → WAIT FOR STUDENT → OBSERVE RESULT → REPLAN → NEW NEXT ACTION
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-electric-400" />
            <span>Event History ({events.length} Actions)</span>
          </span>

          <button
            onClick={loadEvents}
            disabled={loading}
            className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-electric-400 animate-spin mx-auto" />
          </div>
        ) : events.length === 0 ? (
          <div className="card p-8 text-center text-xs text-white/40">
            No events recorded yet for this goal. As you complete steps or request help, the agent stream will update here.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((e, idx) => (
              <div key={e.id || idx} className="card p-4 border-white/5 flex items-start gap-4">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                  {getEventIcon(e.event_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white capitalize">
                      {e.event_type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-white/40 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {e.data && (
                    <div className="text-xs text-white/60 space-y-1">
                      {e.data.task_title && (
                        <p className="text-white/80 font-medium">Task: {e.data.task_title}</p>
                      )}
                      {e.data.message && (
                        <p className="italic bg-white/5 p-2 rounded text-white/70">
                          Student note: "{e.data.message}"
                        </p>
                      )}
                      {e.data.rationale && (
                        <p className="text-electric-300">
                          Agent Rationale: {e.data.rationale}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
