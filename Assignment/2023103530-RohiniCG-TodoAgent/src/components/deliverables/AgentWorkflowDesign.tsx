import React, { useState } from 'react';
import { GitBranch, UserCheck, Play, RotateCcw, AlertTriangle, ShieldAlert, Cpu, Terminal, ArrowRight, CheckCircle2 } from 'lucide-react';

interface WorkflowState {
  id: string;
  name: string;
  role: string;
  description: string;
  toolsUsed: string[];
  failurePath: string;
  handoffTo: string;
}

export const AgentWorkflowDesign: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<'standard' | 'hitl' | 'failure'>('hitl');
  const [simulatedStep, setSimulatedStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const workflowStates: WorkflowState[] = [
    {
      id: 'intake',
      name: '1. Ingestion & Security Sanitization',
      role: 'Safety & Ingestion Agent',
      description: 'Parses incoming task text or webhook payload. Runs regex and embedding-based scans for prompt injections and tokenizes PII.',
      toolsUsed: ['NeMoGuardrailsScanner', 'PresidioPIIRedactor'],
      failurePath: 'If injection detected: Reject immediately with HTTP 403 & log security alert to SIEM.',
      handoffTo: 'Priority Planner Agent',
    },
    {
      id: 'prioritization',
      name: '2. Eisenhower Prioritization Engine',
      role: 'Prioritization Specialist Agent',
      description: 'Calculates dynamic impact (1-10) and urgency (1-10). Assigns Eisenhower quadrant (Do First, Schedule, Delegate, Backlog) and priority tier (P0-P3).',
      toolsUsed: ['DependencyGraphResolver', 'SLAProximityCalculator'],
      failurePath: 'If ambiguity exceeds 25%: Fallback to P2 Medium and request human clarity.',
      handoffTo: 'Task Decomposition Agent',
    },
    {
      id: 'decomposition',
      name: '3. Atomic Task Decomposition',
      role: 'Planner / Graph Orchestrator',
      description: 'Breaks complex goal into isolated acyclic subtask graph. Resolves which subtasks require external sandboxed tools.',
      toolsUsed: ['LangGraphDAGPlanner', 'MicroVMEnvironmentSpawner'],
      failurePath: 'If circular dependency detected: Abort plan and prune invalid edge.',
      handoffTo: 'Safety & HITL Evaluator',
    },
    {
      id: 'hitl_gate',
      name: '4. Human-In-The-Loop (HITL) Gate',
      role: 'Security Policy Enforcer & Human Approver',
      description: 'Evaluates if task is P0 Critical or alters restricted infrastructure. If yes, suspends execution and generates a signed approval request.',
      toolsUsed: ['PolicyEnforcementEngine', 'SlackApprovalBot', 'WebConsoleNotification'],
      failurePath: 'If Human rejects or 24hr timeout: Transition task to BLOCKED state with audit entry.',
      handoffTo: 'Tool Execution Specialist',
    },
    {
      id: 'execution',
      name: '5. Isolated Sandboxed Execution',
      role: 'Tool Execution Specialist Agents',
      description: 'Spins up ephemeral Firecracker microVMs. Executes GitHub PR commits, Jira ticket updates, and k6 benchmark runs in isolated network namespaces.',
      toolsUsed: ['FirecrackerRunner', 'GitHubAPIClient', 'JiraConnector', 'K6Benchmarker'],
      failurePath: 'If tool returns 5xx error: Apply exponential backoff (3 retries). On 3rd failure, trip circuit breaker.',
      handoffTo: 'Reflection Critic Agent',
    },
    {
      id: 'reflection',
      name: '6. Self-Reflection & Acceptance Validation',
      role: 'Critic / Evaluator Agent',
      description: 'Verifies tool outputs against original task acceptance criteria. Assesses hallucination index (<0.5%) before committing final state.',
      toolsUsed: ['OutputSanitizer', 'AcceptanceCriteriaChecker'],
      failurePath: 'If validation score < 85%: Loop back to Step 3 with critique feedback (max 2 loops).',
      handoffTo: 'Audit Chaining Service',
    },
    {
      id: 'audit_commit',
      name: '7. Cryptographic Audit & State Commit',
      role: 'Governance & Persistence Agent',
      description: 'Computes SHA-256 block hash linked to prior block. Writes immutable audit entry to database and broadcasts WebSocket completion event.',
      toolsUsed: ['SHA256HashChainer', 'PostgresStateCommitter', 'WebSocketNotifier'],
      failurePath: 'If hash verification fails: Halt system and alert Security Operations Center.',
      handoffTo: 'Task Completed (Terminal State)',
    },
  ];

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulatedStep(0);

    const maxSteps = activeScenario === 'hitl' ? 4 : activeScenario === 'failure' ? 5 : 7;
    let current = 0;

    const interval = setInterval(() => {
      current++;
      if (current <= maxSteps) {
        setSimulatedStep(current);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1200);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulatedStep(0);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold tracking-wider uppercase mb-1">
            <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">2</span>
            Deliverable 2 • Agentic AI Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Agent Workflow & State Machine
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic state transitions, multi-agent roles, tool orchestration, HITL gates, and automated failure recovery.
          </p>
        </div>

        {/* Live Simulator Controls */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => { setActiveScenario('standard'); resetSimulation(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeScenario === 'standard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Autonomous Run
          </button>
          <button
            onClick={() => { setActiveScenario('hitl'); resetSimulation(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeScenario === 'hitl' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            P0 HITL Gate
          </button>
          <button
            onClick={() => { setActiveScenario('failure'); resetSimulation(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeScenario === 'failure' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tool Failure & Fallback
          </button>
        </div>
      </div>

      {/* Interactive Simulation Dashboard */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-900/50 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
              Interactive State Machine Simulation
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {activeScenario === 'standard' && 'Scenario A: Autonomous P1 Task Execution without Interruption'}
              {activeScenario === 'hitl' && 'Scenario B: P0 Critical Task with Human-In-The-Loop Approval Gate'}
              {activeScenario === 'failure' && 'Scenario C: Sandboxed Tool Timeout with Circuit Breaker Recovery'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-md ${
                isSimulating
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isSimulating ? 'Executing Step ' + simulatedStep + '...' : 'Run Simulation'}
            </button>
            <button
              onClick={resetSimulation}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual State Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {workflowStates.map((state, idx) => {
            const stepNum = idx + 1;
            const isCurrent = simulatedStep === stepNum;
            const isCompleted = simulatedStep > stepNum;
            const isBlocked = simulatedStep === 4 && activeScenario === 'hitl';
            const isFailed = simulatedStep === 5 && activeScenario === 'failure';

            return (
              <div
                key={state.id}
                className={`p-3.5 rounded-xl border text-xs transition-all duration-300 relative ${
                  isCurrent
                    ? 'border-indigo-400 bg-indigo-950/80 shadow-lg scale-105 z-10 ring-2 ring-indigo-500/50'
                    : isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-slate-300'
                    : 'border-slate-800 bg-slate-900/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">STEP 0{stepNum}</span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {isCurrent && !isBlocked && !isFailed && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  )}
                  {isCurrent && isBlocked && <UserCheck className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                  {isCurrent && isFailed && <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />}
                </div>

                <div className="font-bold text-white text-xs line-clamp-1">{state.name.split('. ')[1]}</div>
                <div className="text-[11px] text-indigo-300 mt-1 line-clamp-1">{state.role}</div>

                {isCurrent && isBlocked && (
                  <div className="mt-2 text-[10px] font-semibold bg-amber-500/20 text-amber-300 p-1.5 rounded border border-amber-500/30">
                    HITL Gate Active: Awaiting Lead Admin Sign-Off
                  </div>
                )}

                {isCurrent && isFailed && (
                  <div className="mt-2 text-[10px] font-semibold bg-red-500/20 text-red-300 p-1.5 rounded border border-red-500/30">
                    Tool Timeout: Circuit Breaker Tripped!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* State Transitions & Failure Paths Matrix */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          Agent State Transition & Failure Recovery Matrix
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="p-3.5">Workflow Phase</th>
                <th className="p-3.5">Assigned Agent Role</th>
                <th className="p-3.5">Tools & Sandboxes</th>
                <th className="p-3.5">Failure / Escalation Path</th>
                <th className="p-3.5">Next Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {workflowStates.map((st) => (
                <tr key={st.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-white whitespace-nowrap">{st.name}</td>
                  <td className="p-3.5 text-indigo-300 font-medium">{st.role}</td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {st.toolsUsed.map((tool, idx) => (
                        <span key={idx} className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-300">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 text-amber-300/90 text-[11px] max-w-xs">{st.failurePath}</td>
                  <td className="p-3.5 font-mono text-emerald-400 text-[11px] flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    {st.handoffTo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
