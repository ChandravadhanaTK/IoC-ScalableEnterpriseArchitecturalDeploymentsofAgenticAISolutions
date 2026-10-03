import React, { useState } from 'react';
import { PendingAction } from '../../types/agent';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { executeConfirmedAction } from '../../services/agentService';
import { useAuth } from '../../context/AuthContext';
import { usePlants } from '../../context/PlantContext';

interface AgentActionConfirmationProps {
  action: PendingAction;
  onActionComplete: (actionId: string, status: 'confirmed' | 'cancelled', message: string) => void;
}

export const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = ({
  action,
  onActionComplete,
}) => {
  const { user } = useAuth();
  const { refreshData } = usePlants();
  const [submitting, setSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'confirmed' | 'cancelled'>(action.status);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleConfirm = async () => {
    if (!user) return;
    try {
      setSubmitting(true);
      const res = await executeConfirmedAction(action, user.uid);
      if (res.success) {
        setCurrentStatus('confirmed');
        setFeedbackMsg(res.message);
        await refreshData();
        onActionComplete(action.id, 'confirmed', res.message);
      } else {
        setFeedbackMsg(res.message);
      }
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCurrentStatus('cancelled');
    const msg = 'Action was cancelled by user. No data changes were made.';
    setFeedbackMsg(msg);
    onActionComplete(action.id, 'cancelled', msg);
  };

  if (currentStatus === 'confirmed') {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-900">Action Confirmed & Executed</p>
          <p className="mt-0.5 text-emerald-700">{feedbackMsg || 'Your plant care schedule and tasks have been updated in Firestore.'}</p>
        </div>
      </div>
    );
  }

  if (currentStatus === 'cancelled') {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-600 text-xs flex items-center gap-2">
        <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span>Action cancelled. No database changes were made.</span>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl bg-forest-50/70 border border-forest-200/80 shadow-xs">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="p-1.5 rounded-lg bg-forest-100 text-forest-700 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Human-in-the-Loop Confirmation
            </h4>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
              Requires Approval
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-800 mt-1">{action.title}</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{action.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-forest-200/50">
        <button
          type="button"
          disabled={submitting}
          onClick={handleCancel}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={handleConfirm}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-xs transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{submitting ? 'Applying Changes...' : 'Confirm Action'}</span>
        </button>
      </div>
    </div>
  );
};
