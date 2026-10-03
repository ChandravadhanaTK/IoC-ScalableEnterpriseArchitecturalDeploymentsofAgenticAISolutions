import React, { useState } from 'react';
import { Bot, ShieldCheck, ArrowRight, Lock, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { storage } from '../services/storage';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const users = storage.getUsers();
  const [selectedUser, setSelectedUser] = useState<User>(users[0]);
  const [emailInput, setEmailInput] = useState(users[0].email);
  const [passwordInput, setPasswordInput] = useState('••••••••••••');

  const handleSelectRole = (user: User) => {
    setSelectedUser(user);
    setEmailInput(user.email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.setCurrentUser(selectedUser);
    storage.addAuditLog({
      actor: selectedUser.name,
      actorRole: selectedUser.role,
      action: 'USER_LOGIN',
      targetResource: 'Authentication Gateway',
      decision: 'executed',
      details: `Successful demo login under role: ${selectedUser.role}`
    });
    onLogin(selectedUser);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Enterprise Notice Banner */}
      <div className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-300">
        <ShieldCheck className="w-4 h-4 text-indigo-400" />
        <span>Enterprise Demonstration Environment &bull; Mock SSO Enabled</span>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 text-white mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">OfficeOps</h1>
          <p className="text-xs text-slate-400 mt-1">
            Scalable Enterprise Architecture for Agentic AI Workplace Operations
          </p>
          <div className="mt-2 text-[11px] font-mono text-indigo-400 bg-indigo-950/40 py-1 px-2.5 rounded-md inline-block border border-indigo-900/50">
            Student: Roopa Varshni R &bull; 2023103509
          </div>
        </div>

        {/* Demo Persona Switcher */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Demo Persona:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {users.map((user) => {
              const isSelected = selectedUser.id === user.id;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectRole(user)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-[11px] font-semibold truncate w-full capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Corporate Identity (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                readOnly
                value={emailInput}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Enterprise SSO Token
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                readOnly
                value={passwordInput}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Persona Permissions:</span>
            </div>
            <p className="pl-5 text-slate-400">
              {selectedUser.role === 'employee' && 'Book meeting spaces, submit IT/Facility requests, review AI recommendations.'}
              {selectedUser.role === 'operations_manager' && 'Manage facility inventories, override schedules, resolve priority tickets.'}
              {selectedUser.role === 'admin' && 'Access telemetry, inspect immutable audit logs, reset demo datasets.'}
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all mt-6"
          >
            <span>Sign In to OfficeOps</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Secure Enterprise Workspace Operations Gateway</span>
          </p>
        </div>
      </div>
    </div>
  );
};
