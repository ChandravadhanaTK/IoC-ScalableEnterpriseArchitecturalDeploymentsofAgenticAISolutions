import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Filter, Search } from 'lucide-react';

export default function IncidentStream({ 
  incidents, 
  selectedIncidentId, 
  onSelectIncident 
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = incidents.filter(inc => {
    if (filterStatus === 'AWAITING' && inc.status !== 'AWAITING_APPROVAL') return false;
    if (filterStatus === 'HIGH_CRIT' && !['HIGH', 'CRITICAL'].includes(inc.severity)) return false;
    if (filterStatus === 'RESOLVED' && !['REMEDIATED', 'CLOSED'].includes(inc.status)) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inc.incident_id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        (inc.raw_alert && inc.raw_alert.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <aside className="incident-stream-panel">
      <div className="panel-header">
        <div className="panel-title">
          <AlertTriangle size={16} color="#06b6d4" />
          Active Incident Stream ({incidents.length})
        </div>
      </div>

      <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search IOC, host, hash..."
            className="form-input"
            style={{ width: '100%', paddingLeft: '32px', fontSize: '0.78rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {['ALL', 'AWAITING', 'HIGH_CRIT', 'RESOLVED'].map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              style={{
                fontSize: '0.68rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: 'none',
                background: filterStatus === f ? 'var(--cyan-dim)' : 'rgba(255,255,255,0.05)',
                color: filterStatus === f ? 'var(--cyan-glow)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f === 'AWAITING' ? '⏳ Approval Needed' : f === 'HIGH_CRIT' ? '🔥 High/Crit' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="incident-list">
        {filtered.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            No incidents matching current criteria.
          </div>
        ) : (
          filtered.map(inc => {
            const isSelected = inc.incident_id === selectedIncidentId;
            const isAwaiting = inc.status === 'AWAITING_APPROVAL';

            return (
              <div 
                key={inc.incident_id}
                className={`incident-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectIncident(inc.incident_id)}
              >
                <div className="incident-card-header">
                  <span className="incident-id-badge">{inc.incident_id}</span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span className={`badge ${getSeverityBadgeClass(inc.severity)}`}>
                      {inc.severity}
                    </span>
                    <span className={`badge badge-status ${isAwaiting ? 'awaiting' : ''}`}>
                      {isAwaiting ? 'APPROVAL NEEDED' : inc.status}
                    </span>
                  </div>
                </div>

                <div className="incident-title-text">
                  {inc.title}
                </div>

                <div className="incident-meta-row">
                  <span>{inc.source_feed}</span>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    color: inc.composite_risk_score >= 70 ? '#f43f5e' : inc.composite_risk_score >= 35 ? '#f59e0b' : '#10b981',
                    fontWeight: 700 
                  }}>
                    Risk: {inc.composite_risk_score}/100
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
