import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskPriority, EisenhowerQuadrant, TaskStatus } from '../../types';
import { Plus, Search, Filter, Play, CheckCircle2, AlertTriangle, Shield, User, Bot, Clock, Tag, ChevronRight, Zap } from 'lucide-react';

interface TaskListViewProps {
  onOpenCreate: () => void;
  onOpenAutoPrioritize: () => void;
  onSelectTask: (task: Task) => void;
  onRunAgent: (task: Task) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  onOpenCreate,
  onOpenAutoPrioritize,
  onSelectTask,
  onRunAgent,
}) => {
  const { tasks, toggleSubtask, approveHitl } = useTasks();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterQuadrant, setFilterQuadrant] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTag) return false;
    }
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterQuadrant !== 'all' && t.quadrant !== filterQuadrant) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'P0_CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">P0 CRITICAL</span>;
      case 'P1_HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">P1 HIGH</span>;
      case 'P2_MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">P2 MEDIUM</span>;
      case 'P3_LOW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-700 text-slate-300 border border-slate-600">P3 LOW</span>;
    }
  };

  const getQuadrantBadge = (quadrant: EisenhowerQuadrant) => {
    switch (quadrant) {
      case 'do_first':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800">Q1: DO FIRST</span>;
      case 'schedule':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800">Q2: SCHEDULE</span>;
      case 'delegate':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800">Q3: DELEGATE</span>;
      case 'backlog':
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Q4: BACKLOG</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'hitl_approval':
        return <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> HITL Gate</span>;
      case 'in_progress':
        return <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1"><Zap className="w-3 h-3" /> In Progress</span>;
      case 'blocked':
        return <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Blocked</span>;
      case 'todo':
        return <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">To Do</span>;
      default:
        return <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">Backlog</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Enterprise Task Repository</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time backlog with automated Eisenhower matrix scoring and autonomous agent execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAutoPrioritize}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            AI Auto-Prioritize
          </button>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="P0_CRITICAL">P0 Critical</option>
            <option value="P1_HIGH">P1 High</option>
            <option value="P2_MEDIUM">P2 Medium</option>
            <option value="P3_LOW">P3 Low</option>
          </select>

          {/* Quadrant Filter */}
          <select
            value={filterQuadrant}
            onChange={(e) => setFilterQuadrant(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Quadrants</option>
            <option value="do_first">Q1: Do First</option>
            <option value="schedule">Q2: Schedule</option>
            <option value="delegate">Q3: Delegate</option>
            <option value="backlog">Q4: Backlog</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="hitl_approval">HITL Approval Required</option>
            <option value="in_progress">In Progress</option>
            <option value="todo">To Do</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Task List Items */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-500 text-xs">
            No tasks match the active filters.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700 transition shadow-sm space-y-3 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getPriorityBadge(task.priority)}
                  {getQuadrantBadge(task.quadrant)}
                  {getStatusBadge(task.status)}
                  <span className="text-[10px] text-slate-500 font-mono">
                    Impact: <strong className="text-white">{task.impactScore}</strong>/10 • Urgency: <strong className="text-white">{task.urgencyScore}</strong>/10
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Due {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {task.assignee.isAgent ? (
                      <span className="flex items-center gap-1 text-[11px] text-purple-300 font-semibold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                        <Bot className="w-3 h-3 text-purple-400" />
                        AI Agent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-300">
                        <User className="w-3 h-3 text-slate-500" />
                        {task.assignee.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div
                onClick={() => onSelectTask(task)}
                className="cursor-pointer space-y-1"
              >
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                  {task.title}
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              </div>

              {/* Subtasks Progress & Tags */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-4 text-xs">
                  {task.subtasks.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-[11px]">Subtasks:</span>
                      <div className="flex items-center gap-1">
                        {task.subtasks.map((st) => (
                          <button
                            key={st.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubtask(task.id, st.id);
                            }}
                            title={st.title}
                            className={`w-4 h-4 rounded text-[10px] flex items-center justify-center border transition ${
                              st.completed
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                            }`}
                          >
                            {st.completed ? '✓' : ''}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded border border-slate-700/60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Agent Action Buttons */}
                <div className="flex items-center gap-2">
                  {task.status === 'hitl_approval' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        approveHitl(task.id, 'Approved via Task List by ' + currentUser.name);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve HITL Gate
                    </button>
                  ) : task.status !== 'completed' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunAgent(task);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Execute Agent
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-mono">Verified in Audit Log</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
