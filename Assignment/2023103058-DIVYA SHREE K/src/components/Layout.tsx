import { ReactNode } from 'react';
import { useNav, Page } from '@/nav';
import { useApp } from '@/context';
import { storage } from '@/storage';
import {
  LayoutDashboard, Bot, FileQuestion, TrendingUp, History,
  Calendar, User as UserIcon, LogOut, GraduationCap, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'quizmate', label: 'QuizMate AI', icon: Bot },
  { page: 'generate', label: 'Generate Quiz', icon: FileQuestion },
  { page: 'progress', label: 'My Progress', icon: TrendingUp },
  { page: 'history', label: 'Quiz History', icon: History },
  { page: 'planner', label: 'Study Planner', icon: Calendar },
  { page: 'profile', label: 'Profile', icon: UserIcon },
];

const PAGE_TITLES: Record<Page, string> = {
  landing: '', auth: '', dashboard: 'Dashboard', quizmate: 'QuizMate AI',
  generate: 'Generate Quiz', takequiz: 'Take Quiz', results: 'Results',
  progress: 'My Progress', history: 'Quiz History', planner: 'Study Planner',
  profile: 'Profile',
};

export function Layout({ children }: { children: ReactNode }) {
  const { page, navigate } = useNav();
  const { user, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (page === 'landing' || page === 'auth') return <>{children}</>;

  const initials = user ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

  const handleNav = (p: Page) => {
    navigate(p);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('landing');
  };

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"><GraduationCap size={22} /></div>
          <div className="sidebar-title">Quiz<span>Mate</span></div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                className={`nav-item ${page === item.page ? 'active' : ''}`}
                onClick={() => handleNav(item.page)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="topbar-title">{PAGE_TITLES[page]}</div>
          </div>
          <div className="topbar-right">
            <div className="avatar" onClick={() => navigate('profile')} style={{ cursor: 'pointer' }}>
              {initials}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
