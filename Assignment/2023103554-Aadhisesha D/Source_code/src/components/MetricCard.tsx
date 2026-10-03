import type { ReactNode } from 'react';

export function MetricCard({ label, value, hint, icon, accent = 'default' }: { label: string; value: ReactNode; hint: string; icon: ReactNode; accent?: 'default' | 'green' | 'gold' | 'violet' }) {
  return <article className={`metric-card ${accent}`}><div className="metric-top"><div className="metric-icon">{icon}</div><span className="metric-signal" /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></article>;
}
