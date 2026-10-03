import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlants } from '../context/PlantContext';
import { MetricCard } from '../components/common/MetricCard';
import { PlantCard } from '../components/plants/PlantCard';
import { PlantFormModal } from '../components/plants/PlantFormModal';
import { TaskItem } from '../components/tasks/TaskItem';
import { formatDate } from '../services/plantService';
import { 
  Sprout, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  ArrowRight,
  Bot,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    plants, 
    tasks, 
    loading, 
    waterPlantAction, 
    toggleTaskAction, 
    addPlant, 
    loadDemoDataAction 
  } = usePlants();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const todayStr = formatDate(new Date());

  // Metrics computation
  const totalPlants = plants.length;
  const needingAttention = plants.filter(p => p.status === 'Care Due' || p.status === 'Overdue').length;
  const tasksDueToday = tasks.filter(t => t.status === 'pending' && t.dueDate <= todayStr).length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  // Today's Care tasks
  const todayCareTasks = tasks.filter(t => t.dueDate <= todayStr || (t.status === 'completed' && t.completedAt?.startsWith(todayStr)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-forest-800 via-forest-700 to-forest-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-forest-600/30 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider bg-forest-600/60 px-2.5 py-1 rounded-full text-forest-100 border border-forest-500/40">
                Active Botanical Workspace
              </span>
              {user?.isDemoUser && (
                <span className="text-xs font-semibold bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full">
                  Capstone Demo Mode
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.displayName || 'Plant Parent'} ??
            </h1>
            <p className="text-sm text-forest-100 max-w-xl leading-relaxed">
              {needingAttention > 0
                ? `You have ${needingAttention} plant${needingAttention > 1 ? 's' : ''} requiring hydration or soil assessment today.`
                : 'All your plants are currently healthy and thriving on schedule!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-forest-800 hover:bg-forest-50 font-semibold rounded-xl text-xs shadow-soft transition-all"
            >
              <Plus className="w-4 h-4 text-forest-600" />
              <span>Add New Plant</span>
            </button>

            <button
              onClick={() => navigate('/assistant')}
              className="flex items-center gap-2 px-4 py-2.5 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-xl text-xs shadow-soft transition-all border border-forest-400/40"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Plants"
          value={totalPlants}
          subtitle="Monitored in system"
          icon={Sprout}
          variant="emerald"
        />
        <MetricCard
          title="Plants Needing Attention"
          value={needingAttention}
          subtitle={needingAttention > 0 ? "Action required" : "All optimal"}
          icon={AlertTriangle}
          variant={needingAttention > 0 ? "amber" : "emerald"}
        />
        <MetricCard
          title="Tasks Due Today"
          value={tasksDueToday}
          subtitle="Care tasks pending"
          icon={Calendar}
          variant={tasksDueToday > 0 ? "blue" : "emerald"}
        />
        <MetricCard
          title="Completed Tasks"
          value={completedTasks}
          subtitle="Successfully logged"
          icon={CheckCircle2}
          variant="purple"
        />
      </div>

      {/* Today's Care Section */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center font-bold">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Today's Care</h2>
              <p className="text-xs text-slate-500">Proactive actions scheduled for {todayStr}</p>
            </div>
          </div>
          <Link
            to="/planner"
            className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1"
          >
            <span>Full Care Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayCareTasks.length > 0 ? (
          <div className="space-y-2.5">
            {todayCareTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTaskAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-forest-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No Pending Care Tasks Due Today</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Your collection is properly hydrated. Check upcoming tasks in the planner or ask the AI assistant to synthesize a new care plan.
            </p>
          </div>
        )}
      </section>

      {/* My Plants Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Plants</h2>
            <p className="text-xs text-slate-500">Overview of your botanical collection and next care dates</p>
          </div>

          <div className="flex items-center gap-2">
            {plants.length === 0 && (
              <button
                onClick={loadDemoDataAction}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 rounded-xl border border-forest-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Plants</span>
              </button>
            )}
            <Link
              to="/plants"
              className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1"
            >
              <span>Manage Plants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
            ))}
          </div>
        ) : plants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onWater={waterPlantAction}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-soft max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-600 flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Plants Added Yet</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Add your first plant to begin automated watering scheduling and agentic care assistance, or load sample plants with 1 click.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-soft"
              >
                Add Your Plant
              </button>
              <button
                onClick={loadDemoDataAction}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 border border-forest-200 rounded-xl"
              >
                Load Sample Plants (Money Plant, etc.)
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Add Plant Modal */}
      <PlantFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (data) => {
          await addPlant(data);
        }}
      />
    </div>
  );
};
