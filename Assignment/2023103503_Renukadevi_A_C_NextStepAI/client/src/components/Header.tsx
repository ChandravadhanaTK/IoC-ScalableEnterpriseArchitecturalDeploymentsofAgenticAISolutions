import { PlusCircle, Sparkles, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title = 'Dashboard', subtitle = 'Agentic Next Step Recommendation' }: HeaderProps) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-white/10 bg-navy-800/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Agent State status badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-white/60">LangGraph Agent:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Ready
          </span>
        </div>

        {/* User Role Tag */}
        <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
          isAdmin 
            ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30' 
            : 'bg-electric-500/15 text-electric-400 border border-electric-500/30'
        }`}>
          {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
          <span>{isAdmin ? 'Admin Mode (Superuser)' : 'Student Mode'}</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/create-goal')}
          className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3 shadow-lg shadow-electric-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>
    </header>
  );
}
