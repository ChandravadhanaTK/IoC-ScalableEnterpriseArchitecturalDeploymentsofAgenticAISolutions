import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RefreshCw, 
  Clock, 
  Layers, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Terminal,
  Cpu,
  GitPullRequest,
  Wrench,
  Sliders,
  Check,
  X,
  Search,
  Calculator as CalcIcon,
  BarChart2,
  FileSearch,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight
} from 'lucide-react';
import { 
  ChatMessage, 
  TaskStatus, 
  AgentRole, 
  TraceStep, 
  PipelineExecutionStep, 
  SimulatedToolName 
} from '../../types/agent';
import { executeAgentTask, detectTaskIntentAndAgent } from '../../services/agentService';
import { Badge } from '../common/Badge';
import { TraceViewer } from './TraceViewer';
import { AgentExecutionPanel } from './AgentExecutionPanel';

interface AssistantViewProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({ initialPrompt, onClearInitialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      content: `### 🤖 Enterprise Agentic Assistant Ready

I am an autonomous multi-agent platform capable of intelligent routing, tool execution, and verification.

**Supported Autonomous Agent Roles:**
- 🧠 **Orchestrator Agent:** Ingests user goals and performs semantic intent detection.
- 📐 **Planning Agent:** Synthesizes structured execution DAGs and rollback criteria.
- 🔍 **Research Agent:** Ingests enterprise corpora using **Knowledge Search** or **Web Search simulation**.
- 📊 **Analysis Agent:** Evaluates metrics with **Data Analyzer** or computes with **Calculator**.
- 🛡️ **Validation Agent:** Checks policies using **Document Search** and enforces LlamaGuard safety boundaries.
- 🚀 **Response Agent:** Compiles multi-agent outputs into verifiable delivery packages.
- ⚙️ **General Assistant:** Handles conversational assistance for unsupported domain requests.

Try typing or selecting one of the suggested prompts below to watch the live execution pipeline in action!`,
      timestamp: new Date().toLocaleTimeString(),
      status: 'Completed'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>('Completed');
  const [activeAgent, setActiveAgent] = useState<AgentRole>('Orchestrator Agent');
  const [activeTool, setActiveTool] = useState<string | undefined>(undefined);
  const [requireHumanApproval, setRequireHumanApproval] = useState(false);
  const [showExecutionPanel, setShowExecutionPanel] = useState(true);

  // Live real-time pipeline state for the execution panel
  const [currentPipelineSteps, setCurrentPipelineSteps] = useState<PipelineExecutionStep[]>([]);
  const [currentSelectedAgent, setCurrentSelectedAgent] = useState<AgentRole | undefined>(undefined);
  const [currentSelectedTool, setCurrentSelectedTool] = useState<SimulatedToolName | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputPrompt(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, currentStatus]);

  // Suggested prompts matching the user's specific keyword requirements
  const promptExamples = [
    {
      title: 'Analyze this data',
      prompt: 'Analyze this data: 4,800 production server latency telemetry points, isolate p99 spikes, and identify anomalous database connection bottlenecks.',
      targetAgent: 'Analysis Agent',
      targetTool: 'Data Analyzer',
      icon: <BarChart2 size={12} color="#F59E0B" />
    },
    {
      title: 'Find information about...',
      prompt: 'Find information about: enterprise agentic AI architectures, multi-agent supervisory patterns, and gVisor sandbox kernel isolation.',
      targetAgent: 'Research Agent',
      targetTool: 'Knowledge Search',
      icon: <Search size={12} color="#06B6D4" />
    },
    {
      title: 'Calculate...',
      prompt: 'Calculate: compound cloud server compute expenses (14,200 * 0.185) / 1.05 and project 12-month budget variance.',
      targetAgent: 'Analysis Agent',
      targetTool: 'Calculator',
      icon: <CalcIcon size={12} color="#8B5CF6" />
    },
    {
      title: 'Check whether...',
      prompt: 'Check whether current AWS IAM role configurations comply with CIS benchmark policy rule §1.4 least-privilege constraints.',
      targetAgent: 'Validation Agent',
      targetTool: 'Document Search',
      icon: <ShieldCheck size={12} color="#10B981" />
    },
    {
      title: 'General Assistant',
      prompt: 'Provide an overview of enterprise AI adoption best practices and operational SLA monitoring.',
      targetAgent: 'General Assistant',
      targetTool: 'Knowledge Search',
      icon: <Bot size={12} color="#3B82F6" />
    }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isProcessing) return;

    setInputPrompt('');

    // Pre-calculate routing to prime the live pipeline panel
    const initialRouting = detectTaskIntentAndAgent(prompt);
    setCurrentSelectedAgent(initialRouting.selectedAgent);
    setCurrentSelectedTool(initialRouting.selectedTool);
    setCurrentPipelineSteps([]);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    setCurrentStatus('Received');
    setActiveAgent('Orchestrator Agent');
    setActiveTool(undefined);

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      status: 'Received',
      currentAgent: 'Orchestrator Agent',
      traceSteps: [],
      pipelineSteps: [],
      selectedAgent: initialRouting.selectedAgent,
      selectedTool: initialRouting.selectedTool
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      const liveTraceSteps: TraceStep[] = [];
      const livePipelineSteps: PipelineExecutionStep[] = [];

      const result = await executeAgentTask(
        prompt,
        {
          onStatusChange: (status) => {
            setCurrentStatus(status);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, status } : m))
            );
          },
          onAgentChange: (agent, tool) => {
            setActiveAgent(agent);
            setActiveTool(tool);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, currentAgent: agent, activeTool: tool } : m))
            );
          },
          onStepAdded: (step) => {
            liveTraceSteps.push(step);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, traceSteps: [...liveTraceSteps] } : m
              )
            );
          },
          onStepUpdated: (step) => {
            const idx = liveTraceSteps.findIndex((s) => s.id === step.id);
            if (idx !== -1) {
              liveTraceSteps[idx] = step;
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, traceSteps: [...liveTraceSteps] } : m
              )
            );
          },
          onPipelineStepAdded: (pStep) => {
            livePipelineSteps.push(pStep);
            setCurrentPipelineSteps([...livePipelineSteps]);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, pipelineSteps: [...livePipelineSteps] } : m
              )
            );
          },
          onPipelineStepUpdated: (pStep) => {
            const idx = livePipelineSteps.findIndex((s) => s.id === pStep.id);
            if (idx !== -1) {
              livePipelineSteps[idx] = pStep;
            }
            setCurrentPipelineSteps([...livePipelineSteps]);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, pipelineSteps: [...livePipelineSteps] } : m
              )
            );
          }
        },
        requireHumanApproval
      );

      if (result.waitingApproval) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: result.responseText,
                  status: 'Waiting for Approval',
                  humanApprovalRequired: true,
                  approvalPayload: {
                    action: `Execute ${result.selectedTool} via ${result.selectedAgent}`,
                    target: 'Production-Environment',
                    riskLevel: 'MEDIUM'
                  },
                  traceSteps: result.traceSteps,
                  pipelineSteps: result.pipelineSteps,
                  tokens: result.tokens,
                  latencyMs: result.latencyMs
                }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: result.responseText,
                  status: 'Completed',
                  traceSteps: result.traceSteps,
                  pipelineSteps: result.pipelineSteps,
                  tokens: result.tokens,
                  latencyMs: result.latencyMs
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error(err);
      setCurrentStatus('Failed');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: '❌ **Execution Interrupted**: An unexpected system fault occurred during the reasoning cycle.',
                status: 'Failed'
              }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAction = (msgId: string) => {
    setCurrentStatus('Completed');
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const updatedSteps = (m.traceSteps || []).map((s) =>
            s.status === 'waiting_approval'
              ? { ...s, status: 'completed' as const, output: 'Human administrator granted execution approval. State updated.' }
              : s
          );
          return {
            ...m,
            status: 'Completed',
            humanApprovalRequired: false,
            traceSteps: updatedSteps,
            content: `### 🛡️ Human Approval Granted & Tool Execution Committed

**Sign-off Operator:** \`Muhammed Sheik (Role: SecOps Admin)\`  
**Execution Status:** \`APPROVED & COMPLETED\`  

Tool execution proceeded with administrative authorization. Telemetry recorded in audit ledger.`
          };
        }
        return m;
      })
    );
  };

  const handleRejectAction = (msgId: string) => {
    setCurrentStatus('Failed');
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            status: 'Failed',
            humanApprovalRequired: false,
            content: `⛔ **Execution Rejected by Human Operator**  
The proposed tool operation was rejected. All state modifications aborted.`
          };
        }
        return m;
      })
    );
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 64px)',
      background: '#060913',
      overflow: 'hidden'
    }}>
      {/* Left Area: Chat Area & Suggested Prompts */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
        position: 'relative'
      }}>
        
        {/* Active Agent Banner when processing */}
        {isProcessing && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="status-dot status-dot-blue animate-pulse-glow"></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#93C5FD', fontWeight: 600 }}>Active Agent:</span>
                <Badge color="blue">{activeAgent}</Badge>
                {activeTool && (
                  <Badge color="orange">Tool: {activeTool}</Badge>
                )}
              </div>
            </div>
            <span style={{ fontSize: '11.5px', color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
              Executing: {currentStatus}...
            </span>
          </div>
        )}

        {/* Top Control Bar: Panel Toggle & Human Gate */}
        <div style={{
          padding: '8px 24px',
          background: '#090D17',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            color: '#94A3B8',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input 
              type="checkbox" 
              checked={requireHumanApproval}
              onChange={(e) => setRequireHumanApproval(e.target.checked)}
              style={{ accentColor: '#3B82F6', cursor: 'pointer' }}
            />
            <span>Require Human-in-the-Loop Approval Before Tool Execution</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowExecutionPanel(!showExecutionPanel)}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {showExecutionPanel ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
              <span>{showExecutionPanel ? 'Hide Pipeline Panel' : 'Show Pipeline Panel'}</span>
            </button>

            <button 
              onClick={() => {
                setMessages([messages[0]]);
                setCurrentPipelineSteps([]);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} /> Clear Chat
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {messages.map((msg) => {
            const isAssistant = msg.sender === 'assistant';

            return (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '14px',
                  maxWidth: '860px',
                  width: '100%',
                  margin: '0 auto',
                  flexDirection: isAssistant ? 'row' : 'row-reverse'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: isAssistant ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' : '#1E293B',
                  color: '#FFFFFF',
                  boxShadow: isAssistant ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none'
                }}>
                  {isAssistant ? <Bot size={18} /> : <User size={18} />}
                </div>

                {/* Message Bubble Card */}
                <div style={{
                  flex: 1,
                  background: isAssistant ? '#0E1424' : '#1E293B',
                  border: '1px solid',
                  borderColor: isAssistant ? '#1E293B' : '#334155',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    borderBottom: '1px solid #1E293B',
                    paddingBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isAssistant ? '#93C5FD' : '#F1F5F9' }}>
                        {isAssistant ? 'Enterprise Agentic Assistant' : 'Operator Request'}
                      </span>
                      {msg.status && (
                        <Badge color={
                          msg.status === 'Completed' ? 'green' :
                          msg.status === 'Waiting for Approval' ? 'orange' :
                          msg.status === 'Failed' ? 'red' : 'blue'
                        }>
                          {msg.status}
                        </Badge>
                      )}
                      {msg.selectedAgent && (
                        <Badge color="purple">Agent: {msg.selectedAgent}</Badge>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div style={{
                    fontSize: '13.5px',
                    color: '#E2E8F0',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content || (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', padding: '12px 0' }}>
                        <span className="status-dot status-dot-blue animate-pulse-glow"></span>
                        <span>Executing multi-agent pipeline in real-time...</span>
                      </div>
                    )}
                  </div>

                  {/* Human Approval Required Gate */}
                  {msg.humanApprovalRequired && (
                    <div style={{
                      marginTop: '16px',
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} color="#F59E0B" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#FBBF24' }}>
                          Authorization Gate: {msg.approvalPayload?.action}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                        Target: <code style={{ color: '#60A5FA' }}>{msg.approvalPayload?.target}</code> • Risk: <Badge color="orange">{msg.approvalPayload?.riskLevel}</Badge>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button 
                          className="btn-primary"
                          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '6px 14px', fontSize: '12px' }}
                          onClick={() => handleApproveAction(msg.id)}
                        >
                          <Check size={14} /> Approve & Continue
                        </button>
                        <button 
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '12px', borderColor: '#EF4444', color: '#F87171' }}
                          onClick={() => handleRejectAction(msg.id)}
                        >
                          <X size={14} /> Reject Execution
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Collapsible Trace Steps Viewer */}
                  {msg.traceSteps && msg.traceSteps.length > 0 && (
                    <TraceViewer steps={msg.traceSteps} />
                  )}

                  {/* Execution Metrics Footer */}
                  {(msg.tokens || msg.latencyMs) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '12px',
                      fontSize: '11px',
                      color: '#64748B',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {msg.latencyMs && <span>Execution Time: {msg.latencyMs}ms</span>}
                      {msg.tokens && <span>Tokens: {msg.tokens}</span>}
                      {msg.selectedTool && <span>Tool: {msg.selectedTool}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Shelf */}
        <div style={{
          background: '#090D17',
          borderTop: '1px solid #1E293B',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Try Intent Triggers:
          </span>
          {promptExamples.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(ex.prompt)}
              disabled={isProcessing}
              title={`Dispatches to ${ex.targetAgent} using ${ex.targetTool}`}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                background: '#111827',
                border: '1px solid #1E293B',
                color: '#94A3B8',
                fontSize: '11.5px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.borderColor = '#1E293B';
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
            >
              {ex.icon}
              <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{ex.title}</span>
              <span style={{ fontSize: '10px', color: '#64748B' }}>({ex.targetAgent.split(' ')[0]})</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          background: '#090D17',
          borderTop: '1px solid #1E293B',
          padding: '16px 24px',
          display: 'flex',
          gap: '12px',
          flexShrink: 0
        }}>
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type an enterprise task (e.g. 'Analyze this data', 'Calculate 14200 * 0.185', 'Check whether IAM roles comply', 'Find information about...')..."
            disabled={isProcessing}
            style={{
              flex: 1,
              backgroundColor: '#111827',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#F8FAFC',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3B82F6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#1E293B';
            }}
          />

          <button
            className="btn-primary"
            onClick={() => handleSendMessage()}
            disabled={isProcessing || !inputPrompt.trim()}
            style={{ padding: '0 20px' }}
          >
            {isProcessing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>Execute Task</span>
          </button>
        </div>
      </div>

      {/* Right Area: Dedicated Live Agent Execution Pipeline Panel */}
      {showExecutionPanel && (
        <AgentExecutionPanel
          steps={currentPipelineSteps}
          isProcessing={isProcessing}
          selectedAgent={currentSelectedAgent}
          selectedTool={currentSelectedTool}
          taskPrompt={inputPrompt}
        />
      )}
    </div>
  );
};
