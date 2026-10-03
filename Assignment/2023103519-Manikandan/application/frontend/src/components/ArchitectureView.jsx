import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Layers, Shield, Server } from 'lucide-react';

export default function ArchitectureView() {
  const mermaidRef = useRef(null);

  const mermaidDiagram = `
graph TB
    subgraph Client_Layer["1. Presentation Layer (Public Boundary)"]
        UI["React Web Application Dashboard"]
        CLI["API & CLI Consumers"]
    end

    subgraph Trust_Boundary_1["🔒 Trust Boundary 1: Ingress Layer"]
        GW["API Gateway & Reverse Proxy"]
        AUTH["OAuth2 / OIDC IAM Verification"]
    end

    subgraph Agentic_Core["2. Agentic Orchestration Core"]
        SUP["Supervisor Agent (Orchestrator)"]
        RES["Research Agent"]
        EXEC["Execution Sandbox Agent"]
    end

    subgraph Trust_Boundary_2["🔒 Trust Boundary 2: Security & Policy Enforcer"]
        GUARD["Security Guardrail Agent"]
        HITL["Human-in-the-Loop Approval Engine"]
    end

    UI --> GW
    GW --> AUTH
    AUTH --> SUP
    SUP --> RES
    SUP --> EXEC
    RES --> GUARD
    EXEC --> GUARD
    GUARD -->|High Risk| HITL
  `;

  useEffect(() => {
    try {
      mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
      if (mermaidRef.current) {
        mermaid.render('mermaid-arch-svg', mermaidDiagram).then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        }).catch(err => console.error('Mermaid render error:', err));
      }
    } catch (e) {
      console.log('Mermaid init warning:', e.message);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} color="#06b6d4" /> Deliverable 1: Enterprise Architecture Model
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px' }}>
          Multi-layer zero-trust agentic topology with strict boundary isolation between presentation, orchestration, guardrails, and sandboxed execution.
        </p>

        <div ref={mermaidRef} style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', minHeight: '260px', display: 'flex', justifyContent: 'center' }}>
          {/* Rendered Mermaid SVG */}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} /> Deliverable 4: Security Control Matrix
          </h3>
          <ul style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.7', listStylePosition: 'inside' }}>
            <li><strong>Identity:</strong> OIDC / JWT short-lived bearer tokens (15m TTL).</li>
            <li><strong>Authorization:</strong> Granular RBAC scopes (`agent:run`, `hitl:approve`).</li>
            <li><strong>Guardrails:</strong> PII scrubbing & prompt injection risk scanning.</li>
            <li><strong>HITL Engine:</strong> Mandatory operator sign-off for risk score &gt; 0.65.</li>
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={16} /> Deliverable 3: Deployment Topology
          </h3>
          <ul style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.7', listStylePosition: 'inside' }}>
            <li><strong>Cluster:</strong> Multi-AZ Kubernetes (EKS / GKE) with HPA.</li>
            <li><strong>Sandbox:</strong> gVisor secure container runtime for untrusted code execution.</li>
            <li><strong>Release Strategy:</strong> Blue/Green with 10% Canary rollout verification.</li>
            <li><strong>Rollback SLA:</strong> Instant DNS/ALB weight flip under 30 seconds.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
