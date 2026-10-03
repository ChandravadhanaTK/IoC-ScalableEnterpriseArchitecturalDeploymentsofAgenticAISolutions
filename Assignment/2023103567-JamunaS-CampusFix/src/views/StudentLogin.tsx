import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';

interface StudentLoginProps {
  onNavigate: (view: string) => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), password);
      onNavigate('student-dashboard');
    } catch (err) {
      setError((err as Error).message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 cursor-pointer mb-2"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            Campus<span className="text-blue-600">Fix</span>
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Student Sign In
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access your submitted grievances, status timelines, and alerts
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl border border-slate-200 rounded-2xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campusfix.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Quick Demo Fill
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('alex.chen@campusfix.edu', 'StudentPass123!')}
                className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-lg text-left transition-colors"
              >
                <div className="font-semibold text-slate-900">Alex Chen</div>
                <div className="text-[10px] text-slate-500">CS • 3rd Year</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('priya.patel@campusfix.edu', 'StudentPass123!')}
                className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-lg text-left transition-colors"
              >
                <div className="font-semibold text-slate-900">Priya Patel</div>
                <div className="text-[10px] text-slate-500">Mech • 2nd Year</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              Need a new student account?{' '}
              <button
                onClick={() => onNavigate('student-register')}
                className="font-bold text-blue-600 hover:text-blue-700 underline"
              >
                Register now
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
