import React, { useState } from 'react';
import { CloudUpload, Server, Cpu, RefreshCw, GitCommit, CheckCircle2, Shield, AlertCircle, HardDrive, Zap } from 'lucide-react';

export const DeploymentStrategy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'runtime' | 'scaling' | 'resilience' | 'environments' | 'release'>('runtime');

  const environments = [
    {
      name: 'Development (Dev)',
      cluster: 'k8s-dev-cluster',
      region: 'us-central1-a',
      nodes: '3 x e2-standard-4',
      database: 'Postgres Dev Sandbox (Ephemeral)',
      secrets: 'Vault Dev Engine (Mocked)',
      traffic: 'Internal Engineers & Agent CI',
    },
    {
      name: 'Staging (UAT / Preview)',
      cluster: 'k8s-staging-cluster',
      region: 'us-central1-b',
      nodes: '6 x e2-standard-8 (Auto-scaling)',
      database: 'Postgres Cloud SQL (Sanitized Clone)',
      secrets: 'Vault Staging Secrets Engine',
      traffic: 'Automated E2E & Chaos Tests',
    },
    {
      name: 'Production (Live Multi-Region)',
      cluster: 'k8s-prod-primary & secondary',
      region: 'us-central1 (Primary) / us-east4 (DR)',
      nodes: 'Dynamic 12 - 120 Nodes (KEDA Autoscaled)',
      database: 'Cloud SQL HA + pgvector (Cross-Region Sync)',
      secrets: 'HashiCorp Vault Enterprise + CMEK KMS',
      traffic: 'Global Production Ingress (mTLS 1.3)',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-1">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
            Deliverable 3 • Infrastructure & Operations
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Enterprise Deployment Strategy
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Kubernetes runtime architecture, KEDA event-driven auto-scaling, multi-region disaster recovery, and GitOps canary releases.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {[
            { id: 'runtime', label: 'Runtime & K8s' },
            { id: 'scaling', label: 'KEDA Scaling' },
            { id: 'resilience', label: 'Multi-Region DR' },
            { id: 'environments', label: 'Env Matrix' },
            { id: 'release', label: 'Canary Release' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'runtime' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Kubernetes Core Runtime</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Orchestrated on Google Kubernetes Engine (GKE Enterprise) with Containerd and Cilium eBPF mesh for high-throughput packet routing.
            </p>
            <div className="space-y-2 text-xs font-mono text-emerald-400 pt-2 border-t border-slate-800">
              <div>• Pod Disruption Budgets (minAvailable: 80%)</div>
              <div>• Node Affinity: Dedicated Agent Compute Nodes</div>
              <div>• NetworkPolicy: Default Deny All Egress</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">MicroVM Tool Sandbox Workers</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Untrusted task executions spin up in isolated Firecracker microVMs with &lt;5ms boot times, hardware virtualization (KVM), and read-only rootfs.
            </p>
            <div className="space-y-2 text-xs font-mono text-blue-400 pt-2 border-t border-slate-800">
              <div>• Memory Limit: 512MB per execution sandbox</div>
              <div>• CPU Quota: 1.0 vCPU hard throttled</div>
              <div>• Max Execution Window: 60s hard timeout</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">State & Cache Ingress</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              PostgreSQL HA cluster with PgBouncer connection pooling, Redis 7 cluster for real-time task queues and rate limiting.
            </p>
            <div className="space-y-2 text-xs font-mono text-purple-400 pt-2 border-t border-slate-800">
              <div>• Max Connection Pool: 2,500 active threads</div>
              <div>• Sub-millisecond Redis cache retrieval</div>
              <div>• Automatic failover in &lt;15 seconds</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scaling' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                KEDA Event-Driven Autoscaling (Queue Lag & SLA Trigger)
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Unlike standard CPU-only HPA, KEDA reacts instantaneously to incoming task queue depth and p95 inference latency.
              </p>
            </div>
            <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
              Autoscale Range: 2 → 120 Pods
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 font-medium uppercase tracking-wider">Trigger 1: Redis Queue Depth</div>
              <div className="text-2xl font-bold text-white mt-1">5 Tasks / Pod</div>
              <div className="text-slate-400 mt-2">When backlog &gt; 5 tasks per active pod, scale out 3 additional worker pods immediately.</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 font-medium uppercase tracking-wider">Trigger 2: Inference p95 Latency</div>
              <div className="text-2xl font-bold text-white mt-1">&gt; 350ms</div>
              <div className="text-slate-400 mt-2">When p95 latency spikes over 350ms for 2 consecutive minutes, spawn parallel agent planners.</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 font-medium uppercase tracking-wider">Trigger 3: Cool-Down Window</div>
              <div className="text-2xl font-bold text-white mt-1">300 Seconds</div>
              <div className="text-slate-400 mt-2">Scale-in stabilization window prevents pod thrashing during intermittent burst traffic.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resilience' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Multi-Region Active-Passive Disaster Recovery
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Zero data loss architecture with automated DNS health-checking and regional failover.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-mono">RTO &lt; 5 min</span>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono">RPO &lt; 1 min</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Primary Region: us-central1 (Iowa)</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Active</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 font-mono">
                <div>• Ingress: 100% User & Agent Traffic</div>
                <div>• Cloud SQL: Read/Write Master Instance</div>
                <div>• Agent Cluster: 24 Replicas Active</div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-700 bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">DR Standby: us-east4 (N. Virginia)</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Hot Standby</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 font-mono">
                <div>• Ingress: Synthetic Health Checks Only</div>
                <div>• Cloud SQL: Cross-Region Streaming Replica</div>
                <div>• Agent Cluster: 4 Replicas Idle (Scales in 90s)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'environments' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">Environment</th>
                  <th className="p-3.5">Cluster & Region</th>
                  <th className="p-3.5">Compute Nodes</th>
                  <th className="p-3.5">Database Tier</th>
                  <th className="p-3.5">Secrets Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {environments.map((env, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-white font-sans">{env.name}</td>
                    <td className="p-3.5 text-indigo-300">{env.region}</td>
                    <td className="p-3.5 text-slate-300">{env.nodes}</td>
                    <td className="p-3.5 text-emerald-300">{env.database}</td>
                    <td className="p-3.5 text-amber-300">{env.secrets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'release' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-emerald-400" />
                GitOps Blue-Green Canary Release Pipeline
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Automated progressive rollouts with automated rollback if synthetic error budget is breached.
              </p>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-md font-mono">
              Powered by ArgoCD & Flagger
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="font-mono text-emerald-400 text-[10px]">STAGE 1</span>
              <div className="font-bold text-white text-sm mt-1">10% Canary Traffic</div>
              <div className="text-slate-400 mt-2">Routes 10% of agent tasks to new release container. Monitored for 15 minutes.</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="font-mono text-emerald-400 text-[10px]">STAGE 2</span>
              <div className="font-bold text-white text-sm mt-1">SLO Metric Probe</div>
              <div className="text-slate-400 mt-2">Prometheus checks: HTTP 5xx &lt; 0.01% and p95 latency &lt; 200ms.</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="font-mono text-emerald-400 text-[10px]">STAGE 3</span>
              <div className="font-bold text-white text-sm mt-1">50% Progressive Scale</div>
              <div className="text-slate-400 mt-2">Scale up new replica set, drain legacy pods gracefully with 30s connection window.</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="font-mono text-emerald-400 text-[10px]">STAGE 4</span>
              <div className="font-bold text-white text-sm mt-1">100% Full Promotion</div>
              <div className="text-slate-400 mt-2">Blue is promoted to Green. Legacy image retained for 1-click instant rollback.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
