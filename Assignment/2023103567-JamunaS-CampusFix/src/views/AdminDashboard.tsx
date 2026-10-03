import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminStats } from '../types';
import {
  ShieldAlert,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Flame,
  BarChart3,
  Layers,
  PieChart,
  Activity,
  RefreshCw,
  Loader2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalIssues: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    critical: 0,
    resolutionRate: 0,
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [priorityCounts, setPriorityCounts] = useState<Record<string, number>>({});
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.issues.getAdminStats();
      setStats(res.stats);
      setCategoryCounts(res.categoryCounts || {});
      setPriorityCounts(res.priorityCounts || {});
      setStatusCounts(res.statusCounts || {});
    } catch (err) {
      console.error('Failed to load admin statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = stats.totalIssues || 1; // avoid divide by zero

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Operations & Facility Analytics
            </h1>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status overview, department workloads, and infrastructure incident distributions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('admin-issues')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <span>Manage All Complaints</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Computing campus incident metrics...</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Issues */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalIssues}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Reported Incidents</span>
            </div>

            {/* Pending */}
            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-900">{stats.pending}</div>
              <span className="text-[10px] text-amber-600/80 mt-0.5 block">Needs Dispatch</span>
            </div>

            {/* Assigned */}
            <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Assigned</span>
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-blue-900">{stats.assigned}</div>
              <span className="text-[10px] text-blue-600/80 mt-0.5 block">Crew Designated</span>
            </div>

            {/* In Progress */}
            <div className="bg-white border border-indigo-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-indigo-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </span>
              </div>
              <div className="text-2xl font-extrabold text-indigo-900">{stats.inProgress}</div>
              <span className="text-[10px] text-indigo-600/80 mt-0.5 block">Physical Repairs</span>
            </div>

            {/* Resolved */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Resolved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-900">{stats.resolved}</div>
              <span className="text-[10px] text-emerald-600/80 mt-0.5 block">
                {stats.resolutionRate}% Success
              </span>
            </div>

            {/* Critical */}
            <div className="bg-white border border-red-300 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-red-700 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Critical</span>
                <Flame className="w-4 h-4 text-red-600 animate-pulse" />
              </div>
              <div className="text-2xl font-extrabold text-red-900">{stats.critical}</div>
              <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">Safety Hazard</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Issues by Category */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Issues by Category</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Campus-wide Distribution</span>
              </div>

              <div className="space-y-3">
                {Object.entries(categoryCounts).map(([cat, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{cat}</span>
                        <span className="text-slate-500 font-semibold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Issues by Priority & Status */}
            <div className="space-y-6">
              {/* Priority Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Priority Severity Matrix</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Urgency breakdown</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center mb-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-xs text-red-700 font-bold block">Critical</span>
                    <span className="text-xl font-extrabold text-red-900">
                      {priorityCounts['Critical'] || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <span className="text-xs text-orange-700 font-bold block">High</span>
                    <span className="text-xl font-extrabold text-orange-900">
                      {priorityCounts['High'] || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-xs text-blue-700 font-bold block">Medium</span>
                    <span className="text-xl font-extrabold text-blue-900">
                      {priorityCounts['Medium'] || 0}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl">
                    <span className="text-xs text-slate-700 font-bold block">Low</span>
                    <span className="text-xl font-extrabold text-slate-900">
                      {priorityCounts['Low'] || 0}
                    </span>
                  </div>
                </div>

                {/* Visual bar distribution */}
                <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden">
                  <div
                    style={{ width: `${((priorityCounts['Critical'] || 0) / total) * 100}%` }}
                    className="bg-red-500 h-full"
                    title={`Critical: ${priorityCounts['Critical'] || 0}`}
                  />
                  <div
                    style={{ width: `${((priorityCounts['High'] || 0) / total) * 100}%` }}
                    className="bg-orange-500 h-full"
                    title={`High: ${priorityCounts['High'] || 0}`}
                  />
                  <div
                    style={{ width: `${((priorityCounts['Medium'] || 0) / total) * 100}%` }}
                    className="bg-blue-500 h-full"
                    title={`Medium: ${priorityCounts['Medium'] || 0}`}
                  />
                  <div
                    style={{ width: `${((priorityCounts['Low'] || 0) / total) * 100}%` }}
                    className="bg-slate-400 h-full"
                    title={`Low: ${priorityCounts['Low'] || 0}`}
                  />
                </div>
              </div>

              {/* Status Breakdown Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Resolution Funnel</h3>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {stats.resolutionRate}% Closed
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Pending Triage</span>
                    <span className="font-bold text-amber-700">{statusCounts['Pending'] || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Assigned to Crew</span>
                    <span className="font-bold text-blue-700">{statusCounts['Assigned'] || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">In Active Repair</span>
                    <span className="font-bold text-indigo-700">{statusCounts['In Progress'] || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Fully Resolved & Tested</span>
                    <span className="font-bold text-emerald-700">{statusCounts['Resolved'] || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
