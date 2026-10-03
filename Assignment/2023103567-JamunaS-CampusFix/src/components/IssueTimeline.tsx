import React from 'react';
import { IssueStatus, StatusHistoryItem } from '../types';
import { CheckCircle2, Clock, Wrench, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';

interface IssueTimelineProps {
  currentStatus: IssueStatus;
  statusHistory: StatusHistoryItem[];
}

const STEPS: IssueStatus[] = ['Pending', 'Assigned', 'In Progress', 'Resolved'];

export const IssueTimeline: React.FC<IssueTimelineProps> = ({ currentStatus, statusHistory }) => {
  const isRejected = currentStatus === 'Rejected';

  const getStepIndex = (status: IssueStatus) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Assigned':
        return 1;
      case 'In Progress':
        return 2;
      case 'Resolved':
        return 3;
      case 'Rejected':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(currentStatus);

  return (
    <div className="space-y-6">
      {/* Top Visual Progress Stepper */}
      {!isRejected ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5">
          <div className="relative flex items-center justify-between">
            {/* Background track line */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 z-0" />
            {/* Active track line */}
            <div
              className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 z-0"
              style={{
                width: `${Math.min(100, Math.max(0, (currentStepIdx / (STEPS.length - 1)) * 100))}%`,
                maxWidth: 'calc(100% - 3rem)',
              }}
            />

            {STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 shadow-sm ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                        : isCompleted
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border-2 border-slate-300 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                      isCurrent ? 'text-blue-700 font-semibold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-rose-900">Issue Status: Rejected</span>
            <p className="text-rose-700 text-xs mt-0.5">
              This issue has been closed and rejected by the administration. Check remarks for details.
            </p>
          </div>
        </div>
      )}

      {/* Detailed Chronological History */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Audit Log & Event History ({statusHistory.length})
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {statusHistory.map((item, index) => {
            const dateStr = new Date(item.timestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={index} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                </div>

                <div className="bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        Status updated to{' '}
                        <span className="text-blue-600">{item.status}</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium capitalize">
                        {item.changedByRole}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{dateStr}</span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    Action by: <span className="font-medium text-slate-700">{item.changedBy}</span>
                  </p>

                  {item.department && (
                    <div className="mt-2 text-xs text-slate-700 bg-blue-50/70 border border-blue-100 rounded px-2.5 py-1 inline-flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      Assigned Department: <span className="font-medium">{item.department}</span>
                    </div>
                  )}

                  {item.remarks && (
                    <div className="mt-2 text-xs text-slate-700 bg-slate-50 border border-slate-200/60 rounded p-2.5">
                      <span className="font-medium text-slate-900 block mb-0.5">Remarks / Update Notes:</span>
                      <p className="text-slate-600 italic">"{item.remarks}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
