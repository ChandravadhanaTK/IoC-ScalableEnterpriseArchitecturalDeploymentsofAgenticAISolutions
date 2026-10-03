import React, { useState } from 'react';
import {
  CheckSquare,
  Check,
  X,
  Eye,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { StorageData } from '../../services/storage';
import { Profile } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { AgentOrchestrator } from '../../services/agents';

interface ApprovalsViewProps {
  data: StorageData;
  currentUser: Profile;
  onNavigateToWorkflow: (requestId: string) => void;
  onRefresh: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  data,
  currentUser,
  onNavigateToWorkflow,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedApprovalModal, setSelectedApprovalModal] = useState<{
    requestId: string;
    action: 'approve' | 'reject';
    code: string;
    risk?: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager' || isAdmin;

  // Filter approvals by tab
  const approvalsList = data.approvals.filter((a) => a.status === activeTab);

  const handleActionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApprovalModal) return;
    setErrorMsg('');
    setActionLoading(true);

    try {
      if (selectedApprovalModal.action === 'approve') {
        await AgentOrchestrator.approveRequest(
          selectedApprovalModal.requestId,
          currentUser,
          actionReason
        );
      } else {
        await AgentOrchestrator.rejectRequest(
          selectedApprovalModal.requestId,
          currentUser,
          actionReason
        );
      }
      setSelectedApprovalModal(null);
      setActionReason('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing approval');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Human-in-the-Loop Approval Center</h2>
          <p className="text-xs text-gray-500">
            Review policy-flagged, high-value, and restricted asset requests triaged by the Risk Agent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            Pending Actions:{' '}
            <strong>{data.approvals.filter((a) => a.status === 'PENDING').length}</strong>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-xs font-semibold">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 transition-colors relative ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="capitalize">{tab.toLowerCase()}</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">
              {data.approvals.filter((a) => a.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Request Code</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Asset Desired / Matched</th>
                <th className="py-3 px-4">Risk Profile</th>
                <th className="py-3 px-4">Decision Reason</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {approvalsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No {activeTab.toLowerCase()} approvals at this time.
                  </td>
                </tr>
              ) : (
                approvalsList.map((approval) => {
                  const req = data.asset_requests.find((r) => r.id === approval.request_id);
                  const requester = data.profiles.find((p) => p.id === req?.requester_id);
                  const asset = data.assets.find((a) => a.id === req?.recommended_asset_id);

                  if (!req) return null;

                  const isHighRisk = req.risk === 'HIGH';

                  return (
                    <tr key={approval.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {req.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        <div>{requester?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-gray-400">{req.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">
                          {asset ? `${asset.brand} ${asset.model}` : req.asset_type}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {asset ? formatCurrency(asset.value) : `${req.min_ram}GB RAM`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.risk === 'LOW'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.risk === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {req.risk} RISK
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {approval.reason || req.reason}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {formatDate(approval.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigateToWorkflow(req.id)}
                            title="View Agent Workflow"
                            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-blue-600 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {activeTab === 'PENDING' && isManager && (
                            <>
                              <button
                                onClick={() =>
                                  setSelectedApprovalModal({
                                    requestId: req.id,
                                    action: 'approve',
                                    code: req.code,
                                    risk: req.risk,
                                  })
                                }
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() =>
                                  setSelectedApprovalModal({
                                    requestId: req.id,
                                    action: 'reject',
                                    code: req.code,
                                    risk: req.risk,
                                  })
                                }
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedApprovalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleActionConfirm}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4"
          >
            <div className="flex items-center gap-2">
              {selectedApprovalModal.action === 'approve' ? (
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Check className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <X className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedApprovalModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h3>
                <span className="font-mono text-xs text-blue-600">{selectedApprovalModal.code}</span>
              </div>
            </div>

            {selectedApprovalModal.risk === 'HIGH' && !isAdmin && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>High-Risk Rule:</strong> This ticket was flagged as HIGH RISK and requires Asset Admin authorization.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Review Decision Remarks
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Optional notes or justification..."
                rows={3}
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedApprovalModal(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || (selectedApprovalModal.risk === 'HIGH' && !isAdmin)}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs transition-colors disabled:opacity-50 ${
                  selectedApprovalModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm Decision'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
