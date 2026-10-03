import React from 'react';
import { Zap, Clock, Database, DollarSign, ShieldAlert, CheckCircle } from 'lucide-react';

export default function MetricsBar({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="metrics-ribbon">
      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
          <Zap size={18} />
        </div>
        <div>
          <div className="metric-label">Mean Time to Detect (MTTD)</div>
          <div className="metric-value">{metrics.mean_time_to_detect_seconds}s</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
          <Clock size={18} />
        </div>
        <div>
          <div className="metric-label">MTTR Reduction</div>
          <div className="metric-value">-{metrics.mttr_reduction_percentage}% <span style={{ fontSize: '0.75rem', color: '#10b981' }}>({metrics.mean_time_to_remediate_minutes}m)</span></div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
          <Database size={18} />
        </div>
        <div>
          <div className="metric-label">Threat Cache Hit Ratio</div>
          <div className="metric-value">{metrics.cache_hit_ratio}%</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
          <DollarSign size={18} />
        </div>
        <div>
          <div className="metric-label">Model Cost / Incident</div>
          <div className="metric-value">${metrics.cost_per_incident_usd} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>(Gemini)</span></div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
          <ShieldAlert size={18} />
        </div>
        <div>
          <div className="metric-label">Prompt Injections Thwarted</div>
          <div className="metric-value" style={{ color: '#f43f5e' }}>{metrics.prompt_injections_blocked}</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
          <CheckCircle size={18} />
        </div>
        <div>
          <div className="metric-label">Automated Triage Rate</div>
          <div className="metric-value">{metrics.automated_triage_percentage}%</div>
        </div>
      </div>
    </div>
  );
}
