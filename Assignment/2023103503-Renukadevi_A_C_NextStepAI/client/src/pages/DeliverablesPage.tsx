import { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Cpu, 
  CloudUpload, 
  ShieldCheck, 
  BarChart3, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import Header from '../components/Header';

const DELIVERABLES = [
  {
    id: 1,
    title: 'Architecture Diagram',
    subtitle: 'Layers, components, trust boundaries and integrations',
    icon: Layers,
    color: 'text-electric-400 bg-electric-500/20 border-electric-500/30',
    summary: 'Multi-tiered enterprise topology spanning React 18 SPA, FastAPI Gateway, LangGraph State Engine, SQLAlchemy ORM, and Trust Boundaries 0 through 3.',
    highlights: [
      'Presentation Layer: Single Action UI, Pomodoro Timer, Stuck Resolution Modal',
      'Application Gateway: JWT Bearer Authenticator, RBAC Middleware, CORS policy',
      'Core Agent Engine: LangGraph State Machine with Topological Task Selection',
      'Persistence & Enclaves: Multi-tenant user isolation with SQLite/PostgreSQL'
    ],
    file: 'deliverables/1_ARCHITECTURE_DIAGRAM.md'
  },
  {
    id: 2,
    title: 'Agent Workflow Design',
    subtitle: 'Roles, states, tools, handoffs, approvals and failure paths',
    icon: Cpu,
    color: 'text-accent-purple bg-accent-purple/20 border-accent-purple/30',
    summary: 'Autonomous state machine executing: Goal -> Understand -> Plan -> Select Next Action -> Wait for Student -> Observe -> Replan -> Next Action.',
    highlights: [
      'Roles: Student (Human-in-the-Loop), Agent (Orchestrator), Admin (Governance)',
      'States: Idle, Analyzing, Planning, Selecting, Waiting, Observing, Replanning',
      'Human-in-the-Loop: Student reflection handoffs and stuck escalation triggers',
      'Failure Resilience: Circuit breakers for LLMs and fallback topological routing'
    ],
    file: 'deliverables/2_AGENT_WORKFLOW_DESIGN.md'
  },
  {
    id: 3,
    title: 'Deployment Strategy',
    subtitle: 'Runtime, scaling, resilience, environments and release',
    icon: CloudUpload,
    color: 'text-accent-green bg-accent-green/20 border-accent-green/30',
    summary: 'Cloud-native 12-factor deployment with multi-stage Docker builds, docker-compose orchestration, and rolling release pipelines.',
    highlights: [
      'Runtime: Stateless Python 3.11 ASGI (FastAPI) + React 18 Client',
      'Containerization: Multi-stage Dockerfile with automated health checks',
      'Scaling: Horizontal Pod Autoscaling with async event loops (<120MB RSS)',
      'Environment Matrix: Dev (SQLite), Staging, and Production (PostgreSQL CloudSQL)'
    ],
    file: 'deliverables/3_DEPLOYMENT_STRATEGY.md'
  },
  {
    id: 4,
    title: 'Security Model',
    subtitle: 'Identity, authorization, secrets, privacy, guardrails and audit',
    icon: ShieldCheck,
    color: 'text-accent-amber bg-accent-amber/20 border-accent-amber/30',
    summary: 'Zero Trust Security Model featuring BCrypt password hashing, HS256 JWT tokens, strict Student vs Admin RBAC, and data isolation.',
    highlights: [
      'Identity: BCrypt salting with length-extension attack mitigation',
      'RBAC: Student vs Admin privileges enforced with 403 Forbidden checks',
      'Data Privacy: Multi-tenant query isolation scoped by authenticated user_id',
      'Audit Forensics: Real-time AuditLog table tracking security-critical events'
    ],
    file: 'deliverables/4_SECURITY_MODEL.md'
  },
  {
    id: 5,
    title: 'Monitoring Dashboard Design',
    subtitle: 'Health, trace, quality, safety, cost and business outcomes',
    icon: BarChart3,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    summary: 'Comprehensive 6-pillar observability covering System Health, Execution Traces, Educational Quality, AI Safety, Cost Accounting, and Learner Outcomes.',
    highlights: [
      'Health: Uptime, ASGI lag, and DB connection pool telemetry',
      'Trace: Full auditability via the live Agent Activity Stream (/activity)',
      'Safety: Real-time RBAC violation alerts and prompt injection counters',
      'Business Outcomes: TTFA (<5m) and Active Goal Completion Rate (>70%)'
    ],
    file: 'deliverables/5_MONITORING_DASHBOARD_DESIGN.md'
  }
];

export default function DeliverablesPage() {
  const [selectedId, setSelectedId] = useState(1);
  const activeDeliverable = DELIVERABLES.find(d => d.id === selectedId) || DELIVERABLES[0];
  const Icon = activeDeliverable.icon;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Capstone Deliverables"
        subtitle="Five enterprise architecture artifacts demonstrating enterprise completeness"
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="card p-6 bg-gradient-to-r from-navy-800 via-navy-800/80 to-electric-500/10 border-electric-500/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="badge bg-electric-500/20 text-electric-400 border border-electric-500/30 text-[10px] font-bold uppercase mb-2">
                Scalable Enterprise Architecture
              </span>
              <h2 className="text-xl font-bold text-white">Capstone Deliverables Portfolio</h2>
              <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                Complete documentation artifacts structured for enterprise review, covering architecture, agent state machine workflows, deployment automation, security governance, and operational observability.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent-green animate-ping" />
              <span className="text-xs text-accent-green font-bold uppercase">5 / 5 Verified</span>
            </div>
          </div>
        </div>

        {/* 5 Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {DELIVERABLES.map((d) => {
            const isSelected = d.id === selectedId;
            const TabIcon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-electric-500/15 border-electric-500/50 shadow-lg shadow-electric-500/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-bold ${d.color}`}>
                    {d.id}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-electric-400" />}
                </div>
                <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{d.title}</h4>
                <p className="text-[10px] text-white/40 line-clamp-1">{d.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Artifact Detail View */}
        <div className="card p-6 border-white/10 space-y-5 animate-fade-in">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${activeDeliverable.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white/40">Artifact #{activeDeliverable.id}</span>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs font-mono text-electric-400">{activeDeliverable.file}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{activeDeliverable.title}</h3>
                <p className="text-xs text-white/50">{activeDeliverable.subtitle}</p>
              </div>
            </div>

            <div className="badge bg-accent-green/20 text-accent-green border border-accent-green/30 text-xs py-1 px-3">
              Full Markdown Ready
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Executive Summary</h4>
            <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
              {activeDeliverable.summary}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Architectural Highlights</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeDeliverable.highlights.map((h, i) => (
                <div key={i} className="p-3 rounded-lg bg-navy-900/60 border border-white/10 flex items-start gap-2.5 text-xs">
                  <span className="w-5 h-5 rounded-md bg-electric-500/20 text-electric-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="text-white/80">{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-white/60">
            <span>
              All complete markdown deliverables are located in the <code className="text-electric-300 font-mono">/deliverables</code> directory of this repository.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
