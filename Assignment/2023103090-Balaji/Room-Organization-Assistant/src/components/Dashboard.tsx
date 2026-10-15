import type { CleanupPlan } from '../types';

interface DashboardProps {
  plan: CleanupPlan | null;
  onOpenRoomInput: () => void;
  onViewPlan: () => void;
  onAskAI: () => void;
}

export default function Dashboard({
  plan,
  onOpenRoomInput,
  onViewPlan,
  onAskAI,
}: DashboardProps) {
  const tasks = plan?.tasks ?? [];
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
  const remainingTasks = tasks.length - completedTasks;
  const completionPercentage = tasks.length === 0 ? 0 : (completedTasks / tasks.length) * 100;
  const remainingMinutes = tasks
    .filter((task) => task.status !== 'COMPLETED')
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const nextTask = tasks.find((task) => task.status !== 'COMPLETED') ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Room organization</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Room Organization Assistant</h2>
            <p className="mt-3 max-w-xl text-slate-600">Let's organize your room one task at a time.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onOpenRoomInput} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800">Describe My Room</button>
            <button type="button" onClick={onViewPlan} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">View Cleanup Plan</button>
            <button type="button" onClick={onAskAI} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100">Ask AI</button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Progress</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{Math.round(completionPercentage)}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Completed</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{completedTasks} / {tasks.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Remaining</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{remainingTasks}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Time left</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{remainingMinutes} min</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Next task</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">{nextTask ? nextTask.title : 'No task scheduled yet'}</h3>
          </div>
          {nextTask ? (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              nextTask.priority === 'HIGH'
                ? 'bg-red-100 text-red-700'
                : nextTask.priority === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
            }`}>
              {nextTask.priority}
            </span>
          ) : null}
        </div>

        {nextTask ? (
          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-slate-600">{nextTask.description}</p>
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated time</p>
              <p className="text-lg font-semibold text-slate-900">{nextTask.estimatedMinutes} minutes</p>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-slate-600">Generate a room description to create your plan.</p>
        )}

        <div className="mt-6">
          <button type="button" onClick={onViewPlan} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500">{nextTask ? 'Complete' : 'Open plan'}</button>
        </div>
      </section>
    </div>
  );
}
