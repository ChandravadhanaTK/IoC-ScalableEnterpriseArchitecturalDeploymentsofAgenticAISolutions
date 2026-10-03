import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (view: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both administrator email and password.');
      return;
    }

    try {
      setLoading(true);
      await adminLogin(email.trim().toLowerCase(), password);
      onNavigate('admin-dashboard');
    } catch (err) {
      setError((err as Error).message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@campusfix.edu');
    setPassword('AdminPassword123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 cursor-pointer mb-2"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Campus<span className="text-blue-400">Fix</span>
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Campus Administration Console
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Authorized personnel only • Facility, Estate & Department Dispatchers
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl border border-slate-700/80 rounded-2xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-5 p-3 bg-blue-950/50 border border-blue-800/60 rounded-xl flex items-center gap-2 text-xs text-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Role-restricted administrator access with encrypted token verification.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campusfix.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Admin...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-6 pt-5 border-t border-slate-700">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Demo Admin Credentials
            </span>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="w-full p-2.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-lg text-left transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-slate-200">admin@campusfix.edu</div>
                <div className="text-[10px] text-slate-400">Password: AdminPassword123!</div>
              </div>
              <span className="text-[11px] font-bold text-blue-400">Autofill ➔</span>
            </button>
          </div>

          <div className="mt-5 text-center">
            <button
              onClick={() => onNavigate('student-login')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Return to Student Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
