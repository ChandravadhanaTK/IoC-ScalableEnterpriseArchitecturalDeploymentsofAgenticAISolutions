import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bot, CheckSquare, Grid, Layers, ShieldCheck, UserCheck, ChevronDown, Sparkles } from 'lucide-react';
import { CapstoneDeliverableId } from '../../types';

export type MainTab = 'tasks' | 'matrix' | 'deliverables' | 'audit';

interface NavbarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  selectedDeliverable: CapstoneDeliverableId;
  onSelectDeliverable: (id: CapstoneDeliverableId) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedDeliverable,
  onSelectDeliverable,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();

  const deliverableItems: { id: CapstoneDeliverableId; label: string; num: string }[] = [
    { id: 'overview', label: 'Overview', num: '0' },
    { id: 'architecture', label: '1. Architecture Diagram', num: '1' },
    { id: 'workflow', label: '2. Agent Workflow Design', num: '2' },
    { id: 'deployment', label: '3. Deployment Strategy', num: '3' },
    { id: 'security', label: '4. Security Model', num: '4' },
    { id: 'monitoring', label: '5. Monitoring Dashboard', num: '5' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">
                  Todo Agent
                </span>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                  Enterprise
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Scalable Agentic Architecture
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => onSelectTab('tasks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tasks
            </button>

            <button
              onClick={() => onSelectTab('matrix')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Eisenhower Matrix
            </button>

            <button
              onClick={() => onSelectTab('deliverables')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'deliverables'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Capstone Deliverables
              <span className="text-[10px] bg-purple-400/20 text-purple-200 px-1.5 py-0.2 rounded-full font-mono">
                5
              </span>
            </button>

            <button
              onClick={() => onSelectTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Audit Trail
            </button>
          </nav>

          {/* Right: User Authentication Badge & Persona Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition group text-left"
              title="Click to Switch User / Persona"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover border border-slate-700"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                  {currentUser.name}
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {currentUser.role.toUpperCase()}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Sub-bar for Capstone Deliverables when active */}
        {currentTab === 'deliverables' && (
          <div className="py-2.5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase pr-2">
              Deliverables:
            </span>
            {deliverableItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectDeliverable(item.id)}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedDeliverable === item.id
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden py-2 border-t border-slate-800 gap-1 overflow-x-auto">
          <button
            onClick={() => onSelectTab('tasks')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              currentTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => onSelectTab('matrix')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              currentTab === 'matrix' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Matrix
          </button>
          <button
            onClick={() => onSelectTab('deliverables')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              currentTab === 'deliverables' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Deliverables (5)
          </button>
          <button
            onClick={() => onSelectTab('audit')}
            className={`px-3 py-1 rounded text-xs font-medium ${
              currentTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Audit
          </button>
        </div>
      </div>
    </header>
  );
};
