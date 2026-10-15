import React, { useState } from 'react';
import { 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Check, 
  X, 
  ArrowDown, 
  Cpu, 
  GitPullRequest, 
  Sparkles, 
  Wrench, 
  ShieldCheck, 
  MessageSquare,
  ChevronRight,
  Info
} from 'lucide-react';
import { WorkflowNode, TaskStatus } from '../../types/agent';
import { INITIAL_WORKFLOW_NODES } from '../../services/mockData';
import { Badge } from '../common/Badge';
import { NodeDetailModal } from './NodeDetailModal';

export const WorkflowView: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_WORKFLOW_NODES);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [simulationMode, setSimulationMode] = useState<'normal' | 'hitl' | 'failure'>('normal');

  const getNodeIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return <MessageSquare size={18} />;
      case 'Cpu': return <Cpu size={18} />;
      case 'GitPullRequest': return <GitPullRequest size={18} />;
      case 'Sparkles': return <Sparkles size={18} />;
      case 'Wrench': return <Wrench size={18} />;
      case 'ShieldCheck': return <ShieldCheck size={18} />;
      default: return <CheckCircle2 size={18} />;
    }
  };

  const runSimulation = async (mode: 'normal' | 'hitl' | 'failure' = 'normal') => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationMode(mode);

    // Reset all nodes to Pending
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'Pending' })));
    await delay(400);

    for (let i = 0; i < nodes.length; i++) {
      // Set current node to Running
      setNodes((prev) =>
        prev.map((n, idx) => (idx === i ? { ...n, status: 'Running' } : n))
      );
      await delay(700);

      // Check HITL scenario
      if (mode === 'hitl' && i === 4) { // Tool Execution node
        setNodes((prev) =>
          prev.map((n, idx) => (idx === i ? { ...n, status: 'Waiting for Approval' } : n))
        );
        setIsSimulating(false);
        return;
      }

      // Check Failure scenario
      if (mode === 'failure' && i === 3) { // Specialist node
        setNodes((prev) =>
          prev.map((n, idx) => (idx === i ? { ...n, status: 'Failed' } : n))
        );
        setIsSimulating(false);
        return;
      }

      // Complete current node
      setNodes((prev) =>
        prev.map((n, idx) => (idx === i ? { ...n, status: 'Completed' } : n))
      );
      await delay(300);
    }

    setIsSimulating(false);
  };

  const handleApproveApproval = () => {
    setNodes((prev) =>
      prev.map((n, idx) => (idx === 4 ? { ...n, status: 'Completed' } : n))
    );
    // Continue running remaining nodes
    continueRemainingFrom(5);
  };

  const handleRejectApproval = () => {
    setNodes((prev) =>
      prev.map((n, idx) => (idx === 4 ? { ...n, status: 'Failed' } : n))
    );
  };

  const continueRemainingFrom = async (startIdx: number) => {
    setIsSimulating(true);
    for (let i = startIdx; i < nodes.length; i++) {
      setNodes((prev) =>
        prev.map((n, idx) => (idx === i ? { ...n, status: 'Running' } : n))
      );
      await delay(700);
      setNodes((prev) =>
        prev.map((n, idx) => (idx === i ? { ...n, status: 'Completed' } : n))
      );
      await delay(300);
    }
    setIsSimulating(false);
  };

  const resetAll = () => {
    setNodes(INITIAL_WORKFLOW_NODES);
    setIsSimulating(false);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Controls bar */}
      <div className="enterprise-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge color="purple">Interactive Pipeline</Badge>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>State Graph v2.4</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginTop: '4px' }}>
            End-to-End Multi-Agent Workflow Execution
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            Linear Directed Acyclic Graph (DAG) demonstrating transitions from User Ingestion through Guardrail Verification.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-primary" 
            onClick={() => runSimulation('normal')}
            disabled={isSimulating}
          >
            <Play size={14} />
            <span>Simulate Full Flow</span>
          </button>

          <button 
            className="btn-secondary" 
            onClick={() => runSimulation('hitl')}
            disabled={isSimulating}
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#FBBF24' }}
          >
            <Clock size={14} />
            <span>Simulate HITL Approval</span>
          </button>

          <button 
            className="btn-secondary" 
            onClick={() => runSimulation('failure')}
            disabled={isSimulating}
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#F87171' }}
          >
            <AlertTriangle size={14} />
            <span>Simulate Failure Recovery</span>
          </button>

          <button 
            className="btn-secondary" 
            onClick={resetAll}
            disabled={isSimulating}
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Human Approval Alert Bar if node 4 is in waiting state */}
      {nodes.some((n) => n.status === 'Waiting for Approval') && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulse-glow 2.5s infinite ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#F59E0B" />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FBBF24' }}>
                Workflow Suspended: Waiting for Human-in-the-Loop Sign-off
              </div>
              <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                Node <strong style={{ color: '#F8FAFC' }}>Tool Execution</strong> is requesting authorization to invoke external microVM environment with dynamic credentials.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-primary" 
              style={{ background: '#10B981', padding: '6px 14px', fontSize: '12px' }}
              onClick={handleApproveApproval}
            >
              <Check size={14} /> Approve & Continue
            </button>
            <button 
              className="btn-secondary" 
              style={{ borderColor: '#EF4444', color: '#F87171', padding: '6px 14px', fontSize: '12px' }}
              onClick={handleRejectApproval}
            >
              <X size={14} /> Reject Execution
            </button>
          </div>
        </div>
      )}

      {/* Visual Workflow Pipeline Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '780px',
        width: '100%',
        margin: '0 auto',
        padding: '10px 0'
      }}>
        {nodes.map((node, index) => {
          const isSelected = selectedNode?.id === node.id;

          const statusColors: Record<string, string> = {
            Completed: '#10B981',
            Running: '#3B82F6',
            'Waiting for Approval': '#F59E0B',
            Pending: '#475569',
            Failed: '#EF4444'
          };

          const statusGlows: Record<string, string> = {
            Completed: '0 0 16px rgba(16, 185, 129, 0.25)',
            Running: '0 0 20px rgba(59, 130, 246, 0.4)',
            'Waiting for Approval': '0 0 20px rgba(245, 158, 11, 0.4)',
            Pending: 'none',
            Failed: '0 0 20px rgba(239, 68, 68, 0.4)'
          };

          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div 
                onClick={() => setSelectedNode(node)}
                style={{
                  width: '100%',
                  background: '#0E1424',
                  border: '1px solid',
                  borderColor: isSelected ? '#3B82F6' : statusColors[node.status] || '#1E293B',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: statusGlows[node.status] || 'var(--shadow-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Left: Icon + Labels */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: node.color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
                                node.color === 'purple' ? 'rgba(139, 92, 246, 0.15)' :
                                node.color === 'cyan' ? 'rgba(6, 182, 212, 0.15)' :
                                node.color === 'orange' ? 'rgba(245, 158, 11, 0.15)' :
                                'rgba(16, 185, 129, 0.15)',
                    color: node.color === 'blue' ? '#60A5FA' :
                           node.color === 'purple' ? '#A78BFA' :
                           node.color === 'cyan' ? '#22D3EE' :
                           node.color === 'orange' ? '#FBBF24' :
                           '#34D399',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {getNodeIcon(node.icon)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                        {node.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                        Step {index + 1}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                      {node.sublabel}
                    </div>
                  </div>
                </div>

                {/* Right: Status badge & Click to inspect */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {node.model && (
                    <span style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                      {node.model}
                    </span>
                  )}

                  <Badge color={
                    node.status === 'Completed' ? 'green' :
                    node.status === 'Running' ? 'blue' :
                    node.status === 'Waiting for Approval' ? 'orange' :
                    node.status === 'Failed' ? 'red' : 'gray'
                  }>
                    {node.status === 'Running' && <span className="status-dot status-dot-blue animate-pulse-glow" style={{ marginRight: '4px' }}></span>}
                    {node.status}
                  </Badge>

                  <div style={{
                    fontSize: '11px',
                    color: '#60A5FA',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <span>Inspect</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>

              {/* Connecting Down Arrow */}
              {index < nodes.length - 1 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '2px 0'
                }}>
                  <div style={{
                    width: '2px',
                    height: '14px',
                    backgroundColor: nodes[index].status === 'Completed' ? '#10B981' : '#334155'
                  }} />
                  <ArrowDown 
                    size={16} 
                    color={nodes[index].status === 'Completed' ? '#10B981' : '#475569'} 
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Node Detail Modal */}
      {selectedNode && (
        <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

    </div>
  );
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
