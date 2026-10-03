import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Cpu,
  Layers,
  Shield,
  Search,
  CheckSquare,
  FileCheck,
  ChevronLeft,
} from 'lucide-react';
import { StorageData } from '../../services/storage';
import { Profile } from '../../types';
import { formatDate } from '../../lib/utils';
import { AgentOrchestrator } from '../../services/agents';

interface AgentWorkflowViewProps {
  requestId: string;
  data: StorageData;
  currentUser: Profile;
  onBack: () => void;
  onRefresh: () => void;
}

const STAGES = [
  'Request',
  'Triage',
  'Policy',
  'Inventory',
  'Risk',
  'Approval',
  'Assignment',
  'Completed',
];

export const AgentWorkflowView: React.FC<AgentWorkflowViewProps> = ({
  requestId,
  data,
  currentUser,
  onBack,
  onRefresh,
}) => {
  const [retrying, setRetrying] = useState(false);
  const request = data.asset_requests.find((r) => r.id === requestId);
  const requester = data.profiles.find((p) => p.id === request?.requester_id);
  const recommendedAsset = data.assets.find((a) => a.id === request?.recommended_asset_id);
  const events = data.agent_events
    .filter((e) => e.request_id === requestId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (!request) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="text-gray-400">Request not found.</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  // Determine active stage
  const getStageIndex = () => {
    switch (request.status) {
      case 'RECEIVED':
        return 0;
      case 'ANALYZING':
        return 1;
      case 'POLICY_CHECK':
        return 2;
      case 'INVENTORY_MATCHING':
        return 3;
      case 'RISK_EVALUATION':
        return 4;
      case 'APPROVAL_REQUIRED':
        return 5;
      case 'APPROVED':
        return 6;
      case 'ASSIGNING':
        return 6;
      case 'COMPLETED':
        return 7;
      case 'REJECTED':
        return 5;
      case 'FAILED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex();

  const handleRetry = async () => {
    setRetrying(true);
    await AgentOrchestrator.retryWorkflow(request.id, currentUser);
    setRetrying(false);
    onRefresh();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Requests</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">ID: {request.code}</span>
          {currentUser.role === 'admin' && request.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{retrying ? 'Retrying...' : 'Admin Retry Workflow'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {request.code}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  request.risk === 'LOW'
                    ? 'bg-emerald-100 text-emerald-800'
                    : request.risk === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {request.risk || 'EVALUATING'} RISK
              </span>
              {request.auto_approved && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  AUTO-APPROVED
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {request.asset_type} Request — {request.purpose}
            </h2>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                request.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : request.status === 'APPROVAL_REQUIRED'
                  ? 'bg-amber-100 text-amber-700'
                  : request.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-700'
                  : request.status === 'FAILED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700 animate-pulse'
              }`}
            >
              {request.status}
            </span>
            <div className="text-[11px] text-gray-400 mt-1">
              Submitted: {formatDate(request.created_at)}
            </div>
          </div>
        </div>

        {/* Request details row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-gray-50 p-3 rounded-xl">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Requester</span>
            <span className="font-bold text-gray-800">{requester?.name || 'Unknown'}</span>
            <span className="text-[11px] text-gray-500 block">{request.department} &bull; {request.preferred_location}</span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Requirements</span>
            <span className="font-bold text-gray-800">{request.min_ram} GB RAM / {request.min_storage} GB</span>
            <span className="text-[11px] text-gray-500 block">CPU: {request.cpu_requirement}</span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Recommended Asset</span>
            <span className="font-bold text-blue-600">{recommendedAsset?.tag || 'Pending Match'}</span>
            <span className="text-[11px] text-gray-500 block">
              {recommendedAsset ? `${recommendedAsset.brand} ${recommendedAsset.model}` : 'Searching inventory'}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Policy Decision</span>
            <span className="font-bold text-gray-800">{request.reason || 'Evaluating compliance'}</span>
          </div>
        </div>
      </div>

      {/* Visual Stepper */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">
          Multi-Agent State Pipeline Stepper
        </h3>

        <div className="relative">
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center justify-between min-w-[640px]">
              {STAGES.map((stage, idx) => {
                const isPassed = idx < currentStageIndex || request.status === 'COMPLETED';
                const isCurrent = idx === currentStageIndex && request.status !== 'COMPLETED';
                const isFailed = request.status === 'FAILED' && idx === currentStageIndex;
                const isRejected = request.status === 'REJECTED' && stage === 'Approval';

                return (
                  <div key={stage} className="flex-1 flex flex-col items-center relative text-center">
                    {/* Connecting line */}
                    {idx < STAGES.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 z-0 ${
                          idx < currentStageIndex ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Step Icon Node */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 transition-all ${
                        isFailed
                          ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                          : isRejected
                          ? 'bg-red-600 text-white'
                          : isPassed
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                          ? 'bg-blue-500 text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <span
                      className={`text-[11px] font-semibold mt-2 ${
                        isCurrent || isPassed ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Trace Logs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Autonomous Agent Execution Trace</h3>
          <p className="text-xs text-gray-500">
            Chronological log of simulated software agent invocations, tool calls, and governance decisions.
          </p>
        </div>

        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-xs">
              No agent events logged yet for this request.
            </div>
          ) : (
            events.map((evt, idx) => (
              <div
                key={evt.id}
                className="p-4 rounded-xl border border-gray-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      Step {idx + 1}
                    </span>
                    <span className="font-bold text-gray-900">{evt.agent}</span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-blue-600 font-semibold">{evt.tool}</span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-500 text-[11px] font-medium">{evt.stage}</span>
                  </div>
                  <div className="text-gray-700 font-medium pl-1">{evt.result}</div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-gray-400 flex-shrink-0">
                  <span className="font-mono text-gray-500">{evt.duration}ms</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      evt.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : evt.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
