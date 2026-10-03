import React, { useState } from 'react';
import {
  Boxes,
  ArrowRight,
  ShieldCheck,
  Workflow,
  Layers3,
  Cpu,
} from 'lucide-react';
import { Profile } from '../types';

interface LoginViewProps {
  onLogin: (profile: Profile) => void;
  profiles: Profile[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, profiles }) => {
  const [email, setEmail] = useState('employee@assetcarehq.demo');
  const [password, setPassword] = useState('Demo@1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check credentials against demo database
    const matchedProfile = profiles.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    );

    setTimeout(() => {
      setLoading(false);
      if (!matchedProfile) {
        setError('Invalid account email. Please select one of the seeded demo accounts.');
      } else if (password !== 'Demo@1234') {
        setError('Incorrect password. Use the demo password: Demo@1234');
      } else {
        onLogin(matchedProfile);
      }
    }, 250);
  };

  const selectAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('Demo@1234');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F9FC]">
      {/* Left Sign In Panel */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-14 bg-white border-r border-gray-200">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Boxes className="w-5 h-5" />
          </div>
          <strong className="text-gray-900 font-extrabold text-base tracking-tight">
            AssetCare<span className="text-blue-600">HQ</span>
          </strong>
        </div>

        {/* Main Form */}
        <div className="my-8 max-w-sm w-full mx-auto space-y-6">
          <div>
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">
              WELCOME BACK
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sign in to your<br />workspace<span className="text-blue-600">.</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1.5">
              Intelligent IT Asset Lifecycle & Operations Platform
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign in to workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-gray-100">
            <strong className="block text-xs font-bold text-gray-800">
              1-Click Demo Personas
            </strong>
            <p className="text-[11px] text-gray-400 mb-2">
              Select an account to pre-fill credentials (Demo@1234):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectAccount('employee@assetcarehq.demo')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                Employee
              </button>
              <button
                type="button"
                onClick={() => selectAccount('manager@assetcarehq.demo')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:border-amber-500 hover:bg-amber-50 transition-colors"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => selectAccount('admin@assetcarehq.demo')}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                Asset Admin
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-gray-400">
          &copy; AssetCareHQ &bull; <span className="font-semibold text-gray-500">Demo Environment &mdash; Agent decisions are simulated.</span>
        </div>
      </div>

      {/* Right Visual Brand Panel */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-12 text-white flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">SYSTEM OPERATIONAL</span>
          </div>
          <span>ACADEMIC PROTOTYPE 2026</span>
        </div>

        <div className="max-w-md space-y-4 my-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Layers3 className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            INTELLIGENT ASSET OPERATIONS
          </div>
          <h2 className="text-3xl font-extrabold leading-tight">
            Every asset.<br />
            Every decision.<br />
            <em className="text-blue-400 not-italic">Accounted for.</em>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Coordinate IT assets, automate operational decisions, and keep every lifecycle action governed, traceable, and visible.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Governed decisions</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Workflow className="w-4 h-4 text-blue-400" />
              <span>Traceable workflows</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-4">
          <span>DETERMINISTIC MULTI-AGENT ARCHITECTURE</span>
          <span className="font-mono">6 AGENTS &bull; 10 TOOLS</span>
        </div>
      </div>
    </div>
  );
};
