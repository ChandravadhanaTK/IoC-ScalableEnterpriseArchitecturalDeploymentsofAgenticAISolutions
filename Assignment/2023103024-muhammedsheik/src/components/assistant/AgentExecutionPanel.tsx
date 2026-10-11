import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Cpu, 
  GitPullRequest, 
  Sparkles, 
  Wrench, 
  ShieldCheck, 
  Layers, 
  Terminal, 
  Check, 
  X, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Activity,
  Bot,
  Search,
  Calculator as CalcIcon,
  FileSearch,
  BarChart2,
  Globe
} from 'lucide-react';
import { PipelineExecutionStep, AgentRole, SimulatedToolName } from '../../types/agent';
import { Badge } from '../common/Badge';

interface AgentExecutionPanelProps {
  steps: PipelineExecutionStep[];
  isProcessing: boolean;
  selectedAgent?: AgentRole;
  selectedTool?: SimulatedToolName;
  taskPrompt?: string;
}

export const AgentExecutionPanel: React.FC<AgentExecutionPanelProps> = ({
  steps,
  isProcessing,
  selectedAgent,
  selectedTool,
  taskPrompt
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const getAgentColor = (agent: AgentRole): 'blue' | 'purple' | 'cyan' | 'orange' | 'green' | 'gray' => {
    switch (agent) {
      case 'Orchestrator Agent': return 'blue';
      case 'Planning Agent': return 'purple';
      case 'Research Agent': return 'cyan';
      case 'Analysis Agent': return 'orange';
      case 'Validation Agent': return 'green';
      case 'Response Agent': return 'blue';
      case 'General Assistant': return 'gray';
      default: return 'blue';
    }
  };

  const getAgentIcon = (agent: AgentRole) => {
    switch (agent) {
      case 'Orchestrator Agent': return <Cpu size={14} />;
      case 'Planning Agent': return <GitPullRequest size={14} />;
      case 'Research Agent': return <Search size={14} />;
      case 'Analysis Agent': return <BarChart2 size={14} />;
      case 'Validation Agent': return <ShieldCheck size={14} />;
      case 'Response Agent': return <Bot size={14} />;
      default: return <Layers size={14} />;
    }
  };

  const getToolIcon = (tool?: SimulatedToolName) => {
    switch (tool) {
      case 'Calculator': return <CalcIcon size={12} />;
      case 'Data Analyzer': return <BarChart2 size={12} />;
      case 'Document Search': return <FileSearch size={12} />;
      case 'Knowledge Search': return <Search size={12} />;
      case 'Web Search simulation': return <Globe size={12} />;
      default: return <Wrench size={12} />;
    }
  };

  // Pipeline stages blueprint for real-time visualization
  const standardStages = [
    { name: 'Intent Detection', agent: 'Orchestrator Agent' as AgentRole },
    { name: 'Task Planning', agent: 'Planning Agent' as AgentRole },
    { name: 'Agent Selection', agent: 'Orchestrator Agent' as AgentRole },
    { name: 'Tool Execution', agent: selectedAgent || ('Analysis Agent' as AgentRole) },
    { name: 'Validation', agent: 'Validation Agent' as AgentRole },
    { name: 'Final Response', agent: 'Response Agent' as AgentRole }
  ];

  return (
    <div style={{
      width: '420px',
      backgroundColor: '#090D17',
      borderLeft: '1px solid #1E293B',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Panel Top Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #1E293B',
        background: '#0B0F19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Activity size={15} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
              Live Agent Execution Pipeline
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Autonomous Reasoning Engine</span>
              {isProcessing && (
                <span style={{ color: '#3B82F6', fontWeight: 600 }}>• Active</span>
              )}
            </div>
          </div>
        </div>

        {isProcessing ? (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#60A5FA',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '3px 8px',
            borderRadius: '12px'
          }}>
            <span className="status-dot status-dot-blue animate-pulse-glow"></span>
            Executing
          </span>
        ) : (
          <Badge color={steps.length > 0 ? 'green' : 'gray'}>
            {steps.length > 0 ? 'Cycle Complete' : 'Standing By'}
          </Badge>
        )}
      </div>

      {/* Active Selection Banner if available */}
      {(selectedAgent || selectedTool) && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#64748B' }}>Target Agent:</span>
            {selectedAgent && <Badge color={getAgentColor(selectedAgent)}>{selectedAgent}</Badge>}
          </div>

          {selectedTool && selectedTool !== 'None' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748B' }}>Tool:</span>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '1px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {getToolIcon(selectedTool)}
                {selectedTool}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Step Flow List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {steps.length === 0 ? (
          /* Empty / Idle State */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: '24px',
            color: '#64748B',
            gap: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#111827',
              border: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6'
            }}>
              <Terminal size={22} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0' }}>
                Pipeline Awaiting Task Ingestion
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', lineHeight: 1.5 }}>
                Submit a task in the chat to watch the multi-agent execution pipeline orchestrate intent detection, tool execution, and guardrail validation in real time.
              </p>
            </div>

            {/* Standard 6-Step Visual Blueprint */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {standardStages.map((stg, i) => (
                <div 
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0B0F19',
                    border: '1px dashed #1E293B',
                    fontSize: '11px',
                    color: '#64748B'
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)' }}>0{i + 1}. {stg.name}</span>
                  <span style={{ fontSize: '10.5px', color: '#475569' }}>{stg.agent}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Real-Time Executed Steps List */
          steps.map((step, idx) => {
            const isExpanded = expandedStepId === step.id;
            const isRunning = step.status === 'running';

            return (
              <div
                key={step.id}
                style={{
                  background: isRunning ? '#0D1527' : '#0B0F19',
                  border: '1px solid',
                  borderColor: isRunning ? '#3B82F6' : step.success ? '#1E293B' : '#EF4444',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: isRunning ? '0 0 14px rgba(59, 130, 246, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Step Top Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isRunning ? '#3B82F6' : step.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: isRunning ? '#FFFFFF' : step.success ? '#34D399' : '#F87171',
                      border: `1px solid ${isRunning ? '#60A5FA' : step.success ? '#10B981' : '#EF4444'}`,
                      fontSize: '10.5px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {idx + 1}
                    </span>

                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#F8FAFC' }}>
                      {step.stepName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isRunning ? (
                      <span style={{ fontSize: '10.5px', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span className="status-dot status-dot-blue animate-pulse-glow"></span>
                        Running
                      </span>
                    ) : (
                      <Badge color={step.success ? 'green' : 'red'}>
                        {step.success ? 'SUCCESS' : 'FAILED'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Agent Responsible & Tool Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #1E293B',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#64748B' }}>Agent:</span>
                    <Badge color={getAgentColor(step.agentResponsible)}>
                      {getAgentIcon(step.agentResponsible)}
                      {step.agentResponsible}
                    </Badge>
                  </div>

                  {step.toolUsed && step.toolUsed !== 'None' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#64748B' }}>Tool:</span>
                      <span style={{
                        fontSize: '10.5px',
                        color: '#FBBF24',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        {getToolIcon(step.toolUsed)}
                        {step.toolUsed}
                      </span>
                    </div>
                  )}
                </div>

                {/* Telemetry Times & Duration */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  fontSize: '10.5px',
                  color: '#64748B',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span>Start: {step.startTime}</span>
                  <span style={{ color: '#93C5FD' }}>
                    Duration: {isRunning ? '...' : `${step.durationMs}ms`}
                  </span>
                </div>

                {/* Step Result Box */}
                <div style={{
                  marginTop: '8px',
                  background: '#060913',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '11.5px',
                  color: '#CBD5E1',
                  lineHeight: 1.45
                }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                    Output / Result:
                  </div>
                  {step.result}
                </div>

                {/* Expandable Parameters Drawer */}
                {step.parameters && (
                  <div style={{ marginTop: '6px' }}>
                    <button
                      onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#60A5FA',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      <span>{isExpanded ? 'Hide Payload Specs' : 'View Input Parameters'}</span>
                    </button>

                    {isExpanded && (
                      <pre style={{
                        marginTop: '6px',
                        margin: '6px 0 0',
                        padding: '8px',
                        fontSize: '10.5px',
                        background: '#060913',
                        border: '1px solid #1E293B',
                        borderRadius: '4px'
                      }}>
                        {JSON.stringify(step.parameters, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary with Total Latency & Step Count */}
      {steps.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #1E293B',
          background: '#0B0F19',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#94A3B8'
        }}>
          <div>
            <span>Steps: </span>
            <strong style={{ color: '#F1F5F9' }}>{steps.filter(s => s.status === 'completed').length} / {steps.length}</strong>
          </div>
          <div>
            <span>Total Duration: </span>
            <strong style={{ color: '#10B981', fontFamily: 'var(--font-mono)' }}>
              {steps.reduce((acc, s) => acc + s.durationMs, 0)}ms
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
