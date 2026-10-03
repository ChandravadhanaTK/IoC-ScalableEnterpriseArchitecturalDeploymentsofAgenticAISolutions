import React from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import { Bot, CheckCircle2, AlertTriangle, Play, X, Terminal, Cpu, ShieldCheck } from 'lucide-react';

interface AgentExecutionModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentExecutionModal: React.FC<AgentExecutionModalProps> = ({ task, isOpen, onClose }) => {
  const { isExecutingAgent, activeExecutionSteps, runAgentExecution, cancelAgentExecution, approveHitl } = useTasks();
  const { currentUser } = useAuth();

  if (!isOpen || !task) return null;

  const currentStep = activeExecutionSteps.find(s => s.status === 'running') || activeExecutionSteps[activeExecutionSteps.length - 1];
  const isHitlBlocked = activeExecutionSteps.some(s => s.status === 'hitl_blocked') || task.status === 'hitl_approval';
  const isAllComplete = activeExecutionSteps.length > 0 && activeExecutionSteps.every(s => s.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Autonomous Agent Execution</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  v3.4 Production Runner
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Target Task: {task.title}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cancelAgentExecution();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Start Button if not started */}
        {activeExecutionSteps.length === 0 && !isExecutingAgent && (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-base font-bold text-white">Ready for Autonomous Orchestration</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The agent will ingest the task, execute security sanitization, calculate dynamic priority weights, spin up an isolated Firecracker sandbox, and commit cryptographically signed state.
              </p>
            </div>

            <button
              onClick={() => runAgentExecution(task)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition inline-flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Launch Autonomous Agent Pipeline
            </button>
          </div>
        )}

        {/* Active Steps Progression */}
        {activeExecutionSteps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Pipeline Execution Plan</span>
              <span className="font-mono text-purple-400">
                {activeExecutionSteps.filter(s => s.status === 'completed').length} / {activeExecutionSteps.length} Steps
              </span>
            </div>

            <div className="space-y-3">
              {activeExecutionSteps.map((step) => {
                const isRunning = step.status === 'running';
                const isDone = step.status === 'completed';
                const isBlocked = step.status === 'hitl_blocked';

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-xl border text-xs transition-all ${
                      isRunning
                        ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/40'
                        : isDone
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : isBlocked
                        ? 'border-amber-500/50 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-950/50 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          STEP 0{step.stepNumber}
                        </span>
                        <span className="font-bold text-white text-sm">{step.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                          {step.role}
                        </span>
                        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isRunning && <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />}
                        {isBlocked && <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />}
                      </div>
                    </div>

                    <div className="text-slate-300 font-mono text-[11px] mt-1">
                      {step.inputSummary}
                    </div>

                    {step.outputSummary && (
                      <div className="mt-2 p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-emerald-300 font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        {step.outputSummary}
                      </div>
                    )}

                    {isBlocked && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-2">
                        <div className="text-amber-300 font-bold text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Security Policy Gate: Human Authorization Required
                        </div>
                        <p className="text-slate-300 text-xs">
                          Task is marked as P0 Critical or Restricted. Execution paused at isolated sandbox boundary.
                        </p>
                        <button
                          onClick={() => {
                            approveHitl(task.id, 'One-Click HITL authorization granted by ' + currentUser.name);
                            runAgentExecution(task);
                          }}
                          className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Authorize & Continue Run
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Complete Banner */}
        {isAllComplete && (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 space-y-1">
            <div className="font-bold flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Autonomous Run Successfully Concluded
            </div>
            <p className="text-slate-300 font-sans">
              All subtasks executed and verified against acceptance criteria. Changes committed and cryptographically sealed into the immutable audit trail.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              cancelAgentExecution();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            {isAllComplete ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
