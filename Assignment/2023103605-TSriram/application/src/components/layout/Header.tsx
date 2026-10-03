import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Profile } from '../../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  currentUser: Profile;
  profiles: Profile[];
  onSwitchUser: (profile: Profile) => void;
  notifications: Array<{ id: string; title: string; time: string; type: 'info' | 'warn' | 'success' }>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  currentUser,
  profiles,
  onSwitchUser,
  notifications,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{title}</h1>
        <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Simulated Agent Engine Active</span>
        </div>

        {/* Role Switcher for quick Demo Testing */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-white text-xs font-semibold text-gray-700 transition-all shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="capitalize">{currentUser.role} View</span>
            <span className="text-gray-400">({currentUser.name})</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Switch Role / Demo Persona
              </div>
              {profiles.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSwitchUser(p);
                    setShowUserDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                    p.id === currentUser.id ? 'bg-blue-50/70 font-semibold text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[11px] text-gray-400">{p.email}</div>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      p.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : p.role === 'manager'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Operational Alerts</span>
                <span className="text-[10px] text-gray-400">{notifications.length} recent</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-gray-50 transition-colors flex items-start gap-2.5">
                    {n.type === 'warn' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-medium text-gray-800">{n.title}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
