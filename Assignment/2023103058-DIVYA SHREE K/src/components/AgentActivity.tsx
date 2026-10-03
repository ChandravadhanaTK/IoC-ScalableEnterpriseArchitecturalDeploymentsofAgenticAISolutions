import { AgentStep } from '@/types';
import { Brain, Map, Wrench, Cog, MessageSquare, Check } from 'lucide-react';

const PHASE_ICONS: Record<string, typeof Brain> = {
  'Understanding': Brain,
  'Planning': Map,
  'Selecting Tool': Wrench,
  'Executing': Cog,
  'Responding': MessageSquare,
};

export function AgentActivity({ steps }: { steps: AgentStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="card card-pad" style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="sidebar-logo" style={{ width: 28, height: 28 }}>
          <Brain size={16} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Agent Activity</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Watching the AI think...</div>
        </div>
      </div>
      <div className="agent-steps">
        {steps.map((step, i) => {
          const Icon = PHASE_ICONS[step.phase] || Brain;
          return (
            <div key={i} className={`agent-step ${step.status}`}>
              <div className="agent-step-icon">
                {step.status === 'done' ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{step.phase}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{step.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
