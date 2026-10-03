import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { Zap, CheckCircle2, Sparkles, X, ArrowRight, ShieldCheck, Scale, AlertCircle } from 'lucide-react';

interface AutoPrioritizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoPrioritizeModal: React.FC<AutoPrioritizeModalProps> = ({ isOpen, onClose }) => {
  const { tasks, autoPrioritizeAll } = useTasks();
  const { currentUser } = useAuth();
  const [result, setResult] = useState<{ updatedCount: number; summary: string } | null>(null);

  if (!isOpen) return null;

  const handleExecute = () => {
    const res = autoPrioritizeAll();
    setResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI Multi-Factor Prioritization Engine</h3>
              <p className="text-xs text-slate-400">
                Automated Eisenhower matrix optimization and P0-P3 dependency resolution.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Algorithm Formula Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Prioritization Formula Model
            </span>
            <span className="font-mono text-[10px] text-slate-500">v3.2 Autonomous Planner</span>
          </div>
          <p className="text-xs text-slate-300 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            Score = (Impact × 0.40) + (Urgency × 0.35) + (DependencyBlockers × 0.15) + (SecurityTier × 0.10)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
            <div>• Impact: Business SLA</div>
            <div>• Urgency: 24h/72h SLA</div>
            <div>• Blocker DAG count</div>
            <div>• Restricted: P0 Floor</div>
          </div>
        </div>

        {/* Current State Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Total Active Tasks</span>
            <span className="text-base font-bold text-white font-mono">{tasks.length}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">P0 Critical Tasks</span>
            <span className="text-base font-bold text-rose-400 font-mono">
              {tasks.filter(t => t.priority === 'P0_CRITICAL').length}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Q1 Do First Items</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {tasks.filter(t => t.quadrant === 'do_first').length}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Agent Assigned</span>
            <span className="text-base font-bold text-purple-400 font-mono">
              {tasks.filter(t => t.assignee.isAgent).length}
            </span>
          </div>
        </div>

        {/* Execution Output Banner */}
        {result && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Prioritization Optimization Completed!
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">{result.summary}</p>
            <div className="text-[10px] text-emerald-400/80 font-mono pt-1">
              Signed by {currentUser.name} • Registered in SHA-256 Audit Trail
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            Executor Role: {currentUser.role.toUpperCase()}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              {result ? 'Done' : 'Cancel'}
            </button>

            {!result && (
              <button
                onClick={handleExecute}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Run Multi-Factor Prioritization
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
