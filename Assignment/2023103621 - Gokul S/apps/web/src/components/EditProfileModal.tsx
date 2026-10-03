import React, { useState } from 'react';
import { X, User, Lock, Globe, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/client';
import { UnitPreference } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { user, updateUser } = useAuth();
  if (!user) return null;

  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [unitPref, setUnitPref] = useState<UnitPreference>(user.unit_preference || 'kg');
  const [isPrivate, setIsPrivate] = useState<boolean>(user.is_private || false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersApi.updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        unit_preference: unitPref,
        is_private: isPrivate
      });
      updateUser(res.user);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12141c] border border-[#262a3a] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#262a3a]">
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Edit Profile & Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Share your fitness goals..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Avatar Image URL
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
            />
          </div>

          {/* Unit Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Preferred Weight Unit
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUnitPref('kg')}
                className={`py-2.5 rounded-xl font-bold text-sm border transition ${
                  unitPref === 'kg'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-glow'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Kilograms (kg)
              </button>
              <button
                type="button"
                onClick={() => setUnitPref('lb')}
                className={`py-2.5 rounded-xl font-bold text-sm border transition ${
                  unitPref === 'lb'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-glow'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Pounds (lbs)
              </button>
            </div>
          </div>

          {/* Profile Privacy Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Profile Privacy Mode
            </label>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition ${
                isPrivate
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                <div>
                  <p className="font-bold text-sm">{isPrivate ? 'Private Profile' : 'Public Profile'}</p>
                  <p className="text-xs opacity-80">
                    {isPrivate ? 'Only approved followers can view your workouts' : 'Anyone can view your shared workouts'}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-black font-extrabold rounded-xl transition shadow-glow flex items-center justify-center gap-2"
            >
              {success ? (
                <>
                  <Check className="w-5 h-5" /> Saved!
                </>
              ) : saving ? (
                'Saving...'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
