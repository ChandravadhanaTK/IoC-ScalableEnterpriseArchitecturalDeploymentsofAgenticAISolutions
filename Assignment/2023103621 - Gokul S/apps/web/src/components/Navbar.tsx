import React from 'react';
import { Home, Calendar, History, Dumbbell, User, Search, Settings, Plus, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkoutSession } from '../context/WorkoutSessionContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSettings }) => {
  const { user } = useAuth();
  const { isWorkoutActive, elapsedSeconds } = useWorkoutSession();

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'log', label: 'Workout', icon: Plus, isAction: true },
    { id: 'history', label: 'History', icon: History },
    { id: 'progress', label: 'Progress', icon: Dumbbell },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-[#12141c] border-r border-[#262a3a] h-screen fixed left-0 top-0 z-30 p-4 select-none">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#9D00FF] via-purple-600 to-cyan-400 flex items-center justify-center shadow-glow-purple">
              <Dumbbell className="w-5 h-5 text-white font-bold" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-[#9D00FF] via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              PULSE
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{user.streak || 0}</span>
            </div>
          )}
        </div>

        {/* Live Active Workout Bar if present */}
        {isWorkoutActive && (
          <button
            onClick={() => setCurrentTab('log')}
            className="mb-6 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-cyan-400 hover:bg-cyan-500/20 transition group shadow-glow"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="text-sm font-semibold">Active Session</span>
            </div>
            <span className="font-mono text-xs font-bold bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/40">
              {formatTimer(elapsedSeconds)}
            </span>
          </button>
        )}

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab('log')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition shadow-lg my-2 ${
                    isWorkoutActive
                      ? 'bg-gradient-to-r from-[#9D00FF] to-cyan-400 text-white shadow-glow-purple'
                      : 'bg-gradient-to-r from-[#9D00FF] via-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-glow-purple'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>{isWorkoutActive ? 'Resume Workout' : 'Start Workout'}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b26]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-[#262a3a] space-y-1.5">
            <button
              onClick={() => setCurrentTab('search')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                currentTab === 'search'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b26]'
              }`}
            >
              <Search className="w-5 h-5" />
              <span>Search Community</span>
            </button>

            {user && (
              <button
                onClick={() => setCurrentTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                  currentTab === 'profile'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b26]'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
            )}
          </div>
        </nav>

        {/* User Card at bottom */}
        {user && (
          <div className="pt-4 border-t border-[#262a3a] flex items-center justify-between">
            <button
              onClick={() => setCurrentTab('profile')}
              className="flex items-center gap-3 text-left overflow-hidden hover:opacity-80 transition flex-1"
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.display_name}
                className="w-10 h-10 rounded-full border border-slate-700 object-cover bg-slate-800"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-100 truncate">{user.display_name}</p>
                <p className="text-xs text-slate-400 truncate">@{user.username}</p>
              </div>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#181b26] rounded-lg transition"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Top App Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#12141c]/90 backdrop-blur-md border-b border-[#262a3a] sticky top-0 z-30">
        <div className="flex items-center gap-2" onClick={() => setCurrentTab('feed')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-black font-bold" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PULSE
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{user.streak || 0}</span>
            </div>
          )}
          {user && (
            <button
              onClick={() => setCurrentTab('profile')}
              className="w-8 h-8 rounded-full overflow-hidden border border-slate-700"
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#12141c]/95 backdrop-blur-lg border-t border-[#262a3a] flex items-center justify-around py-2 px-1 z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab('log')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
                  isWorkoutActive
                    ? 'bg-cyan-500 text-black shadow-glow animate-pulse'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <Plus className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg text-xs transition ${
                isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
