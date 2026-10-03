import React from 'react';
import { Bot, ShieldCheck, Activity, Cpu, Layers } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, metrics }) {
  return (
    <header className="glass-panel" style={{ margin: '20px 24px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
          <Bot size={28} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Enterprise Agentic AI Core Platform
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Author: <strong style={{ color: '#06b6d4' }}>Manikandan</strong> | Roll No: <strong style={{ color: '#8b5cf6' }}>2023103519</strong>
          </p>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '8px', background: 'rgba(15,23,42,0.6)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setActiveTab('orchestrator')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'orchestrator' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: activeTab === 'orchestrator' ? '#06b6d4' : '#94a3b8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Cpu size={16} /> Orchestrator Console
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'telemetry' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: activeTab === 'telemetry' ? '#06b6d4' : '#94a3b8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Activity size={16} /> Telemetry & Cost
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'architecture' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: activeTab === 'architecture' ? '#06b6d4' : '#94a3b8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Layers size={16} /> Enterprise Deliverables
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>Guardrail Active</span>
        </div>
      </div>
    </header>
  );
}
