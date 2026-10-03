import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  FilePlus,
  Clock,
  CheckSquare,
  Cpu,
  Activity,
  ArrowLeftRight,
  UserX,
  LineChart,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Profile } from '../../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: Profile;
  onLogout: () => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  pendingApprovalsCount,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager' || isAdmin;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assets', label: 'Asset Inventory', icon: Boxes },
    { id: 'request', label: 'Request Asset', icon: FilePlus },
    { id: 'my-requests', label: 'My Requests', icon: Clock },
    ...(isManager
      ? [
          {
            id: 'approvals',
            label: 'Approval Center',
            icon: CheckSquare,
            badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          },
        ]
      : []),
    { id: 'agent-operations', label: 'Agent Operations', icon: Cpu },
    { id: 'lifecycle', label: 'Lifecycle Intelligence', icon: Activity },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
    ...(isAdmin ? [{ id: 'offboarding', label: 'Offboarding', icon: UserX }] : []),
    { id: 'monitoring', label: 'Monitoring', icon: LineChart },
    ...(isAdmin ? [{ id: 'audit', label: 'Audit Log', icon: ShieldCheck }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Administration', icon: Settings }] : []),
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col flex-shrink-0 h-screen select-none border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
            AssetCare<span className="text-blue-400 font-extrabold">HQ</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium tracking-wide">
            IT Asset Operations
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
            </button>
          );
        })}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 mb-2">
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
          </div>
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
              currentUser.role === 'admin'
                ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                : currentUser.role === 'manager'
                ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
            }`}
          >
            {currentUser.role}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
