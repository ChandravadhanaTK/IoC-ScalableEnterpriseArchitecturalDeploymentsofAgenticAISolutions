import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from './services/api';
import type { AnalysisSummary, Ticket, User } from './types';

const STORAGE_KEY = 'campusfix-auth';

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    apiRequest<{ id: number; username: string; role: string; email?: string; full_name?: string }>('/api/auth/me', {}, token)
      .then((profile) => setUser({ ...profile, role: profile.role as User['role'] }))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      });
  }, [token]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const setAuth = (newToken: string, nextUser: User) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <>
      {toast && <Toast message={toast} />}
      <Routes>
        <Route path="/login" element={token && user ? <Navigate to="/dashboard" replace /> : <LoginPage onAuth={setAuth} />} />
        <Route path="/register" element={token && user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route
          path="/"
          element={<ProtectedRoute token={token} user={user}><DashboardShell user={user} token={token} logout={logout} /></ProtectedRoute>}
        />
        <Route path="/dashboard" element={<ProtectedRoute token={token} user={user}><DashboardShell user={user} token={token} logout={logout} /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute token={token} user={user}><ReportIssuePage token={token} user={user} onToast={setToast} /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute token={token} user={user}><TicketsPage token={token} user={user} /></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute token={token} user={user}><TicketDetailPage token={token} user={user} /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute token={token} user={user}><ApprovalsPage token={token} user={user} /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute token={token} user={user}><AnalyticsPage token={token} user={user} /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute token={token} user={user}><TeamsPage token={token} user={user} /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute token={token} user={user}><AuditPage token={token} user={user} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute token={token} user={user}><ProfilePage user={user} token={token} /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function ProtectedRoute({ token, user, children }: { token: string | null; user: User | null; children: ReactNode }) {
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function DashboardShell({ user, token, logout }: { user: User | null; token: string | null; logout: () => void }) {
  const navigate = useNavigate();
  const role = user?.role || 'student';

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar user={user} logout={logout} />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 p-6">
          {role === 'admin' && <AdminDashboard token={token} />}
          {role === 'maintenance' && <MaintenanceDashboard token={token} />}
          {role === 'staff' && <StaffDashboard token={token} />}
          {role === 'student' && <StudentDashboard token={token} />}
        </main>
      </div>
    </div>
  );
}

function Navbar({ user, logout }: { user: User | null; logout: () => void }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">CampusFix AI</div>
            <div className="text-xs text-slate-500">Smart campus maintenance</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">{user?.role || 'user'}</span>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ role }: { role: string }) {
  const items = useMemo(() => {
    if (role === 'admin') return ['Dashboard', 'All Tickets', 'Approvals', 'Maintenance Teams', 'Analytics', 'Audit Logs', 'Profile'];
    if (role === 'maintenance') return ['Dashboard', 'Assigned Tickets', 'Completed Tickets', 'Profile'];
    if (role === 'staff') return ['Dashboard', 'Report Issue', 'My Tickets', 'Profile'];
    return ['Dashboard', 'Report Issue', 'My Tickets', 'Profile'];
  }, [role]);

  const hrefMap: Record<string, string> = {
    Dashboard: '/dashboard',
    'Report Issue': '/report',
    'My Tickets': '/tickets',
    'Assigned Tickets': '/tickets',
    'Completed Tickets': '/tickets',
    'All Tickets': '/tickets',
    'Approvals': '/approvals',
    'Maintenance Teams': '/teams',
    Analytics: '/analytics',
    'Audit Logs': '/audit',
    Profile: '/profile',
  };

  return (
    <aside className="hidden w-72 border-r border-slate-200 bg-slate-900 p-5 text-slate-100 lg:block">
      <nav className="space-y-2">
        {items.map((item) => (
          <Link key={item} to={hrefMap[item]} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            {item}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function StudentDashboard({ token }: { token: string | null }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => {
    if (!token) return;
    apiRequest<Ticket[]>('/api/tickets/my', {}, token).then(setTickets).catch(() => setTickets([]));
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Open tickets" value={tickets.filter((t) => t.status !== 'RESOLVED').length.toString()} icon={<ClipboardList className="h-5 w-5" />} />
        <DashboardCard title="High priority" value={tickets.filter((t) => t.priority === 'High' || t.priority === 'Critical').length.toString()} icon={<AlertCircle className="h-5 w-5" />} />
        <DashboardCard title="Resolved" value={tickets.filter((t) => t.status === 'RESOLVED').length.toString()} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Recent tickets</h2>
          <Link to="/report" className="text-sm font-medium text-indigo-600">Report issue</Link>
        </div>
        <TicketTable tickets={tickets.slice(0, 5)} />
      </div>
    </div>
  );
}

function StaffDashboard({ token }: { token: string | null }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => {
    if (!token) return;
    apiRequest<Ticket[]>('/api/tickets/my', {}, token).then(setTickets).catch(() => setTickets([]));
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Submitted" value={tickets.length.toString()} icon={<FileText className="h-5 w-5" />} />
        <DashboardCard title="Open" value={tickets.filter((t) => t.status !== 'RESOLVED').length.toString()} icon={<Gauge className="h-5 w-5" />} />
        <DashboardCard title="Needs review" value={tickets.filter((t) => t.status === 'WAITING_FOR_APPROVAL').length.toString()} icon={<ShieldCheck className="h-5 w-5" />} />
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <TicketTable tickets={tickets} />
      </div>
    </div>
  );
}

function MaintenanceDashboard({ token }: { token: string | null }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => {
    if (!token) return;
    apiRequest<Ticket[]>('/api/maintenance/tickets', {}, token).then(setTickets).catch(() => setTickets([]));
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard title="Assigned" value={tickets.length.toString()} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="High priority" value={tickets.filter((t) => t.priority === 'High' || t.priority === 'Critical').length.toString()} icon={<AlertCircle className="h-5 w-5" />} />
        <DashboardCard title="In progress" value={tickets.filter((t) => t.status === 'IN_PROGRESS').length.toString()} icon={<Wrench className="h-5 w-5" />} />
        <DashboardCard title="Completed" value={tickets.filter((t) => t.status === 'RESOLVED').length.toString()} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <TicketTable tickets={tickets} />
      </div>
    </div>
  );
}

function AdminDashboard({ token }: { token: string | null }) {
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  useEffect(() => {
    if (!token) return;
    apiRequest<AnalysisSummary>('/api/analytics/summary', {}, token).then(setSummary).catch(() => setSummary(null));
  }, [token]);

  if (!summary) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-6">
        <DashboardCard title="Total Tickets" value={String(summary.total_tickets)} icon={<ClipboardList className="h-5 w-5" />} />
        <DashboardCard title="Open" value={String(summary.open_tickets)} icon={<Gauge className="h-5 w-5" />} />
        <DashboardCard title="High" value={String(summary.high_priority_tickets)} icon={<AlertCircle className="h-5 w-5" />} />
        <DashboardCard title="Critical" value={String(summary.critical_tickets)} icon={<ShieldCheck className="h-5 w-5" />} />
        <DashboardCard title="Resolved" value={String(summary.resolved_tickets)} icon={<CheckCircle2 className="h-5 w-5" />} />
        <DashboardCard title="AI success" value={`${summary.ai_analysis_success_rate}%`} icon={<BarChart3 className="h-5 w-5" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Tickets by category" data={summary.tickets_by_category} />
        <ChartCard title="Tickets by priority" data={summary.tickets_by_priority} />
      </div>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: Array<{ name: string; count: number }> }) {
  const bars = data.length ? data : [{ name: 'N/A', count: 0 }];
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      <div className="space-y-3">
        {bars.map((item) => (
          <div key={`${title}-${item.name}`}>
            <div className="mb-1 flex justify-between text-sm text-slate-600">
              <span>{item.name}</span>
              <span>{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (item.count || 0) * 20)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between text-slate-500">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-indigo-600">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function TicketTable({ tickets }: { tickets: Ticket[] }) {
  if (!tickets.length) return <EmptyState message="No tickets available yet." />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead>
          <tr className="text-sm text-slate-500">
            <th className="py-3 pr-4">Title</th>
            <th className="py-3 pr-4">Category</th>
            <th className="py-3 pr-4">Priority</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-slate-50">
              <td className="py-3 pr-4">
                <Link to={`/tickets/${ticket.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">{ticket.title}</Link>
              </td>
              <td className="py-3 pr-4">{ticket.category || 'Other'}</td>
              <td className="py-3 pr-4"><PriorityBadge value={ticket.priority || 'Medium'} /></td>
              <td className="py-3 pr-4"><StatusBadge value={ticket.status || 'OPEN'} /></td>
              <td className="py-3 pr-4">{ticket.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    OPEN: 'bg-slate-100 text-slate-700',
    ASSIGNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    WAITING_FOR_APPROVAL: 'bg-amber-100 text-amber-700',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${map[value] ?? 'bg-slate-100 text-slate-700'}`}>{value}</span>;
}

function PriorityBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${map[value] ?? 'bg-slate-100 text-slate-700'}`}>{value}</span>;
}

function ReportIssuePage({ token, user, onToast }: { token: string | null; user: User | null; onToast: (message: string) => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    building: '',
    room_number: '',
    image_url: '',
    contact_info: user?.email || '',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<any>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(form),
      }, token);
      setResult(response);
      onToast('Ticket submitted successfully');
    } catch (error: any) {
      onToast(error.message || 'Unable to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Report issue</h1>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Issue title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
            <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Room number" value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
            <input className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Optional image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <textarea className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" rows={5} placeholder="Issue description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
            <input className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Contact info" value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} />
            <button type="submit" className="md:col-span-2 rounded-xl bg-indigo-600 px-4 py-3 text-white font-medium hover:bg-indigo-500" disabled={loading}>{loading ? 'Submitting...' : 'Submit issue'}</button>
          </form>
        </div>

        {result && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">AI analysis</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-indigo-50 p-4"><div className="text-sm text-indigo-700">Category</div><div className="text-lg font-bold text-slate-900">{result.category}</div></div>
              <div className="rounded-xl bg-indigo-50 p-4"><div className="text-sm text-indigo-700">Priority</div><div className="text-lg font-bold text-slate-900">{result.priority}</div></div>
              <div className="rounded-xl bg-indigo-50 p-4"><div className="text-sm text-indigo-700">Assigned team</div><div className="text-lg font-bold text-slate-900">{result.assigned_team_id || 'Pending'}</div></div>
              <div className="rounded-xl bg-indigo-50 p-4"><div className="text-sm text-indigo-700">Confidence</div><div className="text-lg font-bold text-slate-900">{result.confidence}</div></div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <div className="font-semibold text-slate-800">AI reasoning</div>
              <p className="mt-2 text-sm text-slate-600">{result.ai_reasoning || 'No reasoning available.'}</p>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <div className="font-semibold text-slate-800">Suggested resolution</div>
              <p className="mt-2 text-sm text-slate-600">{result.suggested_resolution || 'Review later.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketsPage({ token, user }: { token: string | null; user: User | null }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => {
    if (!token) return;
    const endpoint = user?.role === 'admin' ? '/api/admin/tickets' : user?.role === 'maintenance' ? '/api/maintenance/tickets' : '/api/tickets/my';
    apiRequest<Ticket[]>(endpoint, {}, token).then(setTickets).catch(() => setTickets([]));
  }, [token, user]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          {user?.role !== 'maintenance' && <Link to="/report" className="rounded-xl bg-indigo-600 px-4 py-2 text-white">New report</Link>}
        </div>
        <TicketTable tickets={tickets} />
      </div>
    </div>
  );
}

function TicketDetailPage({ token, user }: { token: string | null; user: User | null }) {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  useEffect(() => {
    if (!token || !id) return;
    apiRequest<Ticket>(`/api/tickets/${id}`, {}, token).then(setTicket).catch(() => setTicket(null));
  }, [token, id]);

  if (!ticket) return <LoadingState />;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm uppercase tracking-wide text-indigo-600">Ticket #{ticket.id}</div>
              <h1 className="text-2xl font-bold text-slate-900">{ticket.title}</h1>
            </div>
            <div className="flex gap-2">
              <PriorityBadge value={ticket.priority || 'Medium'} />
              <StatusBadge value={ticket.status || 'OPEN'} />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-800">Description:</span> {ticket.description}</div>
              <div><span className="font-semibold text-slate-800">Location:</span> {ticket.location}</div>
              <div><span className="font-semibold text-slate-800">Building:</span> {ticket.building}</div>
              <div><span className="font-semibold text-slate-800">Room:</span> {ticket.room_number}</div>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-800">Category:</span> {ticket.category}</div>
              <div><span className="font-semibold text-slate-800">Assigned team:</span> {ticket.assigned_team_id ?? 'Unassigned'}</div>
              <div><span className="font-semibold text-slate-800">Status:</span> {ticket.status}</div>
              <div><span className="font-semibold text-slate-800">Confidence:</span> {ticket.confidence}</div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <AIAnalysisCard title="AI reasoning" content={ticket.ai_reasoning || 'Not available'} />
            <AIAnalysisCard title="Suggested resolution" content={ticket.suggested_resolution || 'Not available'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAnalysisCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="font-semibold text-slate-800">{title}</div>
      <p className="mt-2 text-sm text-slate-600">{content}</p>
    </div>
  );
}

function ApprovalsPage({ token, user }: { token: string | null; user: User | null }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  useEffect(() => {
    if (!token) return;
    apiRequest<Ticket[]>('/api/admin/approvals', {}, token).then(setTickets).catch(() => setTickets([]));
  }, [token]);

  const approve = async (id: number) => {
    if (!token) return;
    await apiRequest(`/api/admin/tickets/${id}/approve`, { method: 'POST' }, token);
    setTickets((prev) => prev.filter((item) => item.id !== id));
  };

  const reject = async (id: number) => {
    if (!token) return;
    await apiRequest(`/api/admin/tickets/${id}/reject`, { method: 'POST' }, token);
    setTickets((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Admin approvals</h1>
        {tickets.length === 0 ? <EmptyState message="No approvals pending." /> : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{ticket.title}</div>
                    <div className="text-sm text-slate-500">{ticket.category} • {ticket.priority}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approve(ticket.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Approve</button>
                    <button onClick={() => reject(ticket.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsPage({ token, user }: { token: string | null; user: User | null }) {
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  useEffect(() => {
    if (!token) return;
    apiRequest<AnalysisSummary>('/api/analytics/summary', {}, token).then(setSummary).catch(() => setSummary(null));
  }, [token]);

  if (!summary) return <LoadingState />;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <DashboardCard title="Total tickets" value={String(summary.total_tickets)} icon={<ClipboardList className="h-5 w-5" />} />
          <DashboardCard title="Open" value={String(summary.open_tickets)} icon={<Gauge className="h-5 w-5" />} />
          <DashboardCard title="High priority" value={String(summary.high_priority_tickets)} icon={<AlertCircle className="h-5 w-5" />} />
          <DashboardCard title="AI success" value={`${summary.ai_analysis_success_rate}%`} icon={<BarChart3 className="h-5 w-5" />} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="Tickets by category" data={summary.tickets_by_category} />
          <ChartCard title="Tickets by priority" data={summary.tickets_by_priority} />
        </div>
      </div>
    </div>
  );
}

function TeamsPage({ token, user }: { token: string | null; user: User | null }) {
  const [teams, setTeams] = useState<any[]>([]);
  useEffect(() => {
    if (!token) return;
    apiRequest<any[]>('/api/admin/teams', {}, token).then(setTeams).catch(() => setTeams([]));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Maintenance teams</h1>
        {teams.length === 0 ? <EmptyState message="No maintenance teams available." /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <div key={team.id} className="rounded-xl border border-slate-200 p-4">
                <div className="font-semibold text-slate-800">{team.name}</div>
                <div className="mt-1 text-sm text-slate-500">{team.category}</div>
                <div className="mt-2 text-sm text-slate-600">{team.description || 'General maintenance support.'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuditPage({ token, user }: { token: string | null; user: User | null }) {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Audit log</h1>
        <EmptyState message="Audit log is available for admins and security review." />
      </div>
    </div>
  );
}

function ProfilePage({ user, token }: { user: User | null; token: string | null }) {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <div className="mt-6 space-y-3 text-sm text-slate-700">
          <div><span className="font-semibold text-slate-800">Username:</span> {user?.username}</div>
          <div><span className="font-semibold text-slate-800">Email:</span> {user?.email || 'Not provided'}</div>
          <div><span className="font-semibold text-slate-800">Role:</span> {user?.role}</div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onAuth }: { onAuth: (token: string, user: User) => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = await apiRequest<{ access_token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onAuth(payload.access_token, payload.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">CampusFix AI</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage campus maintenance.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-500" type="submit">Login</button>
          <div className="text-center text-sm text-slate-500">
            Need an account? <Link to="/register" className="text-indigo-600">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'student' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMessage('Registration successful. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="maintenance">Maintenance</option>
            <option value="admin">Admin</option>
          </select>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-emerald-600">{message}</div>}
          <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-500" type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">Loading...</div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed right-6 top-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}

export default App;
