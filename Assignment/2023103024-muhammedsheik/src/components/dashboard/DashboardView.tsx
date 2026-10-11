import React from 'react';
import { 
  Bot, 
  Activity, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Layers,
  Cpu,
  TrendingUp,
  Server
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { NavigationTab } from '../../types/agent';
import { EXAMPLE_PROMPTS, TRACE_ITEMS_DATA } from '../../services/mockData';

interface DashboardViewProps {
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectPrompt: (promptText: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onSelectPrompt }) => {
  // Chart hourly data points
  const hourlyData = [
    { hour: '00:00', requests: 420, latency: 1.1 },
    { hour: '03:00', requests: 310, latency: 0.9 },
    { hour: '06:00', requests: 780, latency: 1.2 },
    { hour: '09:00', requests: 2450, latency: 1.4 },
    { hour: '12:00', requests: 3120, latency: 1.3 },
    { hour: '15:00', requests: 2890, latency: 1.25 },
    { hour: '18:00', requests: 1940, latency: 1.15 },
    { hour: '21:00', requests: 1220, latency: 1.05 }
  ];

  const maxRequests = 3500;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner: Enterprise Welcome & System Status */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid #1E293B',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Badge color="blue" icon={<Cpu size={12} />}>Enterprise Architecture</Badge>
            <Badge color="green" icon={<CheckCircle2 size={12} />}>System Operational</Badge>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>Cluster: k8s-us-east-1</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginTop: '4px' }}>
            Autonomous Multi-Agent Orchestration Platform
          </h2>
          <p style={{ fontSize: '13.5px', color: '#94A3B8', lineHeight: 1.6 }}>
            Enterprise-ready agentic infrastructure featuring ReAct reasoning loops, dynamic planning DAGs, 
            isolated tool execution sandboxes, and NeMo/Llama-Guard security boundaries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-primary"
            onClick={() => onNavigateTab('assistant')}
          >
            <Play size={15} />
            <span>Launch Task Assistant</span>
          </button>
          <button 
            className="btn-secondary"
            onClick={() => onNavigateTab('workflow')}
          >
            <Layers size={15} />
            <span>View Live Workflow</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Total Requests Processed"
          value="142,890"
          change="14.2% vs last week"
          subtitle="Peak 48 req/sec at 12:00 UTC"
          icon={<Bot size={20} />}
          color="blue"
        />
        <StatCard
          title="Overall Success Rate"
          value="99.2%"
          change="0.4% SLA adherence"
          subtitle="Failed: 0.8% (Handled via retries)"
          icon={<CheckCircle2 size={20} />}
          color="green"
        />
        <StatCard
          title="Avg End-to-End Latency"
          value="1.18s"
          change="74ms faster"
          subtitle="p95: 1.45s | p99: 2.10s"
          icon={<Clock size={20} />}
          color="cyan"
        />
        <StatCard
          title="Daily AI Token Spend"
          value="$48.20"
          change="12% cost efficiency"
          subtitle="Saved 140+ hours manual labor"
          icon={<DollarSign size={20} />}
          color="purple"
        />
        <StatCard
          title="Security Interceptions"
          value="142"
          change="100% blocked"
          subtitle="Prompt injection & PII masked"
          icon={<ShieldCheck size={20} />}
          color="orange"
        />
      </div>

      {/* Grid: Throughput Chart + Agent Fleet Matrix */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '20px'
      }}>
        
        {/* Interactive Throughput Chart */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                Hourly Request Throughput & Latency Trend
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B' }}>
                24-Hour telemetry aggregated across all specialist workers
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#3B82F6' }}></span>
                Volume (Requests)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#06B6D4' }}></span>
                Avg Latency (sec)
              </div>
            </div>
          </div>

          {/* SVG Bar / Area Chart */}
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '16px 0 0', borderBottom: '1px solid #1E293B' }}>
            {hourlyData.map((d, i) => {
              const heightPct = (d.requests / maxRequests) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {d.requests}
                  </div>
                  <div 
                    title={`${d.hour}: ${d.requests} requests, ${d.latency}s latency`}
                    style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(180deg, #3B82F6 0%, rgba(59, 130, 246, 0.25) 100%)',
                      borderRadius: '6px 6px 0 0',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'brightness(1.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>{d.hour}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#94A3B8' }}>
            <span>99.99% Availability across AWS us-east-1 and us-west-2</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>Zero Service Level Breaches</span>
          </div>
        </div>

        {/* Agent Fleet Health Matrix */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                Active Agent Fleet
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B' }}>5 / 5 Core Nodes Online</p>
            </div>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => onNavigateTab('workflow')}
            >
              Inspect DAG
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'Orchestrator Agent', role: 'Context Routing', model: 'Claude 3.5 Sonnet', uptime: '99.98%', color: 'blue' },
              { name: 'Reasoning Planner', role: 'DAG Synthesis', model: 'O3-Mini CoT', uptime: '99.95%', color: 'purple' },
              { name: 'Domain Specialist', role: 'Cloud/DB Analysis', model: 'Fine-tuned 70B', uptime: '99.85%', color: 'cyan' },
              { name: 'Tool Sandbox Runtime', role: 'MicroVM Isolation', model: 'gVisor Kernel', uptime: '99.40%', color: 'orange' },
              { name: 'Security Guardrail', role: 'LlamaGuard + PII', model: 'NeMo Guard v2', uptime: '100.0%', color: 'green' },
            ].map((agent, i) => (
              <div 
                key={i} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#0B0F19',
                  border: '1px solid #1E293B'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`status-dot status-dot-${agent.color}`}></span>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#F1F5F9' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {agent.model}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
                    {agent.uptime}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                    {agent.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Quick Run Examples & Recent Trace History */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        
        {/* Quick Example Scenarios */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
              Example Enterprise Tasks
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B' }}>
              Click any scenario to load and execute it inside the Agent Assistant
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <div 
                key={i}
                onClick={() => {
                  onSelectPrompt(ex.prompt);
                  onNavigateTab('assistant');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#0B0F19',
                  border: '1px solid #1E293B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.backgroundColor = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1E293B';
                  e.currentTarget.style.backgroundColor = '#0B0F19';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
                      {ex.title}
                    </span>
                    <Badge color="blue">{ex.role}</Badge>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#94A3B8', lineBreak: 'anywhere' }}>
                    {ex.prompt.length > 95 ? ex.prompt.substring(0, 95) + '...' : ex.prompt}
                  </p>
                </div>
                <ArrowRight size={16} color="#3B82F6" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Traces Feed */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                Recent Execution Traces
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B' }}>
                Live audit trail across multi-tenant execution
              </p>
            </div>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => onNavigateTab('monitoring')}
            >
              Full Trace View
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TRACE_ITEMS_DATA.map((tr) => (
              <div 
                key={tr.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#0B0F19',
                  border: '1px solid #1E293B'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>
                      {tr.traceId}
                    </span>
                    <Badge color={tr.status === 'Completed' ? 'green' : 'red'}>
                      {tr.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>
                    {tr.taskTitle}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {tr.timestamp} • Tenant: {tr.tenant}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC', fontFamily: 'var(--font-mono)' }}>
                    {tr.durationMs}ms
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {tr.tokens.toLocaleString()} tokens
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
