import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Lock, Globe, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EditProfileModal } from '../components/EditProfileModal';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-cyan-400" /> Account Settings
        </h1>
        <p className="text-xs text-slate-400">Manage your profile, preferences, and privacy controls</p>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-[#262a3a] space-y-6 shadow-2xl">
        {/* User Card */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
            alt={user.display_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400/50"
          />
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">{user.display_name}</h3>
            <p className="text-xs text-slate-400">@{user.username} • {user.email}</p>
          </div>
        </div>

        {/* Preferences Breakdown */}
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-[#181b26] p-4 rounded-2xl border border-slate-800">
            <div>
              <p className="font-bold text-slate-200">Weight Unit</p>
              <p className="text-slate-400">Currently set to {user.unit_preference.toUpperCase()}</p>
            </div>
            <span className="font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/20">
              {user.unit_preference}
            </span>
          </div>

          <div className="flex justify-between items-center bg-[#181b26] p-4 rounded-2xl border border-slate-800">
            <div>
              <p className="font-bold text-slate-200">Profile Visibility</p>
              <p className="text-slate-400">
                {user.is_private ? 'Private account (Only followers can view workouts)' : 'Public account (Anyone can view shared workouts)'}
              </p>
            </div>
            <span className="font-bold text-slate-300">
              {user.is_private ? 'Private' : 'Public'}
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <button
            onClick={() => setIsEditOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-black font-extrabold text-sm rounded-xl shadow-glow transition"
          >
            Edit Profile & Settings
          </button>

          <button
            onClick={() => logout()}
            className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </div>
  );
};
