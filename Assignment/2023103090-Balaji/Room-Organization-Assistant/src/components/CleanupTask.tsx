import type { CleanupTask as CleanupTaskType, TaskStatus } from '../types';

interface CleanupTaskProps {
  task: CleanupTaskType;
  onUpdateStatus: (taskId: string, nextStatus: TaskStatus) => void;
}

export default function CleanupTask({ task, onUpdateStatus }: CleanupTaskProps) {
  const priorityClasses = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-emerald-100 text-emerald-700',
  };

  const statusClasses = {
    NOT_STARTED: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-sky-100 text-sky-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{task.title}</h3>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
        <div className="rounded-xl bg-slate-100 px-3 py-2">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Estimated</span>
          <span className="mt-1 block font-medium text-slate-800">{task.estimatedMinutes} minutes</span>
        </div>
        <div className="rounded-xl bg-slate-100 px-3 py-2">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Status</span>
          <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses[task.status]}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onUpdateStatus(task.id, task.status === 'NOT_STARTED' ? 'IN_PROGRESS' : 'NOT_STARTED')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {task.status === 'IN_PROGRESS' ? 'Mark pending' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => onUpdateStatus(task.id, task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED')}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          {task.status === 'COMPLETED' ? 'Reopen' : 'Complete'}
        </button>
      </div>
    </article>
  );
}
