import React, { useState } from 'react';
import { Dumbbell, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { login, register, quickDemoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          username,
          email,
          password,
          display_name: displayName || username
        });
      } else {
        await login({
          usernameOrEmail: email || username,
          password
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await quickDemoLogin();
    } catch (err) {
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-glow mb-2">
            <Dumbbell className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PULSE
          </h1>
          <p className="text-sm text-slate-400">
            Log workouts, track calendar streak & connect with lifters
          </p>
        </div>

        {/* Demo Mode Quick Access Pill */}
        <div className="bg-[#181b26] border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Instant Demo Mode
            </p>
            <p className="text-xs text-slate-400">Explore pre-seeded workouts & social feed</p>
          </div>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl shadow-glow transition"
          >
            One-Click Login
          </button>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-3xl p-8 border border-[#262a3a] shadow-2xl space-y-6">
          <div className="flex border-b border-[#262a3a] mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
                !isRegister ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
                isRegister ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  required={isRegister}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {isRegister ? 'Username' : 'Username or Email'}
              </label>
              <input
                type="text"
                placeholder={isRegister ? 'e.g. alex_rivera' : 'demo_athlete'}
                value={username || email}
                onChange={(e) => {
                  const val = e.target.value;
                  setUsername(val);
                  setEmail(val);
                }}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-black font-extrabold rounded-xl transition shadow-glow flex items-center justify-center gap-2 mt-4"
            >
              <span>{isRegister ? 'Sign Up' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
