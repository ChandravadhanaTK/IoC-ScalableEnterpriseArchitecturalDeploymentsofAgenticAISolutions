import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  Cloud, 
  ShieldCheck, 
  BarChart3, 
  ExternalLink, 
  Check, 
  Zap, 
  Server, 
  Lock 
} from 'lucide-react';

export default function ArchitectureView() {
  const [activeSection, setActiveSection] = useState('deployment'); // default to deployment since user asked about it!

  return (
    <div className="architecture-view-container">
      {/* Deliverables Navigation Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        {[
          { id: 'arch', label: '1. Architecture Diagram', icon: <Layers size={16} /> },
          { id: 'workflow', label: '2. Agent Workflow Design', icon: <Cpu size={16} /> },
          { id: 'deployment', label: '3. Deployment Strategy (100% Free Tier)', icon: <Cloud size={16} /> },
          { id: 'security', label: '4. Security Model & RBAC', icon: <ShieldCheck size={16} /> },
          { id: 'telemetry', label: '5. Monitoring Dashboard & SLAs', icon: <BarChart3 size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            style={{
              background: activeSection === tab.id ? 'var(--cyan-dim)' : 'rgba(255,255,255,0.03)',
              color: activeSection === tab.id ? 'var(--cyan-glow)' : 'var(--text-muted)',
              border: activeSection === tab.id ? '1px solid var(--cyan-glow)' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.65rem 1.1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Architecture Diagram */}
      {activeSection === 'arch' && (
        <div className="deliverable-card">
          <div className="deliverable-title">
            <Layers size={22} />
            Deliverable 1: Enterprise Multi-Tier Trust Boundary Architecture
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            IOC Sentinel isolates untrusted external indicators from internal enterprise networks through four distinct cryptographic and network trust boundaries.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.3)' }}>
              <div style={{ color: '#f43f5e', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Trust Boundary 0: Ingress (Untrusted)
              </div>
              <ul style={{ fontSize: '0.78rem', color: '#94a3b8', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Raw SIEM alert payloads (Splunk, Elastic, Defender)</li>
                <li>Public Threat Feeds (VirusTotal, AlienVault, AbuseIPDB)</li>
                <li>Untrusted analyst browser sessions</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Trust Boundary 1: Edge & DMZ Gateway
              </div>
              <ul style={{ fontSize: '0.78rem', color: '#94a3b8', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Cloud WAF & DDoS Shield</li>
                <li>TLS 1.3 Termination & JWT verification</li>
                <li>Pydantic payload schema enforcement</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.3)' }}>
              <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Trust Boundary 2: Agent Core (Trusted)
              </div>
              <ul style={{ fontSize: '0.78rem', color: '#94a3b8', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>FastAPI Async Engine + LangGraph State Machine</li>
                <li>5 Specialized micro-agents with deterministic checkpoints</li>
                <li>24-Hour Threat Intel Cache & SQLite/Postgres persistence</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Trust Boundary 4: High-Privilege Action Enclave
              </div>
              <ul style={{ fontSize: '0.78rem', color: '#94a3b8', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Cryptographic Human-in-the-Loop (HITL) gate</li>
                <li>Zero-trust dual authorization for firewall/EDR commands</li>
                <li>Palo Alto Networks & CrowdStrike Falcon integrations</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. Agent Workflow Design */}
      {activeSection === 'workflow' && (
        <div className="deliverable-card">
          <div className="deliverable-title">
            <Cpu size={22} />
            Deliverable 2: Multi-Agent Workflow & State Machine (LangGraph)
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Instead of brittle monolithic prompts, IOC Sentinel delegates specialized tasks to a team of 5 collaborative micro-agents with clear handoffs and failure paths.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
            {[
              { name: '1. Supervisor & Gateway', role: 'State initialization, budget tracking, and ingress PII/injection sanitization.' },
              { name: '2. IOC Extractor', role: 'Multi-pattern regex & Gemini contextual parsing; artifact normalization & de-fanging.' },
              { name: '3. Threat Intel Enricher', role: 'Concurrent lookups across VirusTotal, AbuseIPDB, and AlienVault; composite threat scoring.' },
              { name: '4. Blast Radius Correlator', role: 'SIEM asset correlation, MITRE ATT&CK technique mapping, and blast radius calculation.' },
              { name: '5. Remediation & HITL Gate', role: 'Containment playbook formulation, rollback planning, and cryptographic human sign-off.' }
            ].map((ag, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  {ag.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {ag.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 100% Free-Tier Deployment Strategy */}
      {activeSection === 'deployment' && (
        <div className="deliverable-card">
          <div className="deliverable-title">
            <Cloud size={22} />
            Deliverable 3: 100% Free-Tier Enterprise Deployment Architecture ($0/month)
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            IOC Sentinel is architected to operate with <strong>$0 cloud hosting costs</strong> across verified perpetual free tiers while satisfying enterprise availability, resilience, and security SLAs.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', marginTop: '0.5rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Layer / Component</th>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Target Free Service</th>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Free Tier Allowance</th>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Zero-Cost Topology</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>Frontend UI</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#06b6d4' }}>Vercel or Cloudflare Pages</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>Unlimited bandwidth, free SSL, CI/CD</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Edge CDN serving compiled React/Vite SPA</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>Backend API</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#06b6d4' }}>Render or Hugging Face Spaces</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>512 MB Web Service / 16 GB Docker Space</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Containerized FastAPI + LangGraph Async App</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>Database</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#06b6d4' }}>Neon.tech or Embedded SQLite</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>0.5 GB Postgres or Zero-Config SQLite WAL</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>ACID state checkpoints & audit trail</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>Cache & Queue</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#06b6d4' }}>Upstash Redis or In-Memory LRU</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>10,000 commands/day or local fallback</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>24h threat cache eliminates redundant API calls</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>Foundation Model</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#06b6d4' }}>Google AI Studio (Gemini)</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#94a3b8' }}>1,500 req/day, 15 RPM, 1M TPM (100% Free)</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Official Google GenAI SDK integration</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem', fontWeight: 600 }}>Threat Feeds</td>
                <td style={{ padding: '0.65rem', color: '#06b6d4' }}>VirusTotal, AbuseIPDB, AlienVault</td>
                <td style={{ padding: '0.65rem', color: '#94a3b8' }}>500 VT lookups/day + 1000 Abuse lookups/day</td>
                <td style={{ padding: '0.65rem' }}>Integrated offline fallback sandbox when unconfigured</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', background: 'rgba(6,182,212,0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
            <div style={{ fontWeight: 700, color: 'var(--cyan-glow)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              Free Tier Resilience Strategies Implemented:
            </div>
            <ul style={{ fontSize: '0.78rem', color: '#cbd5e1', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li><strong>Cold-Start Mitigation:</strong> Automated keep-alive heartbeat and fast sub-20s SQLite warmup.</li>
              <li><strong>Cache-First Quota Optimization:</strong> 24-Hour TTL caching prevents consuming threat API or Gemini quotas on recurring IOCs.</li>
              <li><strong>Circuit Breaker & Fallback:</strong> Seamless fallback to built-in realistic threat sandbox when rate limits or quotas are reached.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 4. Security Model */}
      {activeSection === 'security' && (
        <div className="deliverable-card">
          <div className="deliverable-title">
            <ShieldCheck size={22} />
            Deliverable 4: Enterprise Security Model & Guardrails
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Comprehensive defensive controls protecting sensitive internal network data from leaking to LLMs and shielding agents from prompt injection attacks.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                RFC1918 Private IP Masking
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Internal subnets (<code>10.0.0.0/8</code>, <code>172.16.0.0/12</code>, <code>192.168.0.0/16</code>) are masked as <code>[INTERNAL_HOST_n]</code> before passing to LLMs, guaranteeing enterprise topology confidentiality.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: '#f43f5e', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Prompt Injection Firewall
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Scans inbound alerts for instruction override patterns (<code>"ignore previous instructions"</code>, <code>"override system"</code>), neutralizing adversary payloads before they reach agent nodes.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Immutable WORM Audit Log
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Every agent thought, tool call, and analyst decision is hashed with SHA-256 in a cryptographic merkle chain written to append-only storage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Telemetry & SLAs */}
      {activeSection === 'telemetry' && (
        <div className="deliverable-card">
          <div className="deliverable-title">
            <BarChart3 size={22} />
            Deliverable 5: Monitoring Dashboard & SLA Matrix
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Production SLOs and operational metrics evaluated across 6 core telemetry dimensions.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', marginTop: '0.5rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Metric Dimension</th>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Target SLA</th>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Warning Level</th>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Critical Threshold</th>
                <th style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Automated Remediation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>E2E Triage Latency</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#10b981' }}>&lt; 15 seconds</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#f59e0b' }}>&gt; 30 seconds</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#f43f5e' }}>&gt; 60 seconds</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Autoscale ASGI workers, cached mode</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>Threat Feed Error Rate</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#10b981' }}>&lt; 1.0%</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#f59e0b' }}>&gt; 5.0%</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#f43f5e' }}>&gt; 15.0%</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Trip circuit breaker, fallback to sandbox</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600 }}>Model Cost / Incident</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#10b981' }}>&lt; $0.02</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#f59e0b' }}>&gt; $0.05</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)', color: '#f43f5e' }}>&gt; $0.15</td>
                <td style={{ padding: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>Downgrade model to Gemini Flash Lite</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem', fontWeight: 600 }}>Human Override Rate</td>
                <td style={{ padding: '0.65rem', color: '#10b981' }}>&lt; 5.0%</td>
                <td style={{ padding: '0.65rem', color: '#f59e0b' }}>&gt; 10.0%</td>
                <td style={{ padding: '0.65rem', color: '#f43f5e' }}>&gt; 20.0%</td>
                <td style={{ padding: '0.65rem' }}>Trigger prompt regression tuning</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
