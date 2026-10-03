import React, { useState } from 'react';
import { CareTask, TaskType } from '../../types';
import { Droplet, Search, Scissors, Sparkles, Check, Trash2, Calendar } from 'lucide-react';
import { formatDate } from '../../services/plantService';

interface TaskItemProps {
  task: CareTask;
  onToggle: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const isCompleted = task.status === 'completed';
  const todayStr = formatDate(new Date());

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'Water':
        return <Droplet className="w-4 h-4 text-blue-500" />;
      case 'Check Soil':
        return <Search className="w-4 h-4 text-earth-500" />;
      case 'Prune':
        return <Scissors className="w-4 h-4 text-emerald-600" />;
      case 'Fertilize':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Droplet className="w-4 h-4 text-forest-600" />;
    }
  };

  const handleToggle = async () => {
    try {
      setLoading(true);
      await onToggle(task.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete(task.id);
    }
  };

  const isOverdue = !isCompleted && task.dueDate < todayStr;
  const isToday = !isCompleted && task.dueDate === todayStr;

  return (
    <div
      onClick={handleToggle}
      className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
        isCompleted
          ? 'bg-slate-50/70 border-slate-200/60 opacity-60'
          : isOverdue
          ? 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/60'
          : isToday
          ? 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50/60'
          : 'bg-white border-slate-200/80 hover:border-forest-200 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Checkbox button */}
        <button
          type="button"
          disabled={loading}
          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
            isCompleted
              ? 'bg-forest-600 border-forest-600 text-white'
              : 'border-slate-300 hover:border-forest-500 bg-white'
          }`}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.plantName}
            </span>
            <span className="text-slate-300">�</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
              {getTaskIcon(task.taskType)}
              <span>{task.taskType}</span>
            </span>
          </div>
          {task.notes && (
            <p className="text-xs text-slate-500 truncate mt-0.5 max-w-md">{task.notes}</p>
          )}
        </div>
      </div>

      {/* Due date tag & Actions */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
            isCompleted
              ? 'bg-slate-100 text-slate-500'
              : isOverdue
              ? 'bg-rose-100/80 text-rose-700 font-semibold'
              : isToday
              ? 'bg-amber-100/80 text-amber-800 font-semibold'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>{isToday ? 'Today' : isOverdue ? `Overdue (${task.dueDate})` : task.dueDate}</span>
        </span>

        {onDelete && (
          <button
            onClick={handleDelete}
            title="Delete task"
            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
