import React from 'react';
import { Layers, GitBranch, CloudUpload, ShieldCheck, Activity, ArrowRight, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { CapstoneDeliverableId } from '../../types';

interface CapstoneOverviewProps {
  onSelectDeliverable: (id: CapstoneDeliverableId) => void;
}

export const CapstoneOverview: React.FC<CapstoneOverviewProps> = ({ onSelectDeliverable }) => {
  const deliverables = [
    {
      id: 'architecture' as CapstoneDeliverableId,
      number: '1',
      title: 'Architecture Diagram',
      description: 'Layers, components, trust boundaries and integrations',
      icon: Layers,
      gradient: 'from-blue-600 to-indigo-600',
      tagColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      keyHighlights: ['5-Layer Enterprise Blueprint', 'Multi-VPC Trust Boundaries', 'Isolated Tool Sandbox', 'mTLS & Zero-Trust Ingress'],
      completeness: '100% Complete',
    },
    {
      id: 'workflow' as CapstoneDeliverableId,
      number: '2',
      title: 'Agent Workflow Design',
      description: 'Roles, states, tools, handoffs, approvals and failure paths',
      icon: GitBranch,
      gradient: 'from-purple-600 to-pink-600',
      tagColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
      keyHighlights: ['Multi-Agent State Machine', 'HITL Approval Gates', 'Tool Selection & Sandboxing', 'Failure & Fallback Escalation'],
      completeness: '100% Complete',
    },
    {
      id: 'deployment' as CapstoneDeliverableId,
      number: '3',
      title: 'Deployment Strategy',
      description: 'Runtime, scaling, resilience, environments and release',
      icon: CloudUpload,
      gradient: 'from-emerald-600 to-teal-600',
      tagColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      keyHighlights: ['Kubernetes & KEDA Autoscaling', 'Multi-Region DR (RTO < 5m)', 'Blue-Green Canary Releases', 'Dev / Staging / Prod Matrix'],
      completeness: '100% Complete',
    },
    {
      id: 'security' as CapstoneDeliverableId,
      number: '4',
      title: 'Security Model',
      description: 'Identity, authorization, secrets, privacy, guardrails and audit',
      icon: ShieldCheck,
      gradient: 'from-amber-600 to-orange-600',
      tagColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      keyHighlights: ['Granular RBAC Authorization', 'Vault Secrets & Envelope KMS', 'NeMo Prompt Injection Guardrails', 'Tamper-Evident SHA-256 Audit Trail'],
      completeness: '100% Complete',
    },
    {
      id: 'monitoring' as CapstoneDeliverableId,
      number: '5',
      title: 'Monitoring Dashboard Design',
      description: 'Health, trace, quality, safety, cost and business outcomes',
      icon: Activity,
      gradient: 'from-cyan-600 to-blue-600',
      tagColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      keyHighlights: ['OpenTelemetry Span Waterfall', 'Token FinOps & Model Spend', 'Guardrail Trigger Telemetry', 'Task Throughput & Cycle Time'],
      completeness: '100% Complete',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Slide-Inspired Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1226] via-[#101b3b] to-[#0a1024] p-8 sm:p-10 border border-indigo-900/40 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400 tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Enterprise Architecture Capstone
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase font-sans">
            Capstone Deliverables
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 font-light max-w-2xl">
            Five artifacts that demonstrate enterprise architecture completeness for scalable autonomous agentic solutions.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              All 5 Artifacts Fully Implemented
            </span>
            <span className="text-slate-500">•</span>
            <span>Target Platform: Enterprise Todo Agent</span>
            <span className="text-slate-500">•</span>
            <span>Architecture Standard: IEEE 42010 / TOGAF</span>
          </div>
        </div>
      </div>

      {/* Deliverable Cards Matching the User's Image */}
      <div className="space-y-4">
        {deliverables.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onSelectDeliverable(item.id)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 hover:bg-slate-900/90 transition-all duration-300 hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/10 p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-5">
                  {/* Number Badge from Slide */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {item.number}
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${item.tagColor} font-medium`}>
                        {item.completeness}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1 font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right Action & Tags */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="hidden lg:flex items-center gap-2">
                    {item.keyHighlights.slice(0, 2).map((highlight, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-800/80 text-slate-400 px-2 py-1 rounded border border-slate-700/50"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <button className="flex items-center gap-1.5 text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all">
                    Explore Artifact
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Banner echoing image footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Scalable Enterprise Architectural Deployments of Agentic AI Solutions</span>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span>Enterprise Todo Agent System</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-500">Doc Ref: ARCH-CAPSTONE-34</span>
        </div>
      </div>
    </div>
  );
};
