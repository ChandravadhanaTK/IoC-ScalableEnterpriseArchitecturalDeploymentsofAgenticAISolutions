import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Target, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';
import Header from '../components/Header';
import { adminApi } from '../services/api';

export default function AdminMonitoringPage() {
  const [data, setData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [monRes, auditRes] = await Promise.all([
        adminApi.monitoring(),
        adminApi.auditLogs(),
      ]);
      setData(monRes.data);
      setAuditLogs(auditRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
      </div>
    );
  }

  const overview = data?.overview || {};

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Admin System Monitoring"
        subtitle="Global analytics, student retention, completion velocity, and audit logs"
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Admin Superuser Banner */}
        <div className="card p-5 bg-gradient-to-r from-accent-purple/15 to-transparent border-accent-purple/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Administrator Access Verified</h3>
              <p className="text-xs text-white/50">You have global visibility into system telemetry and student progress.</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Global KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <span className="text-xs text-white/40 block mb-1">Total Registered Users</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{overview.total_users}</span>
              <Users className="w-5 h-5 text-electric-400" />
            </div>
          </div>

          <div className="card p-4">
            <span className="text-xs text-white/40 block mb-1">System Goals</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{overview.total_goals}</span>
              <Target className="w-5 h-5 text-accent-green" />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              {overview.active_goals} active • {overview.completed_goals} completed
            </p>
          </div>

          <div className="card p-4">
            <span className="text-xs text-white/40 block mb-1">Task Completion Rate</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-accent-green">
                {overview.task_completion_rate}%
              </span>
              <CheckCircle2 className="w-5 h-5 text-accent-green" />
            </div>
            <p className="text-[11px] text-white/40 mt-1">
              {overview.completed_tasks}/{overview.total_tasks} tasks
            </p>
          </div>

          <div className="card p-4">
            <span className="text-xs text-white/40 block mb-1">LangGraph Agent Events</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-accent-purple">{overview.total_agent_events}</span>
              <Activity className="w-5 h-5 text-accent-purple" />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent-purple" />
            <span>Security & System Audit Logs</span>
          </h3>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-white/40 py-6 text-center">No audit logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-white/40 border-b border-white/10 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="pb-3 font-semibold">Action</th>
                    <th className="pb-3 font-semibold">Resource</th>
                    <th className="pb-3 font-semibold">User ID</th>
                    <th className="pb-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/70">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="py-2.5 font-medium text-white">{log.action}</td>
                      <td className="py-2.5 text-white/50">{log.resource_type || '-'}</td>
                      <td className="py-2.5 font-mono text-[11px] text-white/40">{log.user_id ? log.user_id.slice(0, 8) + '…' : 'System'}</td>
                      <td className="py-2.5 font-mono text-white/40">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
