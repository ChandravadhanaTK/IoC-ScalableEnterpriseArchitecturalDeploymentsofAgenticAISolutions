import { useState, useEffect } from 'react';
import { Layers, Loader2, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import { adminApi } from '../services/api';

export default function AdminGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await adminApi.allGoals();
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="All System Goals"
        subtitle="Global audit of all learning tracks created by all students"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Total System Goals ({goals.length})</span>
          </h3>

          <button
            onClick={loadGoals}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-electric-400 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/5 text-white/50 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 font-semibold">Goal Title</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">User ID</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Progress</th>
                  <th className="p-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {goals.map((g) => (
                  <tr key={g.id} className="hover:bg-white/5">
                    <td className="p-4 font-medium text-white">{g.title}</td>
                    <td className="p-4 capitalize text-white/60">{g.category}</td>
                    <td className="p-4 font-mono text-[11px] text-white/40">{g.user_id.slice(0, 8)}…</td>
                    <td className="p-4">
                      <span className={`badge uppercase text-[10px] font-bold ${
                        g.status === 'completed'
                          ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                          : 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{Math.round(g.progress)}%</td>
                    <td className="p-4 font-mono text-white/40">
                      {new Date(g.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
