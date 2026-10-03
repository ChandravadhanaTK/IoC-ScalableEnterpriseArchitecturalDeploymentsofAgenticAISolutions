import React, { useState } from 'react';
import { 
  Users, 
  RotateCcw, 
  Sparkles, 
  ChevronDown, 
  LogOut,
  Bell
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { storage } from '../../services/storage';

interface NavbarProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onNavigateToAssistant: () => void;
  onResetData: () => void;
  onLogout: () => void;
  pageTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  onNavigateToAssistant,
  onResetData,
  onLogout,
  pageTitle
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const users = storage.getUsers();

  const handleSelectRole = (user: User) => {
    storage.setCurrentUser(user);
    onUserChange(user);
    setShowRoleDropdown(false);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'operations_manager':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">{pageTitle}</h1>
        <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Environment: Enterprise MVP
        </span>
      </div>

      {/* Action Controls & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Ask OfficeOps AI CTA */}
        <button
          onClick={onNavigateToAssistant}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
          <span>Ask OfficeOps AI</span>
        </button>

        {/* Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Switch Persona:</span>
            <span className={`px-1.5 py-0.2 rounded border text-[11px] font-semibold uppercase ${getRoleBadgeColor(currentUser.role)}`}>
              {currentUser.role.replace('_', ' ')}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Demo Authentication Personas
              </div>
              <div className="py-1 space-y-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectRole(u)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      u.id === currentUser.id
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.title}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border font-bold uppercase ${getRoleBadgeColor(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Enterprise Mock SSO</span>
                <span className="text-emerald-400 font-mono">Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Reset State Button */}
        <button
          onClick={onResetData}
          title="Reset application state to demo default"
          className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Sign out of demo session"
          className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 hover:bg-rose-950/60 hover:border-rose-800/80 text-slate-400 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
