import React, { useState } from 'react';
import {
  UserX,
  Boxes,
  RotateCcw,
  CheckCircle2,
  Wrench,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { StorageData, StorageService } from '../../services/storage';
import { Profile, Asset, AssetStatus } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { AssetTools } from '../../services/agents';

interface OffboardingViewProps {
  data: StorageData;
  currentUser: Profile;
  onRefresh: () => void;
}

export const OffboardingView: React.FC<OffboardingViewProps> = ({
  data,
  currentUser,
  onRefresh,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(data.profiles[0]?.id || '');
  const [returnConditionModal, setReturnConditionModal] = useState<Asset | null>(null);
  const [targetStatus, setTargetStatus] = useState<'AVAILABLE' | 'REPAIR' | 'RETIRED'>('AVAILABLE');
  const [inspectionNotes, setInspectionNotes] = useState('Hardware inspected in satisfactory cosmetic and operational condition.');

  const selectedEmployee = data.profiles.find((p) => p.id === selectedUserId);
  const assignedAssets = data.assets.filter((a) => a.owner_id === selectedUserId);

  const handleReturnConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnConditionModal || !selectedEmployee) return;

    StorageService.updateAsset(returnConditionModal.id, {
      owner_id: null,
      status: targetStatus as AssetStatus,
    });

    AssetTools.recordAudit(
      currentUser,
      'ASSET_RETURNED',
      'asset',
      returnConditionModal.tag,
      `Offboarding return from ${selectedEmployee.name}: marked ${targetStatus}. Inspection: ${inspectionNotes}`
    );

    setReturnConditionModal(null);
    onRefresh();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Employee Offboarding & Asset Recovery</h2>
        <p className="text-xs text-gray-500">
          Conduct hardware reconciliation upon employee departure or role change. Direct assets through automated return, diagnostic inspection, and inventory reassignment.
        </p>
      </div>

      {/* Select Employee */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Select Offboarding Employee</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="text-xs p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white min-w-[280px]"
          >
            {data.profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.department} ({p.email})
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <div className="text-right text-xs">
            <span className="text-gray-400 block text-[10px] uppercase font-semibold">Active Deployments</span>
            <span className="text-base font-bold text-blue-600">
              {assignedAssets.length} {assignedAssets.length === 1 ? 'Asset' : 'Assets'} Issued
            </span>
          </div>
        )}
      </div>

      {/* Assigned Assets Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Equipment Custody for {selectedEmployee?.name}
          </h3>
          <span className="text-xs text-gray-400">
            Pipeline: Custody &rarr; Return Initiated &rarr; Inspection &rarr; Reallocation
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {assignedAssets.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              This employee has no active hardware assets currently checked out.
            </div>
          ) : (
            assignedAssets.map((asset) => (
              <div key={asset.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {asset.tag}
                    </span>
                    <strong className="text-gray-900 text-sm">{asset.brand} {asset.model}</strong>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-600">{asset.type}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Value: {formatCurrency(asset.value)} &bull; Health: {asset.health}% &bull; Specs: {asset.ram}GB RAM / {asset.storage}GB
                  </div>
                </div>

                <button
                  onClick={() => {
                    setReturnConditionModal(asset);
                    setTargetStatus('AVAILABLE');
                    setInspectionNotes('Standard hardware check complete. Device formatted and cleared for redistribution.');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start md:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Inspect & Return Asset</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Return Condition Modal */}
      {returnConditionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleReturnConfirm} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Inspection & Return for {returnConditionModal.tag}
            </h3>
            <p className="text-xs text-gray-500">
              Select final post-return condition following hardware triage:
            </p>

            <div className="space-y-2">
              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  targetStatus === 'AVAILABLE'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="AVAILABLE"
                  checked={targetStatus === 'AVAILABLE'}
                  onChange={() => setTargetStatus('AVAILABLE')}
                  className="hidden"
                />
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-gray-900">AVAILABLE (Restock to Active Fleet)</div>
                  <div className="text-[11px] text-gray-500">Device in good condition; immediately ready for reallocation.</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  targetStatus === 'REPAIR'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="REPAIR"
                  checked={targetStatus === 'REPAIR'}
                  onChange={() => setTargetStatus('REPAIR')}
                  className="hidden"
                />
                <Wrench className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-gray-900">REPAIR (Send to Maintenance)</div>
                  <div className="text-[11px] text-gray-500">Physical defects or component degradation detected.</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  targetStatus === 'RETIRED'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="RETIRED"
                  checked={targetStatus === 'RETIRED'}
                  onChange={() => setTargetStatus('RETIRED')}
                  className="hidden"
                />
                <Trash2 className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-gray-900">RETIRED (Decommission & E-Waste)</div>
                  <div className="text-[11px] text-gray-500">End-of-life hardware or beyond economic repair.</div>
                </div>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Inspection Notes</label>
              <textarea
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 border rounded-lg bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnConditionModal(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs"
              >
                Complete Return
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
