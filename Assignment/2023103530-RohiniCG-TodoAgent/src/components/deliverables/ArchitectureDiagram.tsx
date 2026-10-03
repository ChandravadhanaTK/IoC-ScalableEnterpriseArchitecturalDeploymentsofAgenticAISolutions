import React, { useState } from 'react';
import { Layers, Shield, Server, Database, Cpu, Lock, CheckCircle2, ChevronRight, Download, Eye, ExternalLink } from 'lucide-react';

interface ComponentDetail {
  id: string;
  name: string;
  layer: string;
  trustBoundary: string;
  protocol: string;
  description: string;
  securityControls: string[];
  sla: string;
  integrationPoints: string[];
}

export const ArchitectureDiagram: React.FC = () => {
  const [selectedBoundary, setSelectedBoundary] = useState<string>('all');
  const [activeComponent, setActiveComponent] = useState<ComponentDetail | null>(null);

  const components: ComponentDetail[] = [
    {
      id: 'web_portal',
      name: 'React SPA Client & Mobile App',
      layer: 'Layer 1: Client & Ingestion',
      trustBoundary: 'Boundary A: Public Internet',
      protocol: 'HTTPS / WSS (TLS 1.3)',
      description: 'Zero-trust enterprise frontend with instant role switching, task prioritization visualizer, and agent execution console.',
      securityControls: ['Content Security Policy (CSP Level 3)', 'HttpOnly SameSite cookies', 'Client-side PII masking'],
      sla: '99.99% Availability',
      integrationPoints: ['Envoy API Gateway', 'Corporate OIDC Identity Provider'],
    },
    {
      id: 'api_gateway',
      name: 'Envoy Gateway & Zero-Trust Proxy',
      layer: 'Layer 2: Edge & Security Boundary',
      trustBoundary: 'Boundary B: DMZ / Ingress',
      protocol: 'mTLS & gRPC Proxy',
      description: 'Terminates external TLS, validates RS256 JWT tokens from corporate IdP, enforces token-bucket rate limits per client.',
      securityControls: ['Mutual TLS (mTLS)', 'DDoS Protection', 'WAF Inspection', 'RS256 JWT validation'],
      sla: '99.999% Availability, p99 < 12ms',
      integrationPoints: ['HashiCorp Vault', 'Agent Router Service'],
    },
    {
      id: 'task_router',
      name: 'Agent Task Router & Priority Planner',
      layer: 'Layer 3: Agent Orchestration Engine',
      trustBoundary: 'Boundary C: Private Agent VPC',
      protocol: 'Internal gRPC / Protobuf',
      description: 'Coordinates multi-agent state machines, runs Eisenhower urgency/impact weighting formulas, and determines tool execution paths.',
      securityControls: ['Strict VPC peering', 'Zero egress to internet', 'NeMo Guardrails pre-flight scan'],
      sla: '99.95% Availability, p95 < 140ms',
      integrationPoints: ['Vector Embedding Cache', 'Tool Execution Sandbox', 'Audit Chaining Service'],
    },
    {
      id: 'tool_sandbox',
      name: 'Isolated Firecracker microVM Cluster',
      layer: 'Layer 4: Sandboxed Tool Execution',
      trustBoundary: 'Boundary D: Isolated Sandbox Cluster',
      protocol: 'Restricted Unix Sockets / gVisor',
      description: 'Ephemeral microVMs spinning up in <5ms to execute untrusted code, run linters, or perform synthetic load benchmarks.',
      securityControls: ['eBPF Seccomp syscall filtering', 'No root privileges', 'Strict egress domain whitelisting', 'Ephemeral lifecycle'],
      sla: '99.9% Availability, execution timeout 60s',
      integrationPoints: ['GitHub REST API', 'Jira Cloud Webhook', 'Slack Enterprise Grid'],
    },
    {
      id: 'data_store',
      name: 'Cloud SQL PostgreSQL + pgvector',
      layer: 'Layer 5: Data & Telemetry Foundation',
      trustBoundary: 'Boundary E: Encrypted Data Plane',
      protocol: 'mTLS Encrypted PostgreSQL Wire',
      description: 'ACID transactional store for tasks, subtasks, users, and vector embeddings with automated cross-region replication.',
      securityControls: ['Customer-Managed KMS Encryption (CMEK)', 'Row-Level Security (RLS)', 'Automated point-in-time recovery'],
      sla: '99.99% Availability, RTO < 5m, RPO < 1m',
      integrationPoints: ['Task Router', 'Grafana OpenTelemetry Collector'],
    },
  ];

  const boundaries = [
    { id: 'all', label: 'All Boundaries', color: 'border-slate-700 text-slate-300' },
    { id: 'public', label: 'Boundary A: Public Internet', color: 'border-red-500/40 text-red-400 bg-red-500/10' },
    { id: 'dmz', label: 'Boundary B: DMZ / Ingress Gateway', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
    { id: 'agent_vpc', label: 'Boundary C: Private Agent VPC', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
    { id: 'sandbox', label: 'Boundary D: MicroVM Tool Sandbox', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
    { id: 'data_plane', label: 'Boundary E: Encrypted Data Plane', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-wider uppercase mb-1">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">1</span>
            Deliverable 1 • Enterprise Architecture Completeness
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            System Architecture Blueprint
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Hierarchical layers, isolated microservices, strict zero-trust boundaries, and enterprise tool integrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const spec = JSON.stringify(components, null, 2);
              const blob = new Blob([spec], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'todo-agent-architecture-spec.json';
              a.click();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export C4 Spec (JSON)
          </button>
        </div>
      </div>

      {/* Trust Boundary Filter Bar */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          Filter by Zero-Trust Security Boundary:
        </label>
        <div className="flex flex-wrap gap-2">
          {boundaries.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoundary(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                selectedBoundary === b.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Visual Blueprint Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5 Architecture Layers */}
        <div className="lg:col-span-8 space-y-4">
          {/* Layer 1: Client */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Layer 1: Client & Ingestion Layer
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-300">
                Boundary A: Public Internet
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setActiveComponent(components[0])}
                className="cursor-pointer p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80 hover:border-blue-500 hover:bg-slate-800 transition"
              >
                <div className="text-sm font-semibold text-white">React Enterprise SPA</div>
                <div className="text-xs text-slate-400 mt-1">Multi-role UI & Eisenhower Matrix</div>
                <div className="mt-2 text-[10px] text-blue-300 font-mono">HTTPS • CSP Level 3</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="text-sm font-semibold text-slate-200">Mobile Progressive App</div>
                <div className="text-xs text-slate-400 mt-1">Push notifications & offline queue</div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">HTTPS • ServiceWorker</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="text-sm font-semibold text-slate-200">Inbound Webhook Receiver</div>
                <div className="text-xs text-slate-400 mt-1">GitHub, Jira & Slack Event Bus</div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">HMAC SHA-256 Verified</div>
              </div>
            </div>
          </div>

          {/* Connection Pipe */}
          <div className="flex items-center justify-center my-1">
            <div className="h-6 w-0.5 bg-gradient-to-b from-blue-500 to-amber-500" />
          </div>

          {/* Layer 2: API Gateway & Security */}
          <div className="p-5 rounded-xl border border-amber-900/40 bg-slate-900/60 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Layer 2: Edge & Security Boundary
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Boundary B: DMZ / Ingress
              </span>
            </div>
            <div
              onClick={() => setActiveComponent(components[1])}
              className="cursor-pointer p-4 rounded-lg bg-slate-800/90 border border-amber-500/50 hover:border-amber-400 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Envoy Proxy & WAF Ingress Controller
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">mTLS Enabled</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    RS256 JWT Authentication, Token Bucket Rate Limiting, DDoS Mitigation & CORS Enforcement.
                  </div>
                </div>
                <Eye className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Connection Pipe */}
          <div className="flex items-center justify-center my-1">
            <div className="h-6 w-0.5 bg-gradient-to-b from-amber-500 to-indigo-500" />
          </div>

          {/* Layer 3: Agent Orchestration Engine */}
          <div className="p-5 rounded-xl border border-indigo-900/50 bg-slate-900/70 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Layer 3: Agent Orchestration Engine
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
                Boundary C: Private Agent VPC
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setActiveComponent(components[2])}
                className="cursor-pointer p-3.5 rounded-lg bg-slate-800/90 border border-indigo-500/40 hover:border-indigo-400 transition"
              >
                <div className="text-sm font-semibold text-white">Task Router & Multi-Agent Planner</div>
                <div className="text-xs text-slate-300 mt-1">Eisenhower dynamic matrix & LangGraph state machine</div>
                <div className="mt-2 text-[10px] text-indigo-300 font-mono">gRPC • Internal Only</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-800/70 border border-slate-700/70">
                <div className="text-sm font-semibold text-white">NeMo Guardrails & HITL Gate</div>
                <div className="text-xs text-slate-300 mt-1">Prompt injection filtering & P0 approval policy</div>
                <div className="mt-2 text-[10px] text-amber-300 font-mono">Zero Egress Policy</div>
              </div>
            </div>
          </div>

          {/* Connection Pipe */}
          <div className="flex items-center justify-center my-1">
            <div className="h-6 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500" />
          </div>

          {/* Layer 4: Sandboxed Tool Execution */}
          <div className="p-5 rounded-xl border border-purple-900/40 bg-slate-900/60 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                Layer 4: Sandboxed Tool Execution Cluster
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300">
                Boundary D: Isolated microVM Sandbox
              </span>
            </div>
            <div
              onClick={() => setActiveComponent(components[3])}
              className="cursor-pointer p-4 rounded-lg bg-slate-800/80 border border-purple-500/40 hover:border-purple-400 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Firecracker microVM / gVisor Execution Sandbox
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">eBPF Seccomp</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Secure ephemeral tool calls: GitHub Pull Request creation, Jira syncing, k6 benchmarks, and SQL analysis.
                  </div>
                </div>
                <Eye className="w-4 h-4 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Connection Pipe */}
          <div className="flex items-center justify-center my-1">
            <div className="h-6 w-0.5 bg-gradient-to-b from-purple-500 to-emerald-500" />
          </div>

          {/* Layer 5: Data & Telemetry */}
          <div className="p-5 rounded-xl border border-emerald-900/40 bg-slate-900/60 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Layer 5: Data & Telemetry Foundation
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Boundary E: Encrypted Data Plane
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setActiveComponent(components[4])}
                className="cursor-pointer p-3.5 rounded-lg bg-slate-800/80 border border-emerald-500/40 hover:border-emerald-400 transition"
              >
                <div className="text-sm font-semibold text-white">PostgreSQL + pgvector</div>
                <div className="text-xs text-slate-400 mt-1">ACID state & semantic vectors</div>
                <div className="mt-2 text-[10px] text-emerald-300 font-mono">CMEK AES-256 • RLS</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="text-sm font-semibold text-slate-200">Redis High-Speed Cache</div>
                <div className="text-xs text-slate-400 mt-1">Session tokens & rate limits</div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">In-Memory Cluster</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="text-sm font-semibold text-slate-200">OpenTelemetry & Tempo</div>
                <div className="text-xs text-slate-400 mt-1">Distributed tracing & FinOps</div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">Prometheus / W3C Trace</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Component Detail Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/80 sticky top-20">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Server className="w-4 h-4 text-indigo-400" />
              Component Inspector
            </h3>

            {activeComponent ? (
              <div className="mt-4 space-y-4 text-sm animate-fadeIn">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Name</span>
                  <div className="text-base font-bold text-indigo-300">{activeComponent.name}</div>
                  <div className="text-xs text-slate-400">{activeComponent.layer}</div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Trust Boundary</span>
                  <div className="mt-1 inline-block text-xs font-medium px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                    {activeComponent.trustBoundary}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Communication Protocol</span>
                  <div className="text-xs text-slate-300 font-mono mt-0.5">{activeComponent.protocol}</div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Function & Responsibility</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeComponent.description}</p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Security Controls</span>
                  <ul className="mt-1 space-y-1">
                    {activeComponent.securityControls.map((sec, idx) => (
                      <li key={idx} className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        {sec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">SLA Target</span>
                  <div className="text-xs text-amber-300 font-mono mt-0.5">{activeComponent.sla}</div>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Connected Integrations</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {activeComponent.integrationPoints.map((pt, idx) => (
                      <span key={idx} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center py-8 text-slate-500 text-xs">
                <Eye className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                Click any component in the blueprint to inspect trust boundaries, protocols, and security controls.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
