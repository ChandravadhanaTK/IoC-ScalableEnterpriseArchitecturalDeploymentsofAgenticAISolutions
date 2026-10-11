import React, { useState } from 'react';
import { 
  Activity, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  TrendingUp, 
  Cpu, 
  Eye, 
  Search,
  Filter,
  BarChart3,
  PieChart
} from 'lucide-react';
import { TRACE_ITEMS_DATA } from '../../services/mockData';
import { TraceItem, AgentRole } from '../../types/agent';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { TraceWaterfallModal } from './TraceWaterfallModal';

export const MonitoringView: React.FC = () => {
  const [selectedTrace, setSelectedTrace] = useState<TraceItem | null>(null);
  const [traceFilter, setTraceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTraces = TRACE_ITEMS_DATA.filter((tr) => {
    const matchesFilter = traceFilter === 'all' || tr.status.toLowerCase() === traceFilter.toLowerCase();
    const matchesSearch = tr.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tr.traceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tr.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div className="enterprise-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge color="blue">OpenTelemetry & Prometheus</Badge>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>Collector: otel-collector:4317</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginTop: '4px' }}>
            Fleet Observability, Traces & Financial Engineering
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            Full-stack distributed tracing, real-time token unit economics, business impact metrics, and guardrail telemetry.
          </p>
        </div>
      </div>

      {/* KPI Cards Row (9 Required Metrics) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Agent Health Status"
          value="100%"
          change="5/5 Nodes Up"
          subtitle="Zero degraded workers"
          icon={<Bot size={20} />}
          color="green"
        />
        <StatCard
          title="Total Requests"
          value="142,890"
          change="14.2% growth"
          subtitle="Avg 28.4 TPS today"
          icon={<Activity size={20} />}
          color="blue"
        />
        <StatCard
          title="Execution Success Rate"
          value="99.2%"
          change="+0.3% vs SLA"
          subtitle="Auto-retry rescued 94 tasks"
          icon={<CheckCircle2 size={20} />}
          color="green"
        />
        <StatCard
          title="Average Response Time"
          value="1.18s"
          change="74ms faster"
          subtitle="p50: 890ms | p99: 2.1s"
          icon={<Clock size={20} />}
          color="cyan"
        />
        <StatCard
          title="Token / AI Cost Estimate"
          value="$48.20"
          change="$0.00034 / req"
          subtitle="3.8M tokens consumed today"
          icon={<DollarSign size={20} />}
          color="purple"
        />
        <StatCard
          title="Failed Tasks (24h)"
          value="18"
          isPositive={false}
          change="0.8% failure"
          subtitle="12 sandbox timeouts, 6 rate limits"
          icon={<AlertTriangle size={20} />}
          color="orange"
        />
        <StatCard
          title="Safety / Guardrail Events"
          value="142"
          change="100% mitigated"
          subtitle="112 injections, 30 PII masks"
          icon={<ShieldCheck size={20} />}
          color="orange"
        />
        <StatCard
          title="Business Outcome Metric"
          value="92.4%"
          change="ROI: 8.4x"
          subtitle="1,240 human engineering hrs saved"
          icon={<TrendingUp size={20} />}
          color="green"
        />
      </div>

      {/* Visual Charts: Token Consumption Distribution & Latency Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        
        {/* Token Consumption by Agent */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                Token Expenditure by Agent Role
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B' }}>
                Cost breakdown across reasoning stages
              </p>
            </div>
            <Badge color="purple">3.8M Tokens Total</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { agent: 'Orchestrator Agent (Claude 3.5)', pct: 28, tokens: '1,064,000', cost: '$13.50', color: '#3B82F6' },
              { agent: 'Planner (O3-Mini CoT)', pct: 36, tokens: '1,368,000', cost: '$18.20', color: '#8B5CF6' },
              { agent: 'Domain Specialist (Fine-tuned 70B)', pct: 24, tokens: '912,000', cost: '$11.80', color: '#06B6D4' },
              { agent: 'Security Validator (Llama Guard 3)', pct: 12, tokens: '456,000', cost: '$4.70', color: '#10B981' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{item.agent}</span>
                  <div style={{ display: 'flex', gap: '12px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#94A3B8' }}>{item.tokens}</span>
                    <strong style={{ color: '#10B981' }}>{item.cost}</strong>
                  </div>
                </div>
                <div style={{ height: '6px', backgroundColor: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latency Distribution Breakdown */}
        <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                Latency SLA Percentile Breakdown
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B' }}>
                End-to-end task completion response distribution
              </p>
            </div>
            <Badge color="cyan">Target: &lt; 2.50s</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '4px' }}>
            <div style={{ background: '#0B0F19', padding: '14px', borderRadius: '8px', border: '1px solid #1E293B', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>p50 (Median)</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#34D399', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                890ms
              </div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>50% under 0.9s</div>
            </div>

            <div style={{ background: '#0B0F19', padding: '14px', borderRadius: '8px', border: '1px solid #1E293B', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>p95 (High Load)</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#60A5FA', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                1,450ms
              </div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>95% under 1.5s</div>
            </div>

            <div style={{ background: '#0B0F19', padding: '14px', borderRadius: '8px', border: '1px solid #1E293B', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>p99 (Outliers)</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#FBBF24', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                2,100ms
              </div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>99% under 2.1s</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '11.5px',
            color: '#A7F3D0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>All latency percentiles currently conform to enterprise Tier-1 SLA parameters.</span>
          </div>
        </div>

      </div>

      {/* Trace Execution History Table */}
      <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
              Task Execution & Distributed Trace History
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B' }}>
              Click any execution row to open its interactive OpenTelemetry span waterfall
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search traces..."
              style={{
                backgroundColor: '#0B0F19',
                border: '1px solid #1E293B',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                color: '#F8FAFC',
                outline: 'none',
                width: '200px'
              }}
            />

            <select
              value={traceFilter}
              onChange={(e) => setTraceFilter(e.target.value)}
              style={{
                backgroundColor: '#0B0F19',
                border: '1px solid #1E293B',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                color: '#F8FAFC',
                outline: 'none'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="blocked">Blocked / Intercepted</option>
            </select>
          </div>
        </div>

        {/* Traces Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B', color: '#64748B' }}>
                <th style={{ padding: '10px 12px' }}>Trace ID</th>
                <th style={{ padding: '10px 12px' }}>Task Title</th>
                <th style={{ padding: '10px 12px' }}>Tenant</th>
                <th style={{ padding: '10px 12px' }}>Participating Agents</th>
                <th style={{ padding: '10px 12px' }}>Duration</th>
                <th style={{ padding: '10px 12px' }}>Tokens</th>
                <th style={{ padding: '10px 12px' }}>Cost</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTraces.map((tr) => (
                <tr
                  key={tr.id}
                  onClick={() => setSelectedTrace(tr)}
                  style={{
                    borderBottom: '1px solid #1E293B',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0E1424'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#3B82F6', fontWeight: 600 }}>
                    {tr.traceId}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#F1F5F9' }}>
                    {tr.taskTitle}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#94A3B8' }}>
                    {tr.tenant}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {tr.agents.slice(0, 3).map((ag, i) => (
                        <span key={i} style={{ fontSize: '10px', background: '#1E293B', padding: '1px 5px', borderRadius: '4px', color: '#CBD5E1' }}>
                          {ag}
                        </span>
                      ))}
                      {tr.agents.length > 3 && (
                        <span style={{ fontSize: '10px', color: '#64748B' }}>+{tr.agents.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#E2E8F0' }}>
                    {tr.durationMs}ms
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
                    {tr.tokens.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#10B981' }}>
                    ${tr.costUsd.toFixed(4)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge color={tr.status === 'Completed' ? 'green' : 'red'}>
                      {tr.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: '11px', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={13} /> View Spans
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waterfall Modal */}
      {selectedTrace && (
        <TraceWaterfallModal trace={selectedTrace} onClose={() => setSelectedTrace(null)} />
      )}

    </div>
  );
};
