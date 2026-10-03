import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import { X, Play, CheckCircle2, AlertTriangle, Shield, Clock, Bot, User, Trash2, Check, Tag } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onRunAgent: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onRunAgent }) => {
  const { updateTask, deleteTask, toggleSubtask, approveHitl, rejectHitl } = useTasks();
  const { currentUser } = useAuth();
  const [hitlNotes, setHitlNotes] = useState('');

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 border border-slate-700 text-slate-300">
                {task.priority}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-950/60 border border-indigo-800 text-indigo-300">
                {task.quadrant.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400">
                {task.securityLevel.toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white pt-1">{task.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description & Scope</label>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            {task.description}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Impact Weight</span>
            <span className="text-sm font-bold text-white font-mono">{task.impactScore} / 10</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Urgency Weight</span>
            <span className="text-sm font-bold text-white font-mono">{task.urgencyScore} / 10</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Assignee</span>
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1 mt-0.5">
              {task.assignee.isAgent ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              {task.assignee.name.split(' ')[0]}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">Due Date</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5">
              {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Agent Notes */}
        {task.agentNotes && (
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
              <Bot className="w-3.5 h-3.5" />
              Agent Telemetry & Execution State
            </div>
            <p className="text-xs text-purple-200/90 font-mono leading-relaxed">
              {task.agentNotes}
            </p>
          </div>
        )}

        {/* HITL Gate Action Bar */}
        {task.status === 'hitl_approval' && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              Human-In-The-Loop Approval Gate Active
            </div>
            <p className="text-xs text-slate-300">
              This task is classified as <strong>P0 Critical</strong> or requires access to restricted enterprise infrastructure.
              Lead Architect or Administrator sign-off is mandatory before autonomous tool execution.
            </p>

            <input
              type="text"
              placeholder="Optional approval notes or sign-off identifier..."
              value={hitlNotes}
              onChange={(e) => setHitlNotes(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-amber-500/30 rounded-lg p-2 text-white focus:outline-none"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  approveHitl(task.id, hitlNotes);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sign & Authorize Execution
              </button>
              <button
                onClick={() => {
                  rejectHitl(task.id, 'Policy violation or safety risk.');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition"
              >
                Reject / Block Task
              </button>
            </div>
          </div>
        )}

        {/* Subtasks Checklist */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Decomposed Work Items ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
          </label>
          <div className="space-y-2">
            {task.subtasks.map((st) => (
              <div
                key={st.id}
                onClick={() => toggleSubtask(task.id, st.id)}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                  st.completed
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400 line-through'
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      st.completed ? 'bg-emerald-500 border-emerald-500 text-black font-bold' : 'border-slate-700'
                    }`}
                  >
                    {st.completed && '✓'}
                  </div>
                  <span>{st.title}</span>
                </div>
                {st.toolUsed && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {st.toolUsed}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => deleteTask(task.id)}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Task
          </button>

          <div className="flex items-center gap-2">
            {task.status !== 'completed' && task.status !== 'hitl_approval' && (
              <button
                onClick={() => {
                  onClose();
                  onRunAgent(task);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Execute Autonomous Agent
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
