import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  DoorOpen, 
  ClipboardList, 
  Activity, 
  ShieldCheck,
  Bot
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: User;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  currentUser
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: Sparkles,
      badge: 'Core AI'
    },
    {
      id: 'rooms',
      label: 'Meeting Rooms',
      icon: DoorOpen,
      badge: '4 Rooms'
    },
    {
      id: 'requests',
      label: 'Workplace Requests',
      icon: ClipboardList,
      badge: '5'
    },
    {
      id: 'monitoring',
      label: 'Monitoring & Audit',
      icon: Activity,
      badge: 'Telemetry'
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-bold text-lg">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white tracking-tight text-base">OfficeOps</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Agentic
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono leading-none mt-0.5">Enterprise Operations</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workplace Suite
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-Agent Architecture Status Widget */}
      <div className="p-3 mx-3 mb-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Multi-Agent System
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">4/4 Online</span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-400">
          <div className="flex justify-between py-0.5 border-b border-slate-900/60">
            <span>Requirement Agent</span>
            <span className="text-emerald-400">Ready</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-slate-900/60">
            <span>Resource Agent</span>
            <span className="text-emerald-400">Ready</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-slate-900/60">
            <span>Scheduling Agent</span>
            <span className="text-emerald-400">Ready</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Recommendation Agent</span>
            <span className="text-emerald-400">Ready</span>
          </div>
        </div>
      </div>

      {/* Human in the loop reassurance badge */}
      <div className="px-4 py-2 mx-3 mb-3 bg-indigo-950/30 border border-indigo-900/40 rounded-lg flex items-center gap-2 text-[11px] text-indigo-300">
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>HITL Policy Enforced: Zero auto-reservations</span>
      </div>

      {/* User Persona Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full ring-2 ring-indigo-500/30 object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 truncate capitalize font-mono">
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
