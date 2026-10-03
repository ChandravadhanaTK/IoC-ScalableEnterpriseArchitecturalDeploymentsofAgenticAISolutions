import { Check, CircleDot, LoaderCircle, OctagonAlert, ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { AgentStep } from '../types/placement';

function iconFor(status: AgentStep['status']) {
  if (status === 'completed') return <Check size={15} />;
  if (status === 'running') return <LoaderCircle className="spin" size={15} />;
  if (status === 'failed') return <OctagonAlert size={15} />;
  return <CircleDot size={15} />;
}

export function AgentTimeline({ steps }: { steps: AgentStep[] }) {
  return <div className="agent-timeline">
    {steps.map((step, index) => <div key={step.id} className={`agent-row ${step.status}`} style={{ '--delay': `${index * 60}ms` } as CSSProperties}>
      <div className="agent-index">{String(index + 1).padStart(2, '0')}</div>
      <div className="agent-icon">{iconFor(step.status)}</div>
      <div className="agent-copy"><div className="agent-title-line"><strong>{step.agent}</strong><span className="status-text">{step.status}</span></div><span>{step.purpose}</span>{step.detail && <small>{step.detail}</small>}</div>
      <div className="agent-metrics">{step.durationMs != null && <span>{(step.durationMs / 1000).toFixed(2)}s</span>}{step.tokens != null && <span>{step.tokens.toLocaleString()} tok</span>}<ArrowUpRight size={14} className="agent-arrow" /></div>
    </div>)}
  </div>;
}
