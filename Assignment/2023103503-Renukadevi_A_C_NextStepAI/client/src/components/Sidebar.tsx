import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Target, 
  PlusCircle, 
  Activity, 
  ShieldAlert, 
  Users, 
  BarChart3, 
  LogOut, 
  Brain,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-navy-800/80 border-r border-white/10 flex flex-col h-screen sticky top-0 backdrop-blur-md select-none z-30">
      {/* Brand */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-electric-500/20 border border-electric-500/30 flex items-center justify-center text-electric-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg">NextStep</h1>
            <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Agentic Assistant</p>
          </div>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-4 py-2 mx-4 my-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-accent-purple shadow-[0_0_8px_#8b5cf6]' : 'bg-accent-green shadow-[0_0_8px_#10b981]'}`} />
          <span className="text-xs font-semibold text-white/90 capitalize">{user?.role} Portal</span>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isAdmin ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' : 'bg-accent-green/20 text-accent-green border border-accent-green/30'}`}>
          {isAdmin ? 'ADMIN' : 'STUDENT'}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-white/40 tracking-wider uppercase">
            Student Guidance
          </div>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Compass className="w-4 h-4 text-electric-400" />
              <span>Next Action (Focus)</span>
            </NavLink>

            <NavLink
              to="/goals"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Target className="w-4 h-4 text-accent-green" />
              <span>My Goals & Plans</span>
            </NavLink>

            <NavLink
              to="/create-goal"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <PlusCircle className="w-4 h-4 text-accent-amber" />
              <span>New Goal (AI Plan)</span>
            </NavLink>

            <NavLink
              to="/activity"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Activity className="w-4 h-4 text-electric-300" />
              <span>Agent Activity Stream</span>
            </NavLink>

            <NavLink
              to="/deliverables"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Capstone Deliverables</span>
            </NavLink>
          </nav>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-accent-purple tracking-wider uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Administration</span>
            </div>
            <nav className="space-y-1">
              <NavLink
                to="/admin/monitoring"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <BarChart3 className="w-4 h-4 text-accent-purple" />
                <span>System Monitoring</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Student Management</span>
              </NavLink>

              <NavLink
                to="/admin/goals"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>All Goals Audit</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-white/10 bg-navy-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-electric-500 to-accent-purple flex items-center justify-center font-bold text-white text-xs shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-white/40 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
