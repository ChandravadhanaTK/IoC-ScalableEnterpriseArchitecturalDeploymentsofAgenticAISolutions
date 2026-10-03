import React from 'react';
import { useTasks } from '../../context/TaskContext';
import { Task, EisenhowerQuadrant } from '../../types';
import { Play, CheckCircle2, AlertTriangle, ArrowRight, Bot, Clock, Sparkles } from 'lucide-react';

interface EisenhowerMatrixViewProps {
  onSelectTask: (task: Task) => void;
  onRunAgent: (task: Task) => void;
  onOpenAutoPrioritize: () => void;
}

export const EisenhowerMatrixView: React.FC<EisenhowerMatrixViewProps> = ({
  onSelectTask,
  onRunAgent,
  onOpenAutoPrioritize,
}) => {
  const { tasks, updateTask } = useTasks();

  const getTasksByQuadrant = (quadrant: EisenhowerQuadrant) => {
    return tasks.filter((t) => t.quadrant === quadrant);
  };

  const quadrantsConfig = [
    {
      id: 'do_first' as EisenhowerQuadrant,
      title: 'Quadrant 1: DO FIRST',
      subtitle: 'Urgent & Critical (Impact ≥ 7, Urgency ≥ 7)',
      accentColor: 'border-rose-500/50 bg-rose-950/20 text-rose-300',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      description: 'P0 & P1 vulnerabilities, SLA breaches, active outages, security hotfixes.',
    },
    {
      id: 'schedule' as EisenhowerQuadrant,
      title: 'Quadrant 2: SCHEDULE',
      subtitle: 'Important & Strategic (Impact ≥ 7, Urgency < 7)',
      accentColor: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      description: 'Distributed tracing, architectural refactoring, KEDA autoscaling, multi-region DR.',
    },
    {
      id: 'delegate' as EisenhowerQuadrant,
      title: 'Quadrant 3: DELEGATE',
      subtitle: 'Urgent & Operational (Impact < 7, Urgency ≥ 7)',
      accentColor: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Autonomous agent delegations: k6 load test runs, dependency updates, sync webhooks.',
    },
    {
      id: 'backlog' as EisenhowerQuadrant,
      title: 'Quadrant 4: BACKLOG',
      subtitle: 'Low Urgency & Low Impact (Impact < 7, Urgency < 7)',
      accentColor: 'border-slate-700 bg-slate-900/40 text-slate-400',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
      description: 'Historical audit log cold storage, deprecation notices, optional backlog chores.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Eisenhower Prioritization Matrix (2x2)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic quadrant placement based on Impact (1-10) and Urgency (1-10) multi-factor weights.
          </p>
        </div>

        <button
          onClick={onOpenAutoPrioritize}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Re-Score & Optimize Matrix
        </button>
      </div>

      {/* Axis Indicators */}
      <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400">
        <span className="text-rose-400 font-bold">▲ HIGH IMPORTANCE / IMPACT</span>
        <span className="text-indigo-400 font-bold">URGENT ◀ ─── PRIORITY SPECTRUM ─── ▶ NOT URGENT</span>
        <span className="text-slate-500 font-bold">▼ LOW IMPORTANCE / BACKLOG</span>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quadrantsConfig.map((q) => {
          const quadTasks = getTasksByQuadrant(q.id);

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border ${q.accentColor} space-y-4 flex flex-col min-h-[380px] shadow-lg`}
            >
              {/* Quadrant Header */}
              <div className="flex items-start justify-between border-b border-slate-800/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{q.title}</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${q.badgeColor}`}>
                      {quadTasks.length} {quadTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{q.subtitle}</div>
                </div>
              </div>

              {/* Task Cards in Quadrant */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
                {quadTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-6 text-slate-500 text-xs italic">
                    No active tasks currently assigned to this quadrant.
                  </div>
                ) : (
                  quadTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-600 transition shadow-sm space-y-2 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] text-slate-400">
                          Imp: <strong className="text-white">{task.impactScore}</strong> • Urg: <strong className="text-white">{task.urgencyScore}</strong>
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {task.title}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex items-center gap-1">
                          {task.assignee.isAgent ? (
                            <span className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded">
                              <Bot className="w-3 h-3 text-purple-400" />
                              Agent
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {task.assignee.name.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        {task.status === 'hitl_approval' ? (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                            HITL Gate
                          </span>
                        ) : task.status !== 'completed' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRunAgent(task);
                            }}
                            className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            Run
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
