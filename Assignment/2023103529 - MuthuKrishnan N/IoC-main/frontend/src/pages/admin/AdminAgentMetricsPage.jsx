import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  Bot,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BookOpen,
  Search,
  Scale,
  ShieldCheck,
  Activity
} from 'lucide-react';

const AGENT_ICONS = {
  SupervisorAgent: ShieldCheck,
  IntentAgent: Cpu,
  OrderAgent: Search,
  PolicyAgent: BookOpen,
  ResolutionAgent: Scale,
  ActionAgent: Zap,
};

const AGENT_DESCRIPTIONS = {
  SupervisorAgent: 'Coordinates state transitions, enforces timeout budgets, handles sub-agent failures, and ensures compliance.',
  IntentAgent: 'Zero-shot and NLP classification of complaint intent, sentiment intensity, and urgency tier.',
  OrderAgent: 'Executes verified database lookups to check purchase date, warranty window, delivery state, and ownership boundaries.',
  PolicyAgent: 'Vector search retriever connecting to ChromaDB to retrieve governing company policy chunks and citations.',
  ResolutionAgent: 'Synthesizes order data and policy clauses to formulate a compliant resolution and check HITL thresholds.',
  ActionAgent: 'Dispatches business tool invocations (refund, replacement, support ticket) and enqueues human approvals.'
};

export const AdminAgentMetricsPage = () => {
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const data = await adminApi.getAgentMetrics();
      setAgentMetrics(data);
    } catch (err) {
      console.error('Failed to load agent telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="dashboard-content">
      <div className="page-header-row">
        <div>
          <h2>Multi-Agent Fleet Telemetry</h2>
          <p className="page-header-sub">
            Real-time execution latency, reliability rates, and invocation frequency per specialized agent.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state full-height">
          <Bot size={36} className="animate-spin text-primary" />
          <p>Compiling agent fleet telemetry...</p>
        </div>
      ) : (
        <div className="agent-cards-grid">
          {agentMetrics.map((agent) => {
            const Icon = AGENT_ICONS[agent.agent_name] || Bot;
            const desc = AGENT_DESCRIPTIONS[agent.agent_name] || 'Autonomous enterprise agent component.';

            return (
              <div key={agent.agent_name} className="agent-telemetry-card">
                <div className="agent-card-header">
                  <div className="agent-title-box">
                    <div className="agent-icon-box">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="agent-name-heading">{agent.agent_name}</h3>
                      <span className="agent-sub-badge">Specialized Worker</span>
                    </div>
                  </div>
                  <span className="badge-agent-status status-active">Online</span>
                </div>

                <p className="agent-desc-text">{desc}</p>

                <div className="agent-metrics-row-grid">
                  <div className="agent-stat-box">
                    <span className="stat-title">Invocations</span>
                    <span className="stat-val font-semibold">{agent.invocations}</span>
                  </div>

                  <div className="agent-stat-box">
                    <span className="stat-title">Success Rate</span>
                    <span className="stat-val text-success font-semibold">{agent.success_rate}%</span>
                  </div>

                  <div className="agent-stat-box">
                    <span className="stat-title">Avg Latency</span>
                    <span className="stat-val font-mono">{agent.avg_duration_ms} ms</span>
                  </div>

                  <div className="agent-stat-box">
                    <span className="stat-title">Last Status</span>
                    <span className="stat-val font-mono text-primary text-xs">{agent.last_status}</span>
                  </div>
                </div>

                {/* Simulated Latency / Reliability Health Bar */}
                <div className="agent-health-bar-container">
                  <div className="health-bar-label">
                    <span>Reliability Index</span>
                    <span>{agent.success_rate}%</span>
                  </div>
                  <div className="health-bar-track">
                    <div
                      className="health-bar-fill"
                      style={{ width: `${agent.success_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
