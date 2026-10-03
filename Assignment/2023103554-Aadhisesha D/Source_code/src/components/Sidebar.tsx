import { Activity, ArrowUpRight, BrainCircuit, ChartNoAxesCombined, FileText, LayoutDashboard, ListChecks, PlaySquare, Radar, Settings2, Sparkles } from 'lucide-react';

export type PageKey = 'dashboard' | 'analyze' | 'role' | 'resume' | 'training' | 'planner' | 'monitor';

const items: Array<{ key: PageKey; label: string; desc: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'Overview', desc: 'Placement command center', icon: LayoutDashboard },
  { key: 'analyze', label: 'Placement Run', desc: 'Start agent workflow', icon: BrainCircuit },
  { key: 'role', label: 'Role Intelligence', desc: 'Decode the opportunity', icon: Radar },
  { key: 'resume', label: 'Resume Intel', desc: 'Candidate evidence', icon: FileText },
  { key: 'training', label: 'Role Trainer', desc: 'Practice for this job', icon: PlaySquare },
  { key: 'planner', label: 'Prep Sprint', desc: 'Seven-day plan', icon: ListChecks },
  { key: 'monitor', label: 'Agent Monitor', desc: 'Trace & observability', icon: Activity },
];

export function Sidebar({ page, onNavigate }: { page: PageKey; onNavigate: (page: PageKey) => void }) {
  return <aside className="sidebar">
    <div className="brand-block">
      <img className="sidebar-logo" src="/placementpilot-logo-cropped.png" alt="" />
      <div><div className="brand-name">PlacementPilot</div><div className="brand-sub">AGENTIC CAREER OS</div></div>
    </div>
    <div className="nav-section-title">Workspace</div>
    <nav className="nav-list">{items.map(({ key, label, desc, icon: Icon }) => <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => onNavigate(key)}><span className="nav-icon"><Icon size={18} /></span><span className="nav-copy"><b>{label}</b><small>{desc}</small></span>{page === key && <span className="nav-active-dot" />}</button>)}</nav>
    <div className="sidebar-bottom">
      <div className="signal-card"><div className="signal-icon"><ChartNoAxesCombined size={16} /></div><div><b>Session intelligence</b><span>Local, private, stateless</span></div><ArrowUpRight size={14} /></div>
      <div className="sidebar-meta"><span><Sparkles size={13} /> Gemini ready</span><button className="settings-btn" aria-label="Settings"><Settings2 size={15} /></button></div>
    </div>
  </aside>;
}
