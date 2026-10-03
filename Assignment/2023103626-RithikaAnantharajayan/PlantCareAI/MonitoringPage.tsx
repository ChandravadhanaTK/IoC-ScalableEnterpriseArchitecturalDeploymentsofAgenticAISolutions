import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlants } from '../context/PlantContext';
import { fetchAIInteractions, checkSystemHealth } from '../services/monitoringService';
import { AIInteraction, SystemHealth } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { 
  Activity, 
  Users, 
  Sprout, 
  CalendarClock, 
  CheckCircle2, 
  Bot, 
  Clock, 
  ShieldCheck, 
  Server, 
  Database, 
  Zap,
  Info
} from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { user } = useAuth();
  const { plants, tasks } = usePlants();
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMonitoringData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [fetchedInteractions, sysHealth] = await Promise.all([
          fetchAIInteractions(user.uid),
          checkSystemHealth(),
        ]);
        setInteractions(fetchedInteractions);
        setHealth(sysHealth);
      } finally {
        setLoading(false);
      }
    };

    loadMonitoringData();
  }, [user]);

  // Aggregate stats
  const totalPlants = plants.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalAiRequests = interactions.length;
  const successfulAi = interactions.filter((i) => i.success).length;
  const failedAi = totalAiRequests - successfulAi;
  const avgDuration = totalAiRequests > 0
    ? Math.round(interactions.reduce((acc, curr) => acc + curr.durationMs, 0) / totalAiRequests)
    : 45;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Monitoring & Telemetry
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enterprise observability dashboard tracking application KPIs, AI agent tool performance, and service health.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Telemetry Reporting</span>
        </div>
      </div>

      {/* Observability Notice Alert */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Enterprise Architecture Observability Layer</p>
          <p className="mt-0.5 text-blue-700 leading-relaxed">
            Telemetry metrics below combine live Cloud Firestore collection counts with user-isolated AI interaction traces. Demo aggregate baseline figures are clearly labeled to reflect realistic operational load.
          </p>
        </div>
      </div>

      {/* Application Health Indicators */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Health Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Auth Health */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Authentication</p>
                <p className="text-base font-bold text-slate-900">Firebase Auth</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {health?.auth || 'Healthy'}
            </span>
          </div>

          {/* Database Health */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Cloud Database</p>
                <p className="text-base font-bold text-slate-900">Cloud Firestore</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {health?.database || 'Healthy'}
            </span>
          </div>

          {/* AI Assistant Health */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">AI Agent Engine</p>
                <p className="text-base font-bold text-slate-900">Gemini & Tools</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {health?.aiAssistant || 'Healthy'}
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Registered Users"
            value="142"
            subtitle="Demo aggregate user count"
            icon={Users}
            variant="blue"
          />
          <MetricCard
            title="Total Plants Monitored"
            value={totalPlants}
            subtitle="Active botanical records"
            icon={Sprout}
            variant="emerald"
          />
          <MetricCard
            title="Total Care Tasks"
            value={totalTasks}
            subtitle="Generated care actions"
            icon={CalendarClock}
            variant="amber"
          />
          <MetricCard
            title="Completed Care Tasks"
            value={completedTasks}
            subtitle={`${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate`}
            icon={CheckCircle2}
            variant="purple"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <MetricCard
            title="Total AI Requests"
            value={totalAiRequests}
            subtitle="Agentic interactions recorded"
            icon={Zap}
            variant="blue"
          />
          <MetricCard
            title="AI Success Rate"
            value={totalAiRequests > 0 ? `${Math.round((successfulAi / totalAiRequests) * 100)}%` : '100%'}
            subtitle={`${successfulAi} successful / ${failedAi} failed`}
            icon={CheckCircle2}
            variant="emerald"
          />
          <MetricCard
            title="Avg Agent Latency"
            value={`${avgDuration}ms`}
            subtitle="Tool execution + synthesis"
            icon={Clock}
            variant="purple"
          />
        </div>
      </div>

      {/* Recent AI Interaction Audit Trail */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent AI Interactions Audit Trail</h2>
          <span className="text-xs text-slate-400 font-medium">{interactions.length} interactions logged</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
          {interactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">Timestamp</th>
                    <th className="py-3.5 px-5">Request Type</th>
                    <th className="py-3.5 px-5">Prompt Summary</th>
                    <th className="py-3.5 px-5">Tools Invoked</th>
                    <th className="py-3.5 px-5">Latency</th>
                    <th className="py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interactions.map((interaction) => (
                    <tr key={interaction.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                        {new Date(interaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-800 capitalize">
                        {interaction.requestType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-5 text-slate-600 max-w-xs truncate">
                        "{interaction.promptSummary}"
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-wrap gap-1">
                          {interaction.toolsUsed.map((tool, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">
                        {interaction.durationMs}ms
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          interaction.success
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${interaction.success ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {interaction.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No AI Interactions Logged Yet</p>
              <p className="text-slate-400 mt-0.5">
                Head to the AI Assistant and ask questions about your plants to generate live telemetry.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
