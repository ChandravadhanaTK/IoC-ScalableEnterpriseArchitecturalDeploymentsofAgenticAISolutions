import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Shield, Key, CheckCircle2, User, X, Lock, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, loginAs, loginWithEmail } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('engineer');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      loginWithEmail(emailInput.trim(), selectedRole);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Enterprise Authentication</h3>
              <p className="text-xs text-slate-400">
                Single Sign-On (SSO) with Role-Based Access Control (RBAC).
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Enterprise Persona Switcher */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Select Enterprise Persona:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allUsers.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    loginAs(u.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/50 shadow-md ring-1 ring-indigo-500/40'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">{u.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-indigo-300 font-semibold uppercase">{u.role}</div>
                    <div className="text-[10px] text-slate-400 truncate">{u.department.split('&')[0]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Login Form */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Or Sign In with Corporate Email:
          </label>

          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="email"
                placeholder="name@enterprise.corp"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="sm:col-span-2 text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
              >
                <option value="engineer">Engineer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
            >
              Sign In via Mock SSO Gateway
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>FIDO2 WebAuthn & MFA token verified. All actions signed in cryptographic audit log.</span>
        </div>
      </div>
    </div>
  );
};
