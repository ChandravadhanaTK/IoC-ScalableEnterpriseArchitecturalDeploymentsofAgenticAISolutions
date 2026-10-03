import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Cpu,
  Search,
  BookOpen,
  Scale,
  ShieldAlert,
  Zap,
  Check
} from 'lucide-react';

const STEP_DEFINITIONS = [
  { state: 'RECEIVED', label: 'Complaint Intake', icon: Clock, desc: 'Logged & queued for supervisor orchestration' },
  { state: 'CLASSIFYING', label: 'Intent Classification', icon: Cpu, desc: 'IntentAgent classifies sentiment, domain, and priority' },
  { state: 'FETCHING_ORDER', label: 'Order Tool Verification', icon: Search, desc: 'OrderAgent verifies purchase date & ownership' },
  { state: 'RETRIEVING_POLICY', label: 'Vector RAG Search', icon: BookOpen, desc: 'PolicyAgent retrieves binding policy clauses' },
  { state: 'ANALYZING', label: 'Resolution Synthesis', icon: Scale, desc: 'ResolutionAgent evaluates eligibility & threshold gates' },
  { state: 'AWAITING_APPROVAL', label: 'Human-in-the-Loop', icon: ShieldAlert, desc: 'High-value or exception gate requires human reviewer' },
  { state: 'EXECUTING_ACTION', label: 'Tool Execution', icon: Zap, desc: 'ActionAgent executes refund/replacement/tickets' },
  { state: 'RESOLVED', label: 'Resolved & Notified', icon: CheckCircle2, desc: 'Resolution finalized and notification dispatched' },
];

export const WorkflowTimeline = ({ timeline = [], currentStatus = 'RECEIVED' }) => {
  // Map timeline events by state
  const eventMap = {};
  if (Array.isArray(timeline)) {
    timeline.forEach(event => {
      eventMap[event.state] = event;
    });
  }

  // Determine stage progression index
  const statusOrder = [
    'RECEIVED',
    'CLASSIFYING',
    'FETCHING_ORDER',
    'RETRIEVING_POLICY',
    'ANALYZING',
    'AWAITING_APPROVAL',
    'EXECUTING_ACTION',
    'RESOLVED',
    'ESCALATED',
    'REJECTED',
    'FAILED'
  ];

  const currentIdx = statusOrder.indexOf(currentStatus);

  const getStepStatus = (stepState, idx) => {
    if (eventMap[stepState]) return 'completed';
    if (stepState === currentStatus) return 'active';
    if (currentStatus === 'RESOLVED') return 'completed';
    if (currentStatus === 'AWAITING_APPROVAL' && stepState === 'AWAITING_APPROVAL') return 'warning';
    if (currentStatus === 'ESCALATED' && stepState === 'AWAITING_APPROVAL') return 'warning';
    
    // Check if subsequent step completed
    const thisIdx = statusOrder.indexOf(stepState);
    if (currentIdx > thisIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="workflow-timeline-card">
      <div className="timeline-header">
        <div className="timeline-title-row">
          <Cpu className="timeline-title-icon" size={20} />
          <h3>Agentic State Machine & Execution Timeline</h3>
        </div>
        <span className={`status-badge-lg status-${currentStatus.toLowerCase()}`}>
          {currentStatus}
        </span>
      </div>

      <div className="timeline-steps-container">
        {STEP_DEFINITIONS.map((step, index) => {
          const stepStatus = getStepStatus(step.state, index);
          const event = eventMap[step.state];
          const IconComponent = step.icon;

          return (
            <div key={step.state} className={`timeline-step-item status-${stepStatus}`}>
              <div className="step-connector-line" />
              
              <div className="step-node-bubble">
                {stepStatus === 'completed' ? (
                  <Check size={16} className="text-success" />
                ) : (
                  <IconComponent size={16} />
                )}
              </div>

              <div className="step-content">
                <div className="step-top-line">
                  <h4 className="step-label">{step.label}</h4>
                  {event && event.timestamp && (
                    <span className="step-time">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </div>

                <p className="step-desc">
                  {event ? event.message : step.desc}
                </p>

                {event && event.agent && (
                  <div className="step-agent-tag">
                    <span>Agent: <strong>{event.agent}</strong></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
