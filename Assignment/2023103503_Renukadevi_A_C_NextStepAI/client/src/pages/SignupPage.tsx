import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, User, Mail, Lock, Shield, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'admin',
    admin_secret: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(
        form.name,
        form.email,
        form.password,
        form.role,
        form.role === 'admin' ? form.admin_secret : undefined,
      );
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-electric-500/20 border border-electric-500/30 mb-4">
            <Brain className="w-8 h-8 text-electric-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Join NextStep</h1>
          <p className="text-white/50 mt-1">Start reaching your goals today</p>
        </div>

        <div className="card animate-fade-in">
          <h2 className="text-xl font-semibold text-white mb-6">Create an account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Alex Chen"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  className="input pl-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="label">Account type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['student', 'admin'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('role', r)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      form.role === r
                        ? 'border-electric-500 bg-electric-500/20 text-electric-400'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {r === 'student' ? '🎓 Student' : '🛡️ Admin'}
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'admin' && (
              <div className="p-3 bg-accent-amber/10 border border-accent-amber/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-accent-amber" />
                  <span className="text-accent-amber text-sm font-medium">Admin secret required</span>
                </div>
                <input
                  type="password"
                  className="input text-sm"
                  placeholder="Enter admin secret key"
                  value={form.admin_secret}
                  onChange={e => set('admin_secret', e.target.value)}
                />
                <p className="text-white/30 text-xs mt-1">Demo secret: nextstep-admin-secret</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-electric-400 hover:text-electric-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
