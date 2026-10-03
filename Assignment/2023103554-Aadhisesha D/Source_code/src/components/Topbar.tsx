import { Bell, Command, Menu, ShieldCheck, Sparkles } from 'lucide-react';
import type { PageKey } from './Sidebar';

export function Topbar({ page, onMobileMenu, jobLabel }: { page: PageKey; onMobileMenu: () => void; jobLabel?: string }) {
  const labels: Record<PageKey, string> = { dashboard:'Overview', analyze:'Placement Run', role:'Role Intelligence', resume:'Resume Intelligence', training:'Role Trainer', planner:'Preparation Sprint', monitor:'Agent Monitor' };
  return <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={onMobileMenu}><Menu size={18} /></button><div><div className="eyebrow">Placement workspace <span className="slash">/</span> {labels[page]}</div><h1>{jobLabel || labels[page]}</h1></div></div><div className="topbar-right"><div className="status-chip"><span className="status-dot" /> Runtime healthy</div><div className="security-chip"><ShieldCheck size={14} /> Key isolated</div><button className="icon-btn" aria-label="Command menu"><Command size={15} /></button><button className="icon-btn" aria-label="Notifications"><Bell size={15} /></button><div className="avatar"><Sparkles size={15} /></div></div></header>;
}
