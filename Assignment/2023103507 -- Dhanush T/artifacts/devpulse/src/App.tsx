import { useEffect, useMemo, useState, createContext, useContext, type ReactNode, type FormEvent, type CSSProperties } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Route, Switch, Link, useLocation, useRoute } from 'wouter';
import {
  Activity, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown,
  CircleAlert, ClipboardList, Clock3, FilePlus2, Filter, Gauge, LifeBuoy, ListFilter, LockKeyhole,
  LogOut, Menu, MessageSquare, Pencil, Plus, Search, Settings2, ShieldCheck,
  Ticket as TicketIcon, Trash2, UserRound, Users, X,
} from 'lucide-react';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  getGetCurrentUserQueryKey, getGetDashboardSummaryQueryKey, getGetFirstAdminBootstrapStatusQueryKey, getGetTicketQueryKey, getListTicketCommentsQueryKey,
  getListTicketHistoryQueryKey, getListTicketsQueryKey, getListUsersQueryKey, setAuthTokenGetter, useAssignTicket,
  useBootstrapFirstAdmin, useChangePassword, useCreateTicket, useCreateTicketComment, useDeleteTicket, useGetCurrentUser,
  useGetFirstAdminBootstrapStatus,
  useGetDashboardSummary, useGetTicket, useListTicketComments, useListTicketHistory, useListTickets,
  useListUsers, useLogin, useRegister, useUpdateProfile, useUpdateTicket, useUpdateTicketStatus,
  useUpdateUserRole,
} from '@workspace/api-client-react';
import type { Ticket, TicketStatus, TicketPriority, User, UserRole, ListTicketsParams, Session } from '@workspace/api-client-react';
import './index.css';

const TOKEN_KEY = 'devpulse_token';
setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

type ToastItem = { id: number; title: string; message: string; kind: 'success' | 'error' };
const ToastContext = createContext<(title: string, message?: string, kind?: ToastItem['kind']) => void>(() => undefined);
function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const notify = (title: string, message = '', kind: ToastItem['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems(current => [...current, { id, title, message, kind }]);
    window.setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 4200);
  };
  return <ToastContext.Provider value={notify}>{children}<div className="toast-stack" aria-live="polite">{items.map(item => <div className={`toast-message ${item.kind === 'error' ? 'error' : ''}`} key={item.id}><strong>{item.title}</strong>{item.message && <span>{item.message}</span>}</div>)}</div></ToastContext.Provider>;
}

function initials(name = '') { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'U'; }
function nice(value?: string | null) { return value ? value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()) : '—'; }
function shortId(id: string) { return `DP-${id.slice(0, 6).toUpperCase()}`; }
function dateLabel(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
function timeLabel(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}
function errorText(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'Something went wrong. Please try again.';
}

function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge status-${status}`} data-testid={`status-${status.toLowerCase()}`}><span className="badge-dot" />{nice(status)}</span>;
}
function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={`badge priority-${priority}`} data-testid={`priority-${priority.toLowerCase()}`}>{nice(priority)}</span>;
}
function TicketCard({ ticket }: { ticket: Ticket }) {
  return <article className="mobile-ticket" data-testid={`card-ticket-${ticket.id}`}>
    <div className="mobile-ticket-top"><span className="ticket-id">{shortId(ticket.id)}</span><StatusBadge status={ticket.status} /></div>
    <Link href={`/tickets/${ticket.id}`} className="ticket-title">{ticket.title}</Link>
    <div className="mobile-ticket-bottom"><span>{ticket.assignee?.name || 'Unassigned'}</span><span>{dateLabel(ticket.updatedAt)}</span><PriorityBadge priority={ticket.priority} /></div>
  </article>;
}
function Table({ children, headings, className = '' }: { children: ReactNode; headings: string[]; className?: string }) {
  return <div className={`table-wrap ${className}`}><table className="data-table"><thead><tr>{headings.map(item => <th key={item}>{item}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
function Modal({ title, description, children, onClose }: { title: string; description: string; children?: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={title}><button type="button" className="btn btn-quiet" style={{ float: 'right', padding: 4 }} onClick={onClose} aria-label="Close"><X size={17} /></button>
      <h2>{title}</h2><p>{description}</p>{children}</section>
  </div>;
}
function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return <div className="card" style={{ padding: 20, display: 'grid', gap: 14 }} aria-label="Loading">
    {Array.from({ length: rows }, (_, index) => <div key={index} className="skeleton" style={{ height: index === 0 ? 24 : 42, width: index === 1 ? '72%' : '100%' }} />)}
  </div>;
}
function ErrorBlock({ error, retry }: { error: unknown; retry: () => void }) {
  return <div className="card error-state"><div className="empty-icon" style={{ color: '#bd3544', background: '#ffeaec' }}><CircleAlert size={20} /></div><h3>We couldn’t load this view</h3><p>{errorText(error)}</p><button className="btn btn-secondary" onClick={retry} data-testid="button-retry">Try again</button></div>;
}
function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function Shell({ children, user }: { children: ReactNode; user: User }) {
  const [path] = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = user.role === 'ADMIN';
  const links = [
    { href: '/dashboard', label: 'Overview', icon: Gauge },
    { href: '/tickets', label: 'All tickets', icon: ClipboardList },
    { href: '/my-tickets', label: 'My tickets', icon: TicketIcon },
  ];
  const account = [{ href: '/profile', label: 'Profile & security', icon: Settings2 }];
  return <div className="app-shell">
    <div className={`mobile-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link href="/dashboard" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><Activity size={17} strokeWidth={2.8} /></span><span>DevPulse</span></Link>
      <div className="side-label">Workspace</div><nav className="nav-list">{links.map(item => {
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} className={`nav-link ${path === item.href || (item.href === '/tickets' && path.startsWith('/tickets/')) ? 'active' : ''}`} onClick={() => setOpen(false)}><Icon size={16} />{item.label}</Link>;
      })}{isAdmin && <Link href="/users" className={`nav-link ${path === '/users' ? 'active' : ''}`} onClick={() => setOpen(false)}><Users size={16} />Team access</Link>}</nav>
      <div className="side-label" style={{ marginTop: 29 }}>Personal</div><nav className="nav-list">{account.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={`nav-link ${path === item.href ? 'active' : ''}`} onClick={() => setOpen(false)}><Icon size={16} />{item.label}</Link>; })}</nav>
      <div className="sidebar-foot"><Link href="/profile" className="user-mini"><span className="avatar">{initials(user.name)}</span><span style={{ minWidth: 0, flex: 1 }}><strong style={{ display: 'block', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</strong><span style={{ color: '#858fa8', fontSize: 10 }}>{nice(user.role)}</span></span><ChevronDown size={14} /></Link>
        <button className="nav-link" style={{ border: 0, width: '100%', background: 'transparent', cursor: 'pointer', marginTop: 7 }} onClick={() => { localStorage.removeItem(TOKEN_KEY); queryClient.clear(); window.location.href = '/login'; }} data-testid="button-logout"><LogOut size={16} />Sign out</button>
      </div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="workspace-note"><span className="live-dot" />Engineering workspace <span style={{ color: '#c5cad4' }}>/</span> Issues</div><div style={{ display: 'flex', alignItems: 'center', gap: 15 }}><span style={{ color: '#929bad', fontSize: 11 }}>{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span><div className="avatar" style={{ width: 30, height: 30 }}>{initials(user.name)}</div></div></header><div className="main-content">{children}</div></main>
  </div>;
}

function Protected({ children }: { children: (user: User) => ReactNode }) {
  const [, navigate] = useLocation();
  const hasToken = Boolean(localStorage.getItem(TOKEN_KEY));
  const current = useGetCurrentUser({ query: { enabled: hasToken, queryKey: getGetCurrentUserQueryKey() } });
  useEffect(() => { if (!hasToken || (current.isError && !current.isLoading)) navigate('/login'); }, [hasToken, current.isError, current.isLoading, navigate]);
  if (!hasToken || current.isLoading || !current.data) return <div className="app-shell" style={{ padding: 32 }}><LoadingBlock rows={3} /></div>;
  return <Shell user={current.data}>{children(current.data)}</Shell>;
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [, navigate] = useLocation();
  const login = useLogin(); const register = useRegister();
  const isRegister = mode === 'register';
  const pending = login.isPending || register.isPending;
  useEffect(() => { if (localStorage.getItem(TOKEN_KEY)) navigate('/dashboard'); }, [navigate]);
  const submit = (event: FormEvent) => {
    event.preventDefault(); setSubmitError('');
    const options = { onSuccess: (session: Session) => { localStorage.setItem(TOKEN_KEY, session.token); queryClient.setQueryData(getGetCurrentUserQueryKey(), session.user); navigate('/dashboard'); }, onError: (error: unknown) => setSubmitError(errorText(error)) };
    if (isRegister) register.mutate({ data: { name, email, password } }, options);
    else login.mutate({ data: { email, password } }, options);
  };
  return <div className="auth-shell"><section className="auth-art"><Link href="/login" className="brand"><span className="brand-mark"><Activity size={17} strokeWidth={2.8} /></span>DevPulse</Link><div className="auth-copy"><div className="overline">Issue management, in rhythm</div><h1>Keep the work<br />moving forward.</h1><p>A clear home for the issues your team is solving — from first report to final resolution.</p><div className="auth-quote">“The best teams don’t lose the thread.<br />They make the next step obvious.”</div></div><div style={{ position: 'relative', zIndex: 1, fontSize: 10, color: '#78839e' }}>DEV PULSE · TEAM WORKSPACE</div></section>
    <section className="auth-panel"><form className="auth-form" onSubmit={submit}><div className="eyebrow">{isRegister ? 'Get started' : 'Welcome back'}</div><h2>{isRegister ? 'Create your account' : 'Sign in to DevPulse'}</h2><p>{isRegister ? 'Set up your reporter account to start tracking issues.' : 'Your team’s open work is right where you left it.'}</p>
      {submitError && <div className="auth-error" role="alert">{submitError}</div>}
      {isRegister && <div className="form-field"><label htmlFor="auth-name">Full name</label><input id="auth-name" className="input" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Your name" data-testid="input-name" /></div>}
      <div className="form-field"><label htmlFor="auth-email">Work email</label><input id="auth-email" type="email" className="input" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" data-testid="input-email" /></div>
      <div className="form-field"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" className="input" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : 1} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" data-testid="input-password" /></div>
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: '100%', marginTop: 5, height: 42 }} data-testid="button-auth-submit">{pending ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}<ArrowRight size={15} /></button>
      <div className="auth-foot">{isRegister ? 'Already have an account?' : 'New to DevPulse?'} <Link className="text-link" href={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></div>
    </form></section></div>;
}

function TicketRows({ tickets }: { tickets: Ticket[] }) {
  return <>
    <Table headings={['Ticket', 'Status', 'Priority', 'Assignee', 'Updated']}>
      {tickets.map(ticket => <tr key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
        <td><div style={{ display: 'grid', gap: 5 }}><Link href={`/tickets/${ticket.id}`} className="ticket-title">{ticket.title}</Link><span className="ticket-id">{shortId(ticket.id)}</span></div></td>
        <td><StatusBadge status={ticket.status} /></td><td><PriorityBadge priority={ticket.priority} /></td>
        <td>{ticket.assignee?.name || <span style={{ color: '#a1a9b6' }}>Unassigned</span>}</td><td>{dateLabel(ticket.updatedAt)}</td>
      </tr>)}
    </Table>
    <div className="ticket-mobile-list">{tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}</div>
  </>;
}

function DashboardPage({ user }: { user: User }) {
  const summary = useGetDashboardSummary();
  const bootstrapStatus = useGetFirstAdminBootstrapStatus({ query: { queryKey: getGetFirstAdminBootstrapStatusQueryKey() } });
  const stats = summary.data;
  const metrics = [
    { label: 'All tickets', value: stats?.total, color: '#4f46e5', icon: ClipboardList, caption: 'Across the workspace' },
    { label: 'Open', value: stats?.open, color: '#3778d2', icon: CircleAlert, caption: 'Waiting to be picked up' },
    { label: 'In progress', value: stats?.inProgress, color: '#c48723', icon: Activity, caption: 'Being actively worked' },
    { label: 'Resolved', value: stats?.resolved, color: '#32936d', icon: CheckCircle2, caption: 'Ready to close out' },
    { label: 'Closed', value: stats?.closed, color: '#7f8999', icon: Check, caption: 'Completed work' },
  ];
  return <><PageTitle eyebrow="Workspace overview" title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user.name.split(' ')[0]}`} description="A quick read on what needs attention today." action={<Link href="/tickets/new" className="btn btn-primary"><Plus size={15} />New ticket</Link>} />
    {user.role === 'REPORTER' && bootstrapStatus.data?.available && <section className="card section-card" style={{ marginBottom: 16, borderColor: '#dcdafc', background: 'linear-gradient(110deg, #fff 0%, #f7f6ff 100%)' }} data-testid="card-first-admin-setup"><div className="section-titlebar" style={{ borderBottom: 0, paddingBottom: 0 }}><div><h2>Finish workspace setup</h2><p>Promote your signed-in account to Admin, then assign a Developer from Team access.</p></div><Link href="/bootstrap-admin" className="btn btn-primary" data-testid="link-first-admin-setup"><ShieldCheck size={14} />Set up Admin</Link></div></section>}
    {summary.isLoading ? <div className="metric-grid">{metrics.map(item => <div className="card metric-card" key={item.label}><div className="skeleton" style={{ height: 13, width: 110 }} /><div className="skeleton" style={{ height: 31, width: 48, marginTop: 18 }} /><div className="skeleton" style={{ height: 10, width: 140, marginTop: 11 }} /></div>)}</div> : summary.isError ? <ErrorBlock error={summary.error} retry={() => summary.refetch()} /> : <div className="metric-grid">{metrics.map(item => { const Icon = item.icon; return <article key={item.label} className="card metric-card" style={{ '--metric-color': item.color } as CSSProperties}><div className="metric-label">{item.label}<span className="metric-icon"><Icon size={15} /></span></div><div className="metric-value" data-testid={`metric-${item.label.toLowerCase().replaceAll(' ', '-')}`}>{item.value ?? '—'}</div><div className="metric-caption">{item.caption}</div></article>; })}</div>}
    {!summary.isError && <section className="card section-card"><div className="section-titlebar"><div><h2>Recently updated</h2><p>The latest movement across your team’s work</p></div><Link href="/tickets" className="btn btn-quiet">View all <ArrowRight size={14} /></Link></div>
      {summary.isLoading ? <LoadingBlock rows={4} /> : (stats?.recentTickets?.length ?? 0) === 0 ? <div className="empty-state"><div className="empty-icon"><FilePlus2 size={20} /></div><h3>A clean slate</h3><p>No tickets have been created yet. Start with the first report.</p><Link href="/tickets/new" className="btn btn-primary"><Plus size={14} />Create a ticket</Link></div> : <TicketRows tickets={stats?.recentTickets ?? []} />}
    </section>}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#919aab', fontSize: 10, marginTop: 17 }}><ShieldCheck size={13} />Signed in as {nice(user.role)}<span style={{ color: '#c7ccd5' }}>·</span><span>Workspace activity updates as changes are made</span></div>
  </>;
}

const bootstrapTokenSchema = z.object({
  token: z.string().min(32, 'Use a token with at least 32 characters.').max(512, 'The token must be 512 characters or fewer.'),
});
type BootstrapTokenForm = z.infer<typeof bootstrapTokenSchema>;

function BootstrapAdminPage({ user }: { user: User }) {
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const toast = useToast();
  const status = useGetFirstAdminBootstrapStatus({ query: { queryKey: getGetFirstAdminBootstrapStatusQueryKey() } });
  const bootstrap = useBootstrapFirstAdmin();
  const form = useForm<BootstrapTokenForm>({
    resolver: zodResolver(bootstrapTokenSchema),
    defaultValues: { token: '' },
  });

  const submit = form.handleSubmit(({ token }) => {
    bootstrap.mutate({ data: { token } }, {
      onSuccess: updatedUser => {
        client.setQueryData(getGetCurrentUserQueryKey(), updatedUser);
        void client.invalidateQueries({ queryKey: getGetFirstAdminBootstrapStatusQueryKey() });
        void client.invalidateQueries({ queryKey: getListUsersQueryKey() });
        form.reset();
        toast('Admin access enabled', 'You can now manage team roles.');
        navigate('/dashboard');
      },
      onError: error => toast('Admin setup failed', errorText(error), 'error'),
    });
  });

  if (status.isLoading) return <><PageTitle eyebrow="Workspace setup" title="Loading setup" /><LoadingBlock rows={3} /></>;
  if (status.isError) return <><PageTitle eyebrow="Workspace setup" title="Admin setup unavailable" /><ErrorBlock error={status.error} retry={() => status.refetch()} /></>;

  return <><PageTitle eyebrow="First-time workspace setup" title="Set up the first Admin" description="This one-time step promotes the signed-in Reporter account. An Admin can then give another member the Developer role." action={<Link href="/dashboard" className="btn btn-secondary"><ArrowLeft size={14} />Back to overview</Link>} />
    {status.data?.available && user.role === 'REPORTER' ? <Form {...form}><form className="card profile-card" onSubmit={submit} style={{ maxWidth: 620 }} data-testid="form-first-admin-setup">
      <h2>Promote this account</h2>
      <p>Confirm that this is the account you chose, then enter the one-time token configured in Replit Secrets.</p>
      <div className="form-field"><label>Signed-in account</label><div className="input" style={{ display: 'flex', alignItems: 'center', background: '#f8f9fc' }} data-testid="text-bootstrap-account">{user.email}</div></div>
      <FormField control={form.control} name="token" render={({ field }) => <FormItem className="form-field">
        <FormLabel>One-time setup token</FormLabel>
        <FormControl><input {...field} className="input" type="password" autoComplete="off" spellCheck={false} placeholder="Paste the token you saved in Replit Secrets" data-testid="input-bootstrap-token" /></FormControl>
        <FormDescription>Use the same value set for DEVPULSE_ADMIN_BOOTSTRAP_TOKEN. It must be at least 32 characters and is not stored in DevPulse.</FormDescription>
        <FormMessage />
      </FormItem>} />
      <button className="btn btn-primary" type="submit" disabled={bootstrap.isPending} data-testid="button-bootstrap-admin"><ShieldCheck size={14} />{bootstrap.isPending ? 'Setting up…' : 'Promote this account to Admin'}</button>
    </form></Form> : <div className="card empty-state" data-testid="status-bootstrap-unavailable"><div className="empty-icon"><LockKeyhole size={19} /></div><h3>First-admin setup isn’t available</h3><p>It requires a Reporter account, no existing Admin, and a configured setup token. Ask the workspace owner to check these settings.</p><Link href="/dashboard" className="btn btn-secondary">Back to overview</Link></div>}
  </>;
}

function TicketsPage({ mine = false }: { mine?: boolean }) {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [priority, setPriority] = useState('');
  const params = useMemo<ListTicketsParams>(() => ({ ...(search.trim() ? { q: search.trim() } : {}), ...(status ? { status: status as TicketStatus } : {}), ...(priority ? { priority: priority as TicketPriority } : {}), ...(mine ? { mine: true } : {}) }), [search, status, priority, mine]);
  const tickets = useListTickets(params, { query: { queryKey: getListTicketsQueryKey(params) } });
  const activeFilters = Boolean(search || status || priority);
  const clear = () => { setSearch(''); setStatus(''); setPriority(''); };
  const title = mine ? 'My tickets' : 'All tickets';
  return <><PageTitle eyebrow={mine ? 'Your work' : 'Issue tracker'} title={title} description={mine ? 'Tickets you reported or are responsible for.' : 'Search and filter every issue in the workspace.'} action={<Link href="/tickets/new" className="btn btn-primary"><Plus size={15} />New ticket</Link>} />
    <section className="card section-card"><div className="section-titlebar"><div><h2>{mine ? 'Your queue' : 'Ticket queue'}</h2><p>{tickets.data?.length ?? 0} {tickets.data?.length === 1 ? 'ticket' : 'tickets'}{activeFilters ? ' matching filters' : ' in view'}</p></div><span style={{ color: '#929bad', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}><ListFilter size={14} />Live filters</span></div>
      <div className="filters"><div className="filter-search"><Search size={15} /><input className="input" placeholder="Search tickets…" value={search} onChange={event => setSearch(event.target.value)} aria-label="Search tickets" data-testid="input-ticket-search" /></div>
        <select className="select" value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status" data-testid="filter-status"><option value="">Any status</option>{(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'] as TicketStatus[]).map(value => <option key={value} value={value}>{nice(value)}</option>)}</select>
        <select className="select" value={priority} onChange={event => setPriority(event.target.value)} aria-label="Filter by priority" data-testid="filter-priority"><option value="">Any priority</option>{(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map(value => <option key={value} value={value}>{nice(value)}</option>)}</select>
        {activeFilters && <button className="btn btn-quiet" onClick={clear}><X size={13} />Clear</button>}
      </div>
      {tickets.isLoading ? <LoadingBlock rows={5} /> : tickets.isError ? <ErrorBlock error={tickets.error} retry={() => tickets.refetch()} /> : tickets.data?.length ? <TicketRows tickets={tickets.data} /> : <div className="empty-state"><div className="empty-icon"><Filter size={19} /></div><h3>{activeFilters ? 'No matching tickets' : mine ? 'Nothing in your queue' : 'No tickets yet'}</h3><p>{activeFilters ? 'Try changing your search or removing a filter.' : mine ? 'Tickets you report or get assigned will appear here.' : 'When your team reports an issue, it will appear here.'}</p>{activeFilters ? <button className="btn btn-secondary" onClick={clear}>Clear filters</button> : <Link className="btn btn-primary" href="/tickets/new"><Plus size={14} />Create a ticket</Link>}</div>}
    </section></>;
}

function NewTicketPage({ user }: { user: User }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const create = useCreateTicket(); const client = useQueryClient(); const toast = useToast(); const [, navigate] = useLocation();
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ data: { title: title.trim(), description: description.trim(), priority } }, { onSuccess: ticket => { void client.invalidateQueries({ queryKey: getListTicketsQueryKey() }); void client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); toast('Ticket created', 'Your issue is now in the team queue.'); navigate(`/tickets/${ticket.id}`); }, onError: error => toast('Could not create ticket', errorText(error), 'error') }); };
  return <><PageTitle eyebrow="Issue tracker / New" title="Report an issue" description="Give your team the context they need to make progress." />
    <div className="form-layout"><form className="card form-card" onSubmit={submit}><div className="form-field"><label htmlFor="ticket-title">Title</label><input id="ticket-title" className="input" value={title} onChange={event => setTitle(event.target.value)} placeholder="A short, specific summary" required minLength={3} maxLength={160} data-testid="input-ticket-title" /><span className="form-hint">3–160 characters. Make the impact clear.</span></div>
      <div className="form-field"><label htmlFor="ticket-description">Description</label><textarea id="ticket-description" className="textarea" value={description} onChange={event => setDescription(event.target.value)} placeholder="What happened? What did you expect? Include steps to reproduce if you can." required minLength={5} maxLength={10000} rows={8} data-testid="input-ticket-description" /><span className="form-hint">Add useful context, expected behavior, and any relevant details.</span></div>
      <div className="form-field" style={{ maxWidth: 260 }}><label htmlFor="ticket-priority">Priority</label><select id="ticket-priority" className="select" style={{ width: '100%' }} value={priority} onChange={event => setPriority(event.target.value as TicketPriority)} data-testid="select-ticket-priority">{(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map(value => <option key={value} value={value}>{nice(value)}</option>)}</select><span className="form-hint">Choose the level that best reflects the impact.</span></div>
      <div style={{ background: '#f7f8fc', borderRadius: 9, padding: 13, color: '#778195', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}><UserRound size={14} />This ticket will be reported by <strong style={{ color: '#465168' }}>{user.name}</strong>.</div>
      <div className="form-actions"><Link className="btn btn-secondary" href="/tickets">Cancel</Link><button className="btn btn-primary" type="submit" disabled={create.isPending} data-testid="button-create-ticket">{create.isPending ? 'Submitting…' : 'Submit ticket'}<ArrowRight size={14} /></button></div>
    </form></div>
  </>;
}

function TicketDetailPage({ user }: { user: User }) {
  const [, params] = useRoute('/tickets/:ticketId'); const ticketId = params?.ticketId ?? '';
  const ticket = useGetTicket(ticketId, { query: { enabled: Boolean(ticketId), queryKey: getGetTicketQueryKey(ticketId) } });
  const comments = useListTicketComments(ticketId, { query: { enabled: Boolean(ticketId), queryKey: getListTicketCommentsQueryKey(ticketId) } });
  const history = useListTicketHistory(ticketId, { query: { enabled: Boolean(ticketId), queryKey: getListTicketHistoryQueryKey(ticketId) } });
  const assignableUsers = useListUsers({ query: { enabled: user.role === 'ADMIN', queryKey: getListUsersQueryKey() } });
  const client = useQueryClient(); const toast = useToast(); const [, navigate] = useLocation();
  const statusMutation = useUpdateTicketStatus(); const assignMutation = useAssignTicket(); const commentMutation = useCreateTicketComment();
  const updateMutation = useUpdateTicket(); const deleteMutation = useDeleteTicket();
  const [comment, setComment] = useState(''); const [editing, setEditing] = useState(false); const [editTitle, setEditTitle] = useState(''); const [editDescription, setEditDescription] = useState(''); const [editPriority, setEditPriority] = useState<TicketPriority>('MEDIUM'); const [confirmDelete, setConfirmDelete] = useState(false);
  const canWork = user.role === 'ADMIN' || user.role === 'DEVELOPER';
  const invalidate = () => { void client.invalidateQueries({ queryKey: getGetTicketQueryKey(ticketId) }); void client.invalidateQueries({ queryKey: getListTicketsQueryKey() }); void client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); void client.invalidateQueries({ queryKey: getListTicketHistoryQueryKey(ticketId) }); };
  const changeStatus = (status: TicketStatus) => statusMutation.mutate({ ticketId, data: { status } }, { onSuccess: () => { invalidate(); toast('Status updated', `Moved to ${nice(status)}.`); }, onError: error => toast('Status change failed', errorText(error), 'error') });
  const submitComment = (event: FormEvent) => { event.preventDefault(); if (!comment.trim()) return; commentMutation.mutate({ ticketId, data: { body: comment.trim() } }, { onSuccess: () => { setComment(''); void client.invalidateQueries({ queryKey: getListTicketCommentsQueryKey(ticketId) }); void client.invalidateQueries({ queryKey: getListTicketHistoryQueryKey(ticketId) }); toast('Comment added'); }, onError: error => toast('Could not add comment', errorText(error), 'error') }); };
  const startEdit = (item: Ticket) => { setEditTitle(item.title); setEditDescription(item.description); setEditPriority(item.priority); setEditing(true); };
  const submitEdit = (event: FormEvent) => { event.preventDefault(); updateMutation.mutate({ ticketId, data: { title: editTitle.trim(), description: editDescription.trim(), priority: editPriority } }, { onSuccess: () => { setEditing(false); invalidate(); toast('Ticket updated', 'Your changes have been saved.'); }, onError: error => toast('Could not update ticket', errorText(error), 'error') }); };
  const doDelete = () => deleteMutation.mutate({ ticketId }, { onSuccess: () => { void client.invalidateQueries({ queryKey: getListTicketsQueryKey() }); void client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); toast('Ticket deleted'); navigate('/tickets'); }, onError: error => toast('Could not delete ticket', errorText(error), 'error') });
  if (ticket.isLoading) return <><PageTitle eyebrow="Ticket details" title="Loading ticket" /><LoadingBlock rows={5} /></>;
  if (ticket.isError || !ticket.data) return <><PageTitle eyebrow="Ticket details" title="Ticket unavailable" /><ErrorBlock error={ticket.error} retry={() => ticket.refetch()} /></>;
  const item = ticket.data;
  const transitions: Partial<Record<TicketStatus, TicketStatus[]>> = { OPEN: ['ASSIGNED'], ASSIGNED: ['IN_PROGRESS', 'OPEN'], IN_PROGRESS: ['RESOLVED', 'ASSIGNED'], RESOLVED: ['CLOSED', 'REOPENED'], CLOSED: ['REOPENED'], REOPENED: ['ASSIGNED', 'IN_PROGRESS'] };
  return <><PageTitle eyebrow={`Ticket ${shortId(item.id)}`} title="Issue details" action={<Link href="/tickets" className="btn btn-secondary"><ArrowLeft size={14} />Back to tickets</Link>} />
    <div className="detail-grid"><div className="detail-main">
      <section className="card detail-card"><div className="metadata-row"><StatusBadge status={item.status} /><PriorityBadge priority={item.priority} /><span><Clock3 size={13} />Updated {dateLabel(item.updatedAt)}</span></div>
        {editing ? <form onSubmit={submitEdit} style={{ marginTop: 19 }}><div className="form-field"><label htmlFor="edit-title">Title</label><input id="edit-title" className="input" value={editTitle} onChange={event => setEditTitle(event.target.value)} required minLength={3} maxLength={160} /></div><div className="form-field"><label htmlFor="edit-description">Description</label><textarea id="edit-description" className="textarea" rows={7} value={editDescription} onChange={event => setEditDescription(event.target.value)} required minLength={5} maxLength={10000} /></div><div className="form-field"><label htmlFor="edit-priority">Priority</label><select id="edit-priority" className="select" value={editPriority} onChange={event => setEditPriority(event.target.value as TicketPriority)}>{(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map(value => <option key={value} value={value}>{nice(value)}</option>)}</select></div><div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving…' : 'Save changes'}</button></div></form> : <>
          <h2 className="detail-title">{item.title}</h2><div className="metadata-row" style={{ marginBottom: 22 }}><span className="ticket-id">{shortId(item.id)}</span><span>·</span><span>Reported by {item.reporter.name}</span><span>·</span><span>{dateLabel(item.createdAt)}</span></div><div className="detail-description">{item.description}</div>
          {(canWork || item.reporter.id === user.id) && <div style={{ borderTop: '1px solid #eff1f5', paddingTop: 15, marginTop: 22, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(canWork || item.reporter.id === user.id) && <button className="btn btn-secondary" onClick={() => startEdit(item)} data-testid="button-edit-ticket"><Pencil size={13} />Edit details</button>}{user.role === 'ADMIN' && <button className="btn btn-danger" onClick={() => setConfirmDelete(true)} data-testid="button-delete-ticket"><Trash2 size={13} />Delete</button>}</div>}
        </>}
      </section>
      <section className="card section-card"><div className="section-titlebar"><div><h2>Conversation</h2><p>Keep the context close to the work</p></div><span style={{ fontSize: 10, color: '#929bad' }}>{comments.data?.length ?? 0} comments</span></div>
        {comments.isLoading ? <LoadingBlock rows={2} /> : comments.isError ? <ErrorBlock error={comments.error} retry={() => comments.refetch()} /> : comments.data?.length ? <div style={{ padding: '0 20px' }}>{comments.data.map(entry => <div className="comment-row" key={entry.id}><span className="avatar">{initials(entry.author.name)}</span><div className="comment-content"><div className="comment-head"><span>{entry.author.name}</span><time>{timeLabel(entry.createdAt)}</time></div><p>{entry.body}</p></div></div>)}</div> : <div style={{ padding: '20px 21px', fontSize: 11, color: '#939cac' }}>No comments yet. Add a note to move the conversation forward.</div>}
        <form onSubmit={submitComment} style={{ padding: '14px 20px 19px', borderTop: '1px solid #eff1f5' }}><textarea className="textarea" rows={3} placeholder="Write a comment…" value={comment} onChange={event => setComment(event.target.value)} maxLength={5000} required data-testid="input-comment" /><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}><span style={{ fontSize: 10, color: '#929bad' }}>Visible to everyone on the ticket</span><button className="btn btn-primary" disabled={commentMutation.isPending || !comment.trim()} data-testid="button-add-comment">{commentMutation.isPending ? 'Posting…' : 'Add comment'}<MessageSquare size={13} /></button></div></form>
      </section>
      <section className="card section-card"><div className="section-titlebar"><div><h2>Activity</h2><p>A record of what changed and when</p></div><Activity size={15} color="#818aa0" /></div>
        {history.isLoading ? <LoadingBlock rows={3} /> : history.isError ? <ErrorBlock error={history.error} retry={() => history.refetch()} /> : history.data?.length ? <div style={{ padding: '5px 21px 14px' }}>{history.data.map(entry => <div className="activity-item" key={entry.id}><span className="activity-mark"><Activity size={12} /></span><div><strong style={{ color: '#475267' }}>{entry.actor.name}</strong> {nice(entry.action).toLowerCase()}{entry.fromValue && <> from <strong>{nice(entry.fromValue)}</strong></>}{entry.toValue && <> to <strong>{nice(entry.toValue)}</strong></>}<div style={{ color: '#9aa2af', marginTop: 4 }}>{timeLabel(entry.createdAt)}</div></div></div>)}</div> : <div style={{ padding: '20px', fontSize: 11, color: '#939cac' }}>No activity recorded yet.</div>}
      </section>
    </div>
    <aside className="detail-aside"><section className="card"><h3>Ticket properties</h3><div className="property"><label>Assignee</label><div>{item.assignee ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="avatar" style={{ width: 27, height: 27, fontSize: 10 }}>{initials(item.assignee.name)}</span>{item.assignee.name}</span> : 'Unassigned'}</div></div><div className="property"><label>Reporter</label><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="avatar" style={{ width: 27, height: 27, fontSize: 10 }}>{initials(item.reporter.name)}</span>{item.reporter.name}</div></div><div className="property"><label>Created</label><div>{dateLabel(item.createdAt)}</div></div><div className="property"><label>Last updated</label><div>{dateLabel(item.updatedAt)}</div></div></section>
      {canWork && <section className="card"><h3>Workflow</h3><div className="property"><label>Move to</label><select className="select" style={{ width: '100%' }} value="" onChange={event => { if (event.target.value) changeStatus(event.target.value as TicketStatus); }} disabled={statusMutation.isPending} data-testid="select-ticket-status"><option value="">Choose a status…</option>{(transitions[item.status] ?? []).map(value => <option key={value} value={value}>{nice(value)}</option>)}</select></div>
        {user.role === 'ADMIN' && <div className="property"><label>Assign to</label><select className="select" style={{ width: '100%' }} value={item.assignee?.id ?? ''} disabled={assignMutation.isPending || assignableUsers.isLoading} onChange={event => assignMutation.mutate({ ticketId, data: { assigneeId: event.target.value || null } }, { onSuccess: () => { invalidate(); toast('Assignment updated'); }, onError: error => toast('Could not update assignment', errorText(error), 'error') })} data-testid="select-ticket-assignee"><option value="">Unassigned</option>{assignableUsers.data?.filter(person => person.role === 'DEVELOPER' || person.role === 'ADMIN').map(person => <option key={person.id} value={person.id}>{person.name} · {nice(person.role)}</option>)}</select></div>}
        {user.role === 'DEVELOPER' && !item.assignee && <button className="btn btn-secondary" style={{ width: '100%', marginTop: 6 }} disabled={assignMutation.isPending} onClick={() => assignMutation.mutate({ ticketId, data: { assigneeId: user.id } }, { onSuccess: () => { invalidate(); toast('Ticket assigned to you'); }, onError: error => toast('Could not assign ticket', errorText(error), 'error') })} data-testid="button-assign-self"><UserRound size={13} />Assign to me</button>}
        {(user.role === 'ADMIN' || user.role === 'DEVELOPER') && item.assignee && item.assignee.id === user.id && <button className="btn btn-secondary" style={{ width: '100%', marginTop: 6 }} disabled={assignMutation.isPending} onClick={() => assignMutation.mutate({ ticketId, data: { assigneeId: null } }, { onSuccess: () => { invalidate(); toast('Assignment removed'); }, onError: error => toast('Could not unassign ticket', errorText(error), 'error') })}><X size={13} />Unassign</button>}
      </section>}
      <section className="card" style={{ background: '#f8f8ff', borderColor: '#e9e8ff' }}><div style={{ display: 'flex', gap: 10, color: '#5d56c7' }}><LifeBuoy size={16} /><div><strong style={{ fontSize: 11 }}>Need to add context?</strong><p style={{ color: '#858ba6', fontSize: 10, lineHeight: 1.6, margin: '6px 0 0' }}>Leave a comment so the right people can pick up the thread.</p></div></div></section>
    </aside></div>
    {confirmDelete && <Modal title="Delete this ticket?" description="This will permanently remove the ticket and its history. This action cannot be undone." onClose={() => setConfirmDelete(false)}><div className="modal-actions"><button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button><button className="btn btn-danger" disabled={deleteMutation.isPending} onClick={doDelete} data-testid="confirm-delete-ticket"><Trash2 size={13} />{deleteMutation.isPending ? 'Deleting…' : 'Delete ticket'}</button></div></Modal>}
  </>;
}

function UsersPage({ user }: { user: User }) {
  const users = useListUsers({ query: { enabled: user.role === 'ADMIN', queryKey: getListUsersQueryKey() } });
  const updateRole = useUpdateUserRole(); const client = useQueryClient(); const toast = useToast();
  if (user.role !== 'ADMIN') return <><PageTitle eyebrow="Workspace / Access" title="Team access" /><div className="card empty-state"><div className="empty-icon"><LockKeyhole size={19} /></div><h3>Admin access required</h3><p>Only workspace administrators can manage team roles.</p></div></>;
  const roles: UserRole[] = ['ADMIN', 'DEVELOPER', 'REPORTER'];
  return <><PageTitle eyebrow="Workspace administration" title="Team access" description="Review accounts and assign the right level of access." />
    <section className="card section-card"><div className="section-titlebar"><div><h2>Workspace members</h2><p>Role changes take effect immediately</p></div><span className="badge status-OPEN"><Users size={11} />{users.data?.length ?? 0} members</span></div>
      {users.isLoading ? <LoadingBlock rows={5} /> : users.isError ? <ErrorBlock error={users.error} retry={() => users.refetch()} /> : users.data?.length ? <Table headings={['Member', 'Email', 'Role', 'Joined']}>{users.data.map(person => <tr key={person.id} data-testid={`row-user-${person.id}`}><td><div className="user-name"><span className="avatar">{initials(person.name)}</span>{person.name}{person.id === user.id && <span style={{ fontSize: 9, color: '#8a93a3', fontWeight: 500 }}>You</span>}</div></td><td>{person.email}</td><td><select className="select role-select" aria-label={`Role for ${person.name}`} value={person.role} disabled={person.id === user.id || updateRole.isPending} onChange={event => updateRole.mutate({ userId: person.id, data: { role: event.target.value as UserRole } }, { onSuccess: () => { void client.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast('Role updated', `${person.name} is now ${nice(event.target.value)}.`); }, onError: error => toast('Could not update role', errorText(error), 'error') })} data-testid={`select-role-${person.id}`}>{roles.map(role => <option value={role} key={role}>{nice(role)}</option>)}</select></td><td>{dateLabel(person.createdAt)}</td></tr>)}</Table> : <div className="empty-state"><div className="empty-icon"><Users size={19} /></div><h3>No members found</h3><p>Workspace users will appear here once they have an account.</p></div>}
    </section><div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14, fontSize: 10, color: '#8b95a5' }}><ShieldCheck size={13} />Role access is managed by workspace administrators.</div>
  </>;
}

function ProfilePage({ user }: { user: User }) {
  const [name, setName] = useState(user.name); const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const updateProfile = useUpdateProfile(); const changePassword = useChangePassword(); const client = useQueryClient(); const toast = useToast();
  useEffect(() => setName(user.name), [user.name]);
  const saveProfile = (event: FormEvent) => { event.preventDefault(); updateProfile.mutate({ data: { name: name.trim() } }, { onSuccess: updated => { client.setQueryData(getGetCurrentUserQueryKey(), updated); toast('Profile updated', 'Your name has been saved.'); }, onError: error => toast('Could not update profile', errorText(error), 'error') }); };
  const savePassword = (event: FormEvent) => { event.preventDefault(); if (newPassword !== confirmPassword) { toast('Passwords do not match', 'Check the new password confirmation.', 'error'); return; } changePassword.mutate({ data: { currentPassword, newPassword } }, { onSuccess: () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); toast('Password changed', 'Your account password has been updated.'); }, onError: error => toast('Could not change password', errorText(error), 'error') }); };
  return <><PageTitle eyebrow="Account settings" title="Profile & security" description="Manage the details attached to your DevPulse account." />
    <div className="profile-columns"><form className="card profile-card" onSubmit={saveProfile}><h2>Your profile</h2><p>These details identify you across the workspace.</p><div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 20px', borderBottom: '1px solid #eff1f5', marginBottom: 20 }}><span className="avatar" style={{ width: 45, height: 45, fontSize: 14 }}>{initials(user.name)}</span><div><strong style={{ display: 'block', fontSize: 12 }}>{user.name}</strong><span style={{ fontSize: 10, color: '#8791a3' }}>{user.email}</span></div></div><div className="form-field"><label htmlFor="profile-name">Full name</label><input id="profile-name" className="input" value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={100} data-testid="input-profile-name" /></div><div className="form-field"><label>Email</label><input className="input" value={user.email} disabled /></div><div className="form-field"><label>Workspace role</label><input className="input" value={nice(user.role)} disabled /></div><button className="btn btn-primary" disabled={updateProfile.isPending} data-testid="button-save-profile">{updateProfile.isPending ? 'Saving…' : 'Save profile'}</button></form>
      <form className="card profile-card" onSubmit={savePassword}><h2>Change password</h2><p>Choose a strong password you do not use elsewhere.</p><div className="form-field"><label htmlFor="current-password">Current password</label><input id="current-password" className="input" type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required data-testid="input-current-password" /></div><div className="form-field"><label htmlFor="new-password">New password</label><input id="new-password" className="input" type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} required minLength={8} maxLength={72} data-testid="input-new-password" /></div><div className="form-field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" className="input" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} data-testid="input-confirm-password" /></div><button className="btn btn-primary" disabled={changePassword.isPending} data-testid="button-change-password">{changePassword.isPending ? 'Updating…' : 'Update password'}<LockKeyhole size={13} /></button></form>
    </div>
  </>;
}

function RootRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate(localStorage.getItem(TOKEN_KEY) ? '/dashboard' : '/login'); }, [navigate]);
  return <div style={{ padding: 32 }}><LoadingBlock rows={2} /></div>;
}
function NotFoundPage() {
  return <div className="auth-shell" style={{ gridTemplateColumns: '1fr' }}><section className="auth-panel"><div className="auth-form" style={{ textAlign: 'center' }}><div className="empty-icon"><Search size={20} /></div><div className="eyebrow">404 / Not found</div><h2>That page isn’t here</h2><p>It may have moved, or the link may be out of date.</p><Link href={localStorage.getItem(TOKEN_KEY) ? '/dashboard' : '/login'} className="btn btn-primary">Back to DevPulse<ArrowRight size={14} /></Link></div></section></div>;
}
function RootRouter() {
  return <Switch>
    <Route path="/">{() => <RootRedirect />}</Route>
    <Route path="/login">{() => <AuthPage mode="login" />}</Route>
    <Route path="/register">{() => <AuthPage mode="register" />}</Route>
    <Route path="/dashboard">{() => <Protected>{user => <DashboardPage user={user} />}</Protected>}</Route>
    <Route path="/bootstrap-admin">{() => <Protected>{user => <BootstrapAdminPage user={user} />}</Protected>}</Route>
    <Route path="/tickets/new">{() => <Protected>{user => <NewTicketPage user={user} />}</Protected>}</Route>
    <Route path="/tickets">{() => <Protected>{() => <TicketsPage />}</Protected>}</Route>
    <Route path="/tickets/:ticketId">{() => <Protected>{user => <TicketDetailPage user={user} />}</Protected>}</Route>
    <Route path="/my-tickets">{() => <Protected>{() => <TicketsPage mine />}</Protected>}</Route>
    <Route path="/users">{() => <Protected>{user => <UsersPage user={user} />}</Protected>}</Route>
    <Route path="/profile">{() => <Protected>{user => <ProfilePage user={user} />}</Protected>}</Route>
    <Route>{() => <NotFoundPage />}</Route>
  </Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><ToastProvider><RootRouter /></ToastProvider></QueryClientProvider>;
}

export default App;