import React, { useState } from 'react';
import { 
  Server, 
  Cpu, 
  GitBranch, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  ArrowRight,
  Terminal,
  Zap,
  Globe
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const DeploymentView: React.FC = () => {
  const [activeEnv, setActiveEnv] = useState<'production' | 'testing' | 'development'>('production');
  const [canaryPercentage, setCanaryPercentage] = useState(15);
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromoteCanary = () => {
    setIsPromoting(true);
    setTimeout(() => {
      setCanaryPercentage((prev) => (prev >= 100 ? 10 : Math.min(prev + 25, 100)));
      setIsPromoting(false);
    }, 600);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="enterprise-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge color="blue">Kubernetes Fleet</Badge>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>Cluster: k8s-ai-fleet-prod</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginTop: '4px' }}>
            Deployment, Runtime & Scaling Infrastructure
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            Multi-region container topology with automated canary rollouts, resilient circuit breakers, and zero-downtime scaling.
          </p>
        </div>

        {/* Environment toggle */}
        <div style={{ display: 'flex', background: '#0B0F19', padding: '4px', borderRadius: '8px', border: '1px solid #1E293B' }}>
          {(['development', 'testing', 'production'] as const).map((env) => (
            <button
              key={env}
              onClick={() => setActiveEnv(env)}
              style={{
                background: activeEnv === env ? '#3B82F6' : 'transparent',
                color: activeEnv === env ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease'
              }}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Environments Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        {/* Development */}
        <div className="enterprise-card" style={{ borderColor: activeEnv === 'development' ? '#3B82F6' : '#1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Development</span>
            <Badge color="cyan">Local / Minikube</Badge>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6 }}>
            <div>• Hot-reload local agent runner</div>
            <div>• Mock LLM & sandbox container</div>
            <div>• Port: <code style={{ color: '#60A5FA' }}>localhost:5173 / 8080</code></div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="status-dot status-dot-green"></span> 1 Node Active (Localhost)
          </div>
        </div>

        {/* Testing */}
        <div className="enterprise-card" style={{ borderColor: activeEnv === 'testing' ? '#3B82F6' : '#1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Testing & Eval</span>
            <Badge color="purple">Automated CI/CD</Badge>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6 }}>
            <div>• MMLU & Custom Agent Evals</div>
            <div>• Automated red-teaming scans</div>
            <div>• Synthesized benchmark testbed</div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="status-dot status-dot-green"></span> 3 Replica Pods (Evals Passing)
          </div>
        </div>

        {/* Production */}
        <div className="enterprise-card" style={{ borderColor: activeEnv === 'production' ? '#3B82F6' : '#1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Production</span>
            <Badge color="green">High Availability</Badge>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6 }}>
            <div>• Multi-region AWS (us-east-1, eu-west-1)</div>
            <div>• Autoscaling HPA: 12 - 48 Pods</div>
            <div>• 99.99% SLA Enterprise Target</div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="status-dot status-dot-green"></span> 24 Pods Healthy across 2 Regions
          </div>
        </div>
      </div>

      {/* Release Flow CI/CD Pipeline Visualizer */}
      <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
              Autonomous Release & Canary Deployment Flow
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B' }}>
              Automated promotion gate with evaluation metrics and continuous canary monitoring
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              Canary Traffic: <strong style={{ color: '#3B82F6' }}>{canaryPercentage}%</strong>
            </div>
            <button 
              className="btn-primary"
              onClick={handlePromoteCanary}
              disabled={isPromoting}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              {isPromoting ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
              <span>{canaryPercentage >= 100 ? 'Reset Canary Cycle' : 'Step Canary (+25%)'}</span>
            </button>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          alignItems: 'center'
        }}>
          {[
            { step: '1. Lint & Build', desc: 'TypeScript & Docker build', time: '1m 12s', status: 'Passed' },
            { step: '2. Safety Benchmark', desc: 'NeMo Guardrail test suite', time: '3m 45s', status: 'Passed' },
            { step: '3. Agent Eval Gate', desc: '400 mock reasoning tasks', time: '5m 20s', status: 'Passed' },
            { step: '4. Canary Deployment', desc: `${canaryPercentage}% traffic split`, time: 'Live', status: canaryPercentage >= 100 ? 'Passed' : 'In Progress' },
            { step: '5. Global Rollout', desc: '100% production traffic', time: 'Pending', status: canaryPercentage >= 100 ? 'Completed' : 'Pending' }
          ].map((stage, idx) => (
            <div
              key={idx}
              style={{
                background: '#0B0F19',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>{stage.step}</span>
                <Badge color={stage.status === 'Passed' || stage.status === 'Completed' ? 'green' : stage.status === 'In Progress' ? 'blue' : 'gray'}>
                  {stage.status}
                </Badge>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>{stage.desc}</div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>Duration: {stage.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Scaling, Resilience & Health Checks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px'
      }}>
        {/* Scaling */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#3B82F6" />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Autoscaling & Concurrency</h4>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>Target CPU Utilization:</span>
              <strong style={{ color: '#F1F5F9' }}>75% HPA Trigger</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>Queue Backlog Max:</span>
              <strong style={{ color: '#F1F5F9' }}>500 pending tasks</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>Max Worker Concurrency:</span>
              <strong style={{ color: '#F1F5F9' }}>128 simultaneous runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>Scale-down Grace Period:</span>
              <strong style={{ color: '#F1F5F9' }}>300 seconds</strong>
            </div>
          </div>
        </div>

        {/* Resilience & Circuit Breaker */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#10B981" />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Fault Tolerance & Fallback</h4>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>Primary Model Route:</span>
              <strong style={{ color: '#60A5FA' }}>Claude 3.5 Sonnet (Tier 1)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>Automated Failover:</span>
              <strong style={{ color: '#A78BFA' }}>GPT-4o Enterprise (Tier 2)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>Air-Gapped Offline Node:</span>
              <strong style={{ color: '#22D3EE' }}>vLLM Llama 3 70B (Tier 3)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>Retry Policy:</span>
              <strong style={{ color: '#F1F5F9' }}>Exponential backoff (3x)</strong>
            </div>
          </div>
        </div>

        {/* Health Checks */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#06B6D4" />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Probes & Health Pings</h4>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>/healthz/liveness:</span>
              <Badge color="green">HTTP 200 OK (2ms)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>/healthz/readiness:</span>
              <Badge color="green">Ready (Model Pool Active)</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1E293B' }}>
              <span>Vector DB Ping:</span>
              <Badge color="green">pgvector: 3.1ms</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>Tool Sandbox Host:</span>
              <Badge color="green">gVisor MicroVMs: Ready</Badge>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
