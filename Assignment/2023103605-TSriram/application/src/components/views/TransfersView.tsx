import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  X,
  Plus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { StorageData, StorageService } from '../../services/storage';
import { Profile, Transfer } from '../../types';
import { formatDate } from '../../lib/utils';
import { AssetTools } from '../../services/agents';

interface TransfersViewProps {
  data: StorageData;
  currentUser: Profile;
  onRefresh: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  data,
  currentUser,
  onRefresh,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedToUserId, setSelectedToUserId] = useState('');
  const [reason, setReason] = useState('');

  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';

  // Only assets currently in use can be transferred
  const inUseAssets = data.assets.filter((a) => a.status === 'IN_USE');

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedToUserId || !reason.trim()) return;

    const asset = data.assets.find((a) => a.id === selectedAssetId);
    if (!asset) return;

    const newTransfer: Transfer = {
      id: `trf-${Date.now()}`,
      asset_id: asset.id,
      from_user_id: asset.owner_id || currentUser.id,
      to_user_id: selectedToUserId,
      reason,
      status: 'PENDING_MANAGER_APPROVAL',
      created_at: new Date().toISOString(),
    };

    StorageService.addTransfer(newTransfer);
    AssetTools.recordAudit(
      currentUser,
      'TRANSFER_REQUESTED',
      'asset',
      asset.tag,
      `Transfer requested from current owner to user ${selectedToUserId}: ${reason}`
    );

    setShowCreateModal(false);
    setSelectedAssetId('');
    setSelectedToUserId('');
    setReason('');
    onRefresh();
  };

  const handleApproveTransfer = (transfer: Transfer) => {
    const asset = data.assets.find((a) => a.id === transfer.asset_id);
    const toUser = data.profiles.find((p) => p.id === transfer.to_user_id);
    if (!asset || !toUser) return;

    // Update transfer
    StorageService.updateTransfer(transfer.id, {
      status: 'APPROVED',
      approver_id: currentUser.id,
    });

    // Update asset owner
    StorageService.updateAsset(asset.id, {
      owner_id: toUser.id,
      department: toUser.department,
    });

    // Record assignment
    StorageService.addAssignment({
      id: `asgn-${Date.now()}`,
      asset_id: asset.id,
      user_id: toUser.id,
      assigned_at: new Date().toISOString(),
    });

    AssetTools.recordAudit(
      currentUser,
      'TRANSFER_APPROVED',
      'transfer',
      transfer.id,
      `Asset ${asset.tag} ownership officially transferred to ${toUser.name}`
    );

    onRefresh();
  };

  const handleRejectTransfer = (transfer: Transfer) => {
    StorageService.updateTransfer(transfer.id, {
      status: 'REJECTED',
      approver_id: currentUser.id,
    });

    AssetTools.recordAudit(
      currentUser,
      'TRANSFER_REJECTED',
      'transfer',
      transfer.id,
      'Asset transfer rejected by manager'
    );

    onRefresh();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Internal Asset Transfers</h2>
          <p className="text-xs text-gray-500">
            Facilitate intra-organization equipment reassignment between team members under manager approval.
          </p>
        </div>
        <button
          onClick={() => {
            if (inUseAssets.length > 0) {
              setSelectedAssetId(inUseAssets[0].id);
              setSelectedToUserId(data.profiles.filter((p) => p.id !== inUseAssets[0].owner_id)[0]?.id || '');
            }
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset Tag</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">From Employee</th>
                <th className="py-3 px-4">To Employee</th>
                <th className="py-3 px-4">Business Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No transfer records found.
                  </td>
                </tr>
              ) : (
                data.transfers.map((t) => {
                  const asset = data.assets.find((a) => a.id === t.asset_id);
                  const fromUser = data.profiles.find((p) => p.id === t.from_user_id);
                  const toUser = data.profiles.find((p) => p.id === t.to_user_id);

                  return (
                    <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {asset?.tag || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {asset ? `${asset.brand} ${asset.model}` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {fromUser?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {toUser?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {t.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status === 'PENDING_MANAGER_APPROVAL' ? 'Pending Approval' : t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {t.status === 'PENDING_MANAGER_APPROVAL' && isManager ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveTransfer(t)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectTransfer(t)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">Finalized</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTransfer} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-base font-bold text-gray-900">Initiate Hardware Asset Transfer</h3>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Select Asset to Transfer</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg bg-gray-50 focus:bg-white"
                required
              >
                {inUseAssets.map((a) => {
                  const owner = data.profiles.find((p) => p.id === a.owner_id);
                  return (
                    <option key={a.id} value={a.id}>
                      {a.tag} — {a.brand} {a.model} (Owner: {owner?.name || 'Assigned'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Transfer To (Recipient)</label>
              <select
                value={selectedToUserId}
                onChange={(e) => setSelectedToUserId(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg bg-gray-50 focus:bg-white"
                required
              >
                {data.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Business Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State reason for transfer (e.g. project role transition)..."
                rows={3}
                className="w-full text-xs p-2.5 border rounded-lg bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs"
              >
                Submit Transfer Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
