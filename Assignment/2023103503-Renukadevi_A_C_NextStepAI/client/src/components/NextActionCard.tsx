import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  SkipForward, 
  Clock, 
  Flame, 
  MessageSquare,
  Sparkles,
  Loader2 
} from 'lucide-react';
import StuckModal from './StuckModal';

interface Task {
  id: string;
  title: string;
  description?: string;
  estimated_minutes?: number;
  difficulty?: string;
  status?: string;
}

interface NextActionCardProps {
  goalId: string;
  goalTitle: string;
  task: Task | null;
  agentState: string;
  onActionComplete: () => void;
}

export default function NextActionCard({
  goalId,
  goalTitle,
  task,
  agentState,
  onActionComplete,
}: NextActionCardProps) {
  // Timer state (25 minutes Pomodoro)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isStuckModalOpen, setIsStuckModalOpen] = useState(false);
  const [studentNote, setStudentNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAction = async (action: 'done' | 'skip') => {
    setActionLoading(true);
    try {
      const { agentApi } = await import('../services/api');
      await agentApi.action(goalId, action, studentNote);
      setStudentNote('');
      setShowNoteInput(false);
      onActionComplete();
    } catch (err) {
      console.error('Action failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!task) {
    return null;
  }

  const getDifficultyColor = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'text-accent-green bg-accent-green/15 border-accent-green/30';
      case 'hard':
        return 'text-accent-red bg-accent-red/15 border-accent-red/30';
      default:
        return 'text-accent-amber bg-accent-amber/15 border-accent-amber/30';
    }
  };

  return (
    <div className="card border-electric-500/30 relative overflow-hidden bg-gradient-to-b from-navy-800 to-navy-800/90 shadow-xl shadow-black/20">
      {/* Top Banner indicating Agent Focus */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${task.title.includes('[Unblocker]') || task.title.includes('⚡') ? 'bg-amber-400 animate-ping' : 'bg-electric-400 animate-pulse'}`} />
          <span className={`text-xs uppercase tracking-wider font-bold ${task.title.includes('[Unblocker]') || task.title.includes('⚡') ? 'text-amber-400 flex items-center gap-1' : 'text-electric-400'}`}>
            {task.title.includes('[Unblocker]') || task.title.includes('⚡') ? '⚡ Agent Adapted Unblocker Step' : 'Current Actionable Next Step'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(task.title.includes('[Unblocker]') || task.title.includes('⚡')) && (
            <span className="badge bg-amber-500/20 border-amber-500/30 text-amber-300 text-[11px] font-bold">
              Unblocker
            </span>
          )}
          <span className={`badge border text-[11px] font-medium ${getDifficultyColor(task.difficulty)}`}>
            <Flame className="w-3 h-3" />
            <span className="capitalize">{task.difficulty || 'Medium'}</span>
          </span>
          <span className="badge bg-white/5 border-white/10 text-white/70 text-[11px] font-medium">
            <Clock className="w-3 h-3 text-white/40" />
            <span>{task.estimated_minutes || 30} mins</span>
          </span>
        </div>
      </div>

      {/* Goal Title Context */}
      <div className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
        <span>Target Goal:</span>
        <span className="text-white/80 font-medium">{goalTitle}</span>
      </div>

      {/* Task Heading */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
        {task.title}
      </h2>

      {task.description && (
        <div className="text-xs sm:text-sm text-white/80 mb-5 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 whitespace-pre-line">
          {task.description}
        </div>
      )}

      {/* Pomodoro & Timer Section */}
      <div className="p-4 rounded-xl bg-navy-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-mono font-bold text-white tracking-wider">
            {formatTime(secondsLeft)}
          </div>
          <span className="text-xs text-white/40">Focus Session</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 ${
              isTimerRunning ? 'bg-accent-amber/20 text-accent-amber border-accent-amber/30' : ''
            }`}
          >
            {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isTimerRunning ? 'Pause' : 'Start Focus'}</span>
          </button>
          <button
            onClick={() => {
              setIsTimerRunning(false);
              setSecondsLeft(25 * 60);
            }}
            title="Reset timer"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optional Student Note Input */}
      {showNoteInput && (
        <div className="mb-4 animate-fade-in">
          <label className="label text-xs flex items-center justify-between">
            <span>Add an observation / takeaway (Optional)</span>
            <button
              onClick={() => setShowNoteInput(false)}
              className="text-white/40 hover:text-white text-[11px]"
            >
              Cancel
            </button>
          </label>
          <input
            type="text"
            value={studentNote}
            onChange={(e) => setStudentNote(e.target.value)}
            placeholder="e.g. Completed step, learned how to write the schema..."
            className="input text-xs"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          {!showNoteInput && (
            <button
              onClick={() => setShowNoteInput(true)}
              className="text-white/50 hover:text-white/80 text-xs flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-white/5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Add Reflection</span>
            </button>
          )}

          <button
            onClick={() => setIsStuckModalOpen(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 text-accent-amber hover:text-accent-amber bg-accent-amber/10 border-accent-amber/20"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-accent-amber" />
            <span>I'm Stuck</span>
          </button>

          <button
            onClick={() => handleAction('skip')}
            disabled={actionLoading}
            className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-white/5"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip</span>
          </button>
        </div>

        <button
          onClick={() => handleAction('done')}
          disabled={actionLoading}
          className="btn-primary text-sm flex items-center gap-2 py-2.5 px-5 shadow-lg shadow-electric-500/30"
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>{actionLoading ? 'Updating Progress…' : 'Mark as Done'}</span>
        </button>
      </div>

      <StuckModal
        isOpen={isStuckModalOpen}
        onClose={() => setIsStuckModalOpen(false)}
        goalId={goalId}
        taskTitle={task.title}
        onResolved={onActionComplete}
      />
    </div>
  );
}
