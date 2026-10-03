import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Bot, 
  Building2, 
  AlertTriangle, 
  Layers, 
  Info,
  Calendar,
  Users,
  Tv,
  Check,
  RotateCcw,
  ChevronRight
} from 'lucide-react';
import { User, AgentStepLog, RecommendationPayload, Reservation } from '../types';
import { AgentOrchestrator } from '../services/orchestrator';
import { Badge } from '../components/common/Badge';

interface AssistantPageProps {
  currentUser: User;
  onShowToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigateToRooms: () => void;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({
  currentUser,
  onShowToast,
  onNavigateToRooms
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [pipelineSteps, setPipelineSteps] = useState<AgentStepLog[]>([]);
  const [pipelineResult, setPipelineResult] = useState<{
    runId: string;
    payload: RecommendationPayload;
    totalDurationMs: number;
  } | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [rejectedNotice, setRejectedNotice] = useState<string | null>(null);

  // Pre-configured Enterprise Demo Scenarios
  const demoScenarios = [
    {
      title: 'Scenario 1: Standard Fit',
      prompt: 'I need a meeting room for 12 people tomorrow at 3 PM with a projector.',
      description: 'Room Alpha recommended (Cap: 15, Projector)'
    },
    {
      title: 'Scenario 2: Overflow Capacity',
      prompt: 'I need a room for 50 people.',
      description: 'Capacity diagnostic (Max facility capacity is 30)'
    },
    {
      title: 'Scenario 3: Optimal Fit & Alts',
      prompt: 'I need a room for 5 people with a projector.',
      description: 'Room Beta optimal (Cap: 8), Alpha & Innovation alts'
    },
    {
      title: 'Scenario 4: Conflict Detection',
      prompt: 'I need Conference Hall tomorrow at 3 PM.',
      description: 'Collides with Executive Symposium & recommends alternative'
    }
  ];

  const handleRunPipeline = async (inputQuery: string) => {
    if (!inputQuery.trim() || isRunning) return;

    setIsRunning(true);
    setPipelineSteps([]);
    setPipelineResult(null);
    setConfirmedReservation(null);
    setRejectedNotice(null);
    setCurrentStepIndex(1);

    try {
      const result = await AgentOrchestrator.executePipeline(
        inputQuery,
        (stepLog) => {
          setPipelineSteps((prev) => [...prev, stepLog]);
          setCurrentStepIndex(stepLog.stepNumber + 1);
        }
      );

      setPipelineResult({
        runId: result.runId,
        payload: result.payload,
        totalDurationMs: result.totalDurationMs
      });
      setCurrentStepIndex(5); // At HITL gate
    } catch (error) {
      onShowToast('Execution Error', 'An unexpected error occurred during agent execution.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = () => {
    if (!pipelineResult) return;
    try {
      const reservation = AgentOrchestrator.approveReservation(
        pipelineResult.runId,
        pipelineResult.payload,
        currentUser
      );
      setConfirmedReservation(reservation);
      onShowToast(
        'Reservation Confirmed!',
        `${reservation.roomName} successfully booked for ${reservation.date} at ${reservation.time}.`,
        'success'
      );
    } catch (e: any) {
      onShowToast('Approval Failed', e.message, 'error');
    }
  };

  const handleReject = () => {
    if (!pipelineResult) return;
    AgentOrchestrator.rejectRecommendation(
      pipelineResult.runId,
      pipelineResult.payload,
      currentUser,
      'User declined proposal via Assistant UI'
    );
    setRejectedNotice('Recommendation rejected. No changes committed to workplace schedule.');
    onShowToast('Recommendation Declined', 'The proposed reservation was discarded.', 'info');
  };

  const handleResetSession = () => {
    setPromptInput('');
    setPipelineSteps([]);
    setPipelineResult(null);
    setConfirmedReservation(null);
    setRejectedNotice(null);
    setCurrentStepIndex(0);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-12">
      {/* Enterprise AI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Autonomous Agent Orchestration
            </span>
            <span className="text-xs text-slate-400 font-mono">HITL Protocol v2.4</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>OfficeOps AI Workplace Assistant</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            4-Agent Collaborative Pipeline with Strict Human-In-The-Loop Approval Gates
          </p>
        </div>

        <button
          onClick={handleResetSession}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Demo Scenario Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Demo Scenarios (Click to Execute):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {demoScenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={() => {
                setPromptInput(scenario.prompt);
                handleRunPipeline(scenario.prompt);
              }}
              disabled={isRunning}
              className="text-left p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/20 transition-all group disabled:opacity-50"
            >
              <div className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                {scenario.title}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                "{scenario.prompt}"
              </p>
              <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span>{scenario.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunPipeline(promptInput);
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Describe your workplace operational need (e.g., 'I need a meeting room for 12 people tomorrow at 3 PM with a projector.')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
              disabled={isRunning}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safety Rule: Agents evaluate & score; reservations require human confirmation.</span>
            </div>

            <button
              type="submit"
              disabled={isRunning || !promptInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Agents Evaluating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Multi-Agent Pipeline</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Agent Workflow Execution Stages */}
      {(isRunning || pipelineSteps.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Multi-Agent Execution Pipeline</span>
            </h3>
            {pipelineResult && (
              <span className="text-xs font-mono text-slate-400">
                Total Execution Time: <span className="text-indigo-400 font-semibold">{pipelineResult.totalDurationMs} ms</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Step 1: Requirement Agent */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                pipelineSteps.some((s) => s.agentName === 'Requirement Agent')
                  ? 'bg-slate-900 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                  : isRunning && currentStepIndex === 1
                  ? 'bg-slate-900 border-indigo-400 animate-pulse'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-indigo-400">Step 1</span>
                {pipelineSteps.some((s) => s.agentName === 'Requirement Agent') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isRunning && currentStepIndex === 1 ? (
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white">Requirement Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1">Extracts parameters & constraints</p>
              {pipelineSteps.find((s) => s.agentName === 'Requirement Agent') && (
                <div className="mt-2 text-[10px] text-emerald-300 font-mono bg-emerald-950/40 p-1.5 rounded border border-emerald-900/40">
                  Extracted JSON slots
                </div>
              )}
            </div>

            {/* Step 2: Resource Agent */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                pipelineSteps.some((s) => s.agentName === 'Resource Agent')
                  ? 'bg-slate-900 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                  : isRunning && currentStepIndex === 2
                  ? 'bg-slate-900 border-indigo-400 animate-pulse'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-indigo-400">Step 2</span>
                {pipelineSteps.some((s) => s.agentName === 'Resource Agent') ? (
                  pipelineSteps.find((s) => s.agentName === 'Resource Agent')?.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )
                ) : isRunning && currentStepIndex === 2 ? (
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white">Resource Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1">Queries inventory & capacity</p>
              {pipelineSteps.find((s) => s.agentName === 'Resource Agent') && (
                <div className="mt-2 text-[10px] text-sky-300 font-mono bg-sky-950/40 p-1.5 rounded border border-sky-900/40">
                  Inventory filtered
                </div>
              )}
            </div>

            {/* Step 3: Scheduling Agent */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                pipelineSteps.some((s) => s.agentName === 'Scheduling Agent')
                  ? 'bg-slate-900 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                  : isRunning && currentStepIndex === 3
                  ? 'bg-slate-900 border-indigo-400 animate-pulse'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-indigo-400">Step 3</span>
                {pipelineSteps.some((s) => s.agentName === 'Scheduling Agent') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isRunning && currentStepIndex === 3 ? (
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white">Scheduling Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1">Checks calendar & collisions</p>
              {pipelineSteps.find((s) => s.agentName === 'Scheduling Agent') && (
                <div className="mt-2 text-[10px] text-amber-300 font-mono bg-amber-950/40 p-1.5 rounded border border-amber-900/40">
                  Availability verified
                </div>
              )}
            </div>

            {/* Step 4: Recommendation Agent */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                pipelineSteps.some((s) => s.agentName === 'Recommendation Agent')
                  ? 'bg-slate-900 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                  : isRunning && currentStepIndex === 4
                  ? 'bg-slate-900 border-indigo-400 animate-pulse'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-indigo-400">Step 4</span>
                {pipelineSteps.some((s) => s.agentName === 'Recommendation Agent') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isRunning && currentStepIndex === 4 ? (
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white">Recommendation Agent</h4>
              <p className="text-[11px] text-slate-400 mt-1">Multi-criteria scoring & ranking</p>
              {pipelineSteps.find((s) => s.agentName === 'Recommendation Agent') && (
                <div className="mt-2 text-[10px] text-indigo-300 font-mono bg-indigo-950/40 p-1.5 rounded border border-indigo-900/40">
                  Weighted scoring done
                </div>
              )}
            </div>
          </div>

          {/* Detailed Step Logs Accordion */}
          <div className="space-y-2">
            {pipelineSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{step.agentName}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-400">{step.title}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">{step.durationMs} ms</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{step.details}</p>
                {step.data && (
                  <pre className="mt-2 p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400 font-mono overflow-x-auto">
                    {JSON.stringify(step.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HUMAN-IN-THE-LOOP APPROVAL CARD */}
      {pipelineResult && !confirmedReservation && !rejectedNotice && (
        <div className="border border-indigo-500/60 bg-gradient-to-b from-indigo-950/30 to-slate-900 rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
          {/* HITL Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/50 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Human-In-The-Loop Approval Gate
                </span>
                <span className="text-xs text-slate-400 font-mono">Run ID: {pipelineResult.runId}</span>
              </div>
              <h3 className="text-lg font-bold text-white">Agent Recommendation Review</h3>
            </div>
            <div className="text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Consequential action locked pending human decision</span>
            </div>
          </div>

          {/* If No Match Found (e.g. Scenario 2: 50 people) */}
          {pipelineResult.payload.status === 'no_match' && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>No Suitable Room Found</span>
              </div>
              <p className="text-xs text-rose-300 leading-relaxed">
                {pipelineResult.payload.reasoning}
              </p>
              <div className="pt-2 text-xs text-slate-300">
                <strong>Recommended Next Steps:</strong> Consider partitioning your meeting into hybrid virtual sessions or reserving an external off-site venue.
              </div>
            </div>
          )}

          {/* If Conflict Detected (e.g. Scenario 4) */}
          {pipelineResult.payload.conflictNotice && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Temporal Conflict Detected</span>
              </div>
              <p className="text-xs text-amber-300 leading-relaxed">
                {pipelineResult.payload.conflictNotice}
              </p>
              <p className="text-xs text-slate-300">
                {pipelineResult.payload.reasoning}
              </p>
            </div>
          )}

          {/* Recommended Room Details Card */}
          {pipelineResult.payload.primaryRecommendation && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-xl font-bold text-white">
                        {pipelineResult.payload.primaryRecommendation.room.name}
                      </h4>
                      <Badge variant="purple" size="md">
                        Score: {pipelineResult.payload.primaryRecommendation.totalScore}/100
                      </Badge>
                      <Badge variant="success" size="md">
                        Primary Recommendation
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {pipelineResult.payload.primaryRecommendation.room.floor} &bull;{' '}
                      {pipelineResult.payload.primaryRecommendation.room.location}
                    </p>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-300">
                    <div>Date: <span className="text-white font-semibold">{pipelineResult.payload.requirements.date}</span></div>
                    <div>Time: <span className="text-white font-semibold">{pipelineResult.payload.requirements.time}</span></div>
                  </div>
                </div>

                {/* Score Factor Breakdown */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Capacity Fit (40%)</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {pipelineResult.payload.primaryRecommendation.capacityScore}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {pipelineResult.payload.requirements.capacityNeeded} / {pipelineResult.payload.primaryRecommendation.room.capacity} seats
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Equipment Match (30%)</span>
                    <span className="font-bold text-sky-400 text-sm">
                      {pipelineResult.payload.primaryRecommendation.equipmentScore}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Hardware compatible</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Availability Score (30%)</span>
                    <span className="font-bold text-indigo-400 text-sm">
                      {pipelineResult.payload.primaryRecommendation.availabilityScore}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">0 Calendar Conflicts</span>
                  </div>
                </div>

                {/* Agent Reasoning */}
                <div className="text-xs text-slate-300 bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/40">
                  <span className="font-semibold text-indigo-300 block mb-1">Agent Justification:</span>
                  <p>{pipelineResult.payload.primaryRecommendation.reasoning}</p>
                </div>

                {/* Alternatives List */}
                {pipelineResult.payload.alternatives.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                      Ranked Alternatives Considered:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pipelineResult.payload.alternatives.map((alt) => (
                        <div
                          key={alt.room.id}
                          className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">{alt.room.name}</span>
                            <span className="text-slate-400 text-[11px] ml-2">(Cap: {alt.room.capacity})</span>
                          </div>
                          <Badge variant="default" size="sm">Score: {alt.totalScore}/100</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Explicit Approval / Rejection */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleReject}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:border-rose-700/80 border border-slate-700 text-slate-300 hover:text-rose-200 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Reject Recommendation</span>
                </button>

                <button
                  onClick={handleApprove}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Confirm Reservation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMED RESERVATION SUCCESS VIEW */}
      {confirmedReservation && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/60 shadow-2xl space-y-4 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Reservation Confirmed!</h3>
                <Badge variant="success" size="sm">Committed to Database</Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Booking ID: {confirmedReservation.id} &bull; Pipeline Run: {confirmedReservation.agentRunId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[11px] block">Space</span>
              <span className="font-bold text-white font-sans text-sm">{confirmedReservation.roomName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Date</span>
              <span className="font-bold text-slate-200">{confirmedReservation.date}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Time Window</span>
              <span className="font-bold text-slate-200">
                {confirmedReservation.time} ({confirmedReservation.durationHours}h)
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Requester</span>
              <span className="font-bold text-slate-200 font-sans">{confirmedReservation.requesterName}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Audit event logged with cryptographic integrity reference. Calendar inventory updated.</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleResetSession}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              &larr; Start Another Workplace Query
            </button>
            <button
              onClick={onNavigateToRooms}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              View Room in Inventory
            </button>
          </div>
        </div>
      )}

      {/* REJECTED REASSURANCE VIEW */}
      {rejectedNotice && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 animate-slideUp">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-slate-400" />
            <div>
              <h3 className="text-base font-bold text-white">Proposal Discarded</h3>
              <p className="text-xs text-slate-400">{rejectedNotice}</p>
            </div>
          </div>
          <button
            onClick={handleResetSession}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
          >
            Submit Modified Query
          </button>
        </div>
      )}
    </div>
  );
};
