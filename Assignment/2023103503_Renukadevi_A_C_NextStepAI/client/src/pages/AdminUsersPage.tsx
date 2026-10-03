import { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, UserX, Loader2, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import { adminApi } from '../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.users();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggle = async (userId: string) => {
    setTogglingId(userId);
    try {
      const res = await adminApi.toggleUser(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: res.data.is_active } : u));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle user status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Student & User Management"
        subtitle="View registered students, roles, and manage account statuses"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Registered Accounts ({users.length})</span>
          </h3>

          <button
            onClick={loadUsers}
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
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Goals</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Joined</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="p-4 font-medium text-white">
                      <div>
                        <span>{u.name}</span>
                        <p className="text-[11px] text-white/40">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge uppercase text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                          : 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{u.goal_count || 0}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        u.is_active ? 'text-accent-green' : 'text-accent-red'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-accent-green' : 'bg-accent-red'}`} />
                        <span>{u.is_active ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>
                    <td className="p-4 font-mono text-white/40">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggle(u.id)}
                        disabled={togglingId === u.id}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          u.is_active
                            ? 'bg-accent-red/10 text-accent-red border-accent-red/20 hover:bg-accent-red/20'
                            : 'bg-accent-green/10 text-accent-green border-accent-green/20 hover:bg-accent-green/20'
                        }`}
                      >
                        {togglingId === u.id ? 'Updating…' : u.is_active ? 'Disable' : 'Enable'}
                      </button>
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
