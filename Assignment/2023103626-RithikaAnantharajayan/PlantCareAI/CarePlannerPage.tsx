import React, { useState } from 'react';
import { usePlants } from '../context/PlantContext';
import { groupTasksByTimeline } from '../services/careTaskService';
import { TaskItem } from '../components/tasks/TaskItem';
import { CareTask, TaskType } from '../types';
import { formatDate } from '../services/plantService';
import { 
  CalendarClock, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar,
  Layers,
  X
} from 'lucide-react';

export const CarePlannerPage: React.FC = () => {
  const { tasks, plants, toggleTaskAction, addTaskAction, deleteTaskAction } = usePlants();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New task form state
  const [plantId, setPlantId] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('Water');
  const [dueDate, setDueDate] = useState(formatDate(new Date()));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const grouped = groupTasksByTimeline(tasks);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantId) return;
    const selectedPlant = plants.find((p) => p.id === plantId);
    if (!selectedPlant) return;

    try {
      setSubmitting(true);
      await addTaskAction({
        plantId,
        plantName: selectedPlant.name,
        taskType,
        dueDate,
        status: 'pending',
        notes: notes.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Care Planner
            </h1>
            <span className="text-xs bg-forest-100 text-forest-800 font-semibold px-2 py-0.5 rounded-full">
              Automated Schedule
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chronological task timeline categorized by immediate and upcoming botanical care requirements.
          </p>
        </div>

        <button
          onClick={() => {
            if (plants.length > 0) setPlantId(plants[0].id);
            setIsAddModalOpen(true);
          }}
          disabled={plants.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold rounded-xl shadow-soft transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* OVERDUE TASKS (If any) */}
      {grouped.overdue.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="uppercase tracking-wider">Overdue Tasks ({grouped.overdue.length})</h2>
          </div>
          <div className="space-y-2.5">
            {grouped.overdue.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskAction}
                onDelete={deleteTaskAction}
              />
            ))}
          </div>
        </section>
      )}

      {/* TODAY */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-slate-900 font-bold text-sm border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2 text-forest-800">
            <Clock className="w-4 h-4 text-forest-600" />
            <h2 className="uppercase tracking-wider">TODAY ({grouped.today.length})</h2>
          </div>
          <span className="text-xs text-slate-400 font-normal">{formatDate(new Date())}</span>
        </div>

        {grouped.today.length > 0 ? (
          <div className="space-y-2.5">
            {grouped.today.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskAction}
                onDelete={deleteTaskAction}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
            No care tasks scheduled for today.
          </div>
        )}
      </section>

      {/* TOMORROW */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-slate-900 font-bold text-sm border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2 text-slate-800">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h2 className="uppercase tracking-wider">TOMORROW ({grouped.tomorrow.length})</h2>
          </div>
        </div>

        {grouped.tomorrow.length > 0 ? (
          <div className="space-y-2.5">
            {grouped.tomorrow.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskAction}
                onDelete={deleteTaskAction}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
            No tasks scheduled for tomorrow.
          </div>
        )}
      </section>

      {/* IN 3 DAYS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-slate-900 font-bold text-sm border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2 text-slate-800">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            <h2 className="uppercase tracking-wider">IN 3 DAYS ({grouped.in3Days.length})</h2>
          </div>
        </div>

        {grouped.in3Days.length > 0 ? (
          <div className="space-y-2.5">
            {grouped.in3Days.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskAction}
                onDelete={deleteTaskAction}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
            No tasks scheduled in the next 3 days.
          </div>
        )}
      </section>

      {/* LATER */}
      {grouped.later.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-slate-900 font-bold text-sm border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2 text-slate-800">
              <Layers className="w-4 h-4 text-slate-500" />
              <h2 className="uppercase tracking-wider">LATER THIS MONTH ({grouped.later.length})</h2>
            </div>
          </div>
          <div className="space-y-2.5">
            {grouped.later.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskAction}
                onDelete={deleteTaskAction}
              />
            ))}
          </div>
        </section>
      )}

      {/* COMPLETED TASKS */}
      {grouped.completed.length > 0 && (
        <section className="space-y-3 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-forest-600" />
            <h2 className="uppercase tracking-wider">COMPLETED TASKS ({grouped.completed.length})</h2>
          </div>
          <div className="space-y-2.5">
            {grouped.completed.slice(0, 10).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskAction}
                onDelete={deleteTaskAction}
              />
            ))}
          </div>
        </section>
      )}

      {/* Add Custom Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Add Custom Care Task</h3>
            <p className="text-xs text-slate-500 mb-4">Create a specialized reminder for your plants</p>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Plant</label>
                <select
                  value={plantId}
                  onChange={(e) => setPlantId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 bg-white"
                  required
                >
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Action Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 bg-white"
                >
                  <option value="Water">Water</option>
                  <option value="Check Soil">Check Soil</option>
                  <option value="Fertilize">Fertilize</option>
                  <option value="Prune">Prune</option>
                  <option value="Repot">Repot</option>
                  <option value="Mist">Mist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Inspect underside of leaves for mites"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Schedule Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
