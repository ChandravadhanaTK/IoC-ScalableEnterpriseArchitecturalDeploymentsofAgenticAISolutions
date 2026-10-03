import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Cpu, Activity, Clock, Plus, BookOpen, Layers } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenNewAlert, 
  wsConnected,
  incidentCount 
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Shield className="brand-icon" size={24} color="#06b6d4" />
        </div>
        <div>
          <div className="brand-title">
            IOC SENTINEL
            <span className="brand-badge">AGENTIC AI</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Enterprise Threat Intelligence & SOC Triage Console
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button 
          className={`nav-tab-btn ${activeTab === 'triage' ? 'active' : ''}`}
          onClick={() => setActiveTab('triage')}
        >
          <Activity size={15} />
          Live Incident Triage
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <Layers size={15} />
          Capstone Deliverables (1–5)
        </button>
      </nav>

      <div className="header-status-group">
        <div className="pulse-indicator">
          <div className="pulse-dot" style={{ backgroundColor: wsConnected ? '#10b981' : '#f59e0b' }} />
          <span>{wsConnected ? 'LIVE FEED ACTIVE' : 'RECONNECTING'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
          <Clock size={13} />
          <span>{currentTime}</span>
        </div>

        <button className="btn-primary" onClick={onOpenNewAlert}>
          <Plus size={15} />
          Ingest Raw Alert
        </button>
      </div>
    </header>
  );
}
