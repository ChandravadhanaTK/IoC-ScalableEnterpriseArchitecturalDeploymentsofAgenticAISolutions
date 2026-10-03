import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit,
  ArrowRightLeft,
  RotateCcw,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  X,
  HardDrive,
  ShieldAlert,
} from 'lucide-react';
import { Asset, Profile, AssetStatus } from '../../types';
import { StorageData, StorageService } from '../../services/storage';
import { formatCurrency, formatDate } from '../../lib/utils';
import { AssetTools } from '../../services/agents';

interface AssetsViewProps {
  data: StorageData;
  currentUser: Profile;
  onRefresh: () => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ data, currentUser, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editModalAsset, setEditModalAsset] = useState<Asset | null>(null);
  const [assignModalAsset, setAssignModalAsset] = useState<Asset | null>(null);
  const [transferModalAsset, setTransferModalAsset] = useState<Asset | null>(null);

  // Edit modal state
  const [editStatus, setEditStatus] = useState<AssetStatus>('AVAILABLE');
  const [editLocation, setEditLocation] = useState('');
  const [editHealth, setEditHealth] = useState(100);

  // Assign modal state
  const [assignUserId, setAssignUserId] = useState('');

  // Transfer modal state
  const [transferToUserId, setTransferToUserId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const isAdmin = currentUser.role === 'admin';

  // Filter assets
  const filteredAssets = data.assets.filter((a) => {
    const matchesSearch =
      a.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || a.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getOwnerName = (ownerId?: string | null) => {
    if (!ownerId) return 'Unassigned';
    const profile = data.profiles.find((p) => p.id === ownerId);
    return profile ? profile.name : 'Unknown';
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalAsset) return;
    StorageService.updateAsset(editModalAsset.id, {
      status: editStatus,
      location: editLocation,
      health: Number(editHealth),
    });
    AssetTools.recordAudit(
      currentUser,
      'ASSET_UPDATED',
      'asset',
      editModalAsset.tag,
      `Status: ${editStatus}, Location: ${editLocation}, Health: ${editHealth}%`
    );
    setEditModalAsset(null);
    onRefresh();
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalAsset || !assignUserId) return;
    StorageService.updateAsset(assignModalAsset.id, {
      owner_id: assignUserId,
      status: 'IN_USE',
    });
    StorageService.addAssignment({
      id: `asgn-${Date.now()}`,
      asset_id: assignModalAsset.id,
      user_id: assignUserId,
      assigned_at: new Date().toISOString(),
    });
    const assignedUser = data.profiles.find((p) => p.id === assignUserId);
    AssetTools.recordAudit(
      currentUser,
      'ASSET_ASSIGNED',
      'asset',
      assignModalAsset.tag,
      `Directly assigned to ${assignedUser?.name || assignUserId}`
    );
    setAssignModalAsset(null);
    onRefresh();
  };

  const handleReturnAsset = (asset: Asset) => {
    if (!window.confirm(`Initiate return inspection for ${asset.tag}? Asset will be marked AVAILABLE.`)) return;
    StorageService.updateAsset(asset.id, {
      owner_id: null,
      status: 'AVAILABLE',
    });
    AssetTools.recordAudit(
      currentUser,
      'ASSET_RETURNED',
      'asset',
      asset.tag,
      'Returned from deployment and marked AVAILABLE'
    );
    onRefresh();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalAsset || !transferToUserId) return;
    StorageService.addTransfer({
      id: `trf-${Date.now()}`,
      asset_id: transferModalAsset.id,
      from_user_id: transferModalAsset.owner_id || currentUser.id,
      to_user_id: transferToUserId,
      reason: transferReason,
      status: 'PENDING_MANAGER_APPROVAL',
      created_at: new Date().toISOString(),
    });
    AssetTools.recordAudit(
      currentUser,
      'TRANSFER_REQUESTED',
      'asset',
      transferModalAsset.tag,
      `Transfer requested to employee ${transferToUserId}`
    );
    setTransferModalAsset(null);
    onRefresh();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Enterprise Asset Inventory</h2>
          <p className="text-xs text-gray-500">
            Searchable catalog of all hardware devices with automated lifecycle intelligence and ownership tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            Total Assets: <strong className="text-gray-900">{filteredAssets.length}</strong>
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by tag, brand, model, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Types</option>
            <option value="Laptop">Laptops</option>
            <option value="Desktop">Desktops</option>
            <option value="Monitor">Monitors</option>
            <option value="Phone">Phones</option>
            <option value="Tablet">Tablets</option>
            <option value="Dock">Docks</option>
            <option value="Headset">Headsets</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="IN_USE">IN_USE</option>
            <option value="REPAIR">REPAIR</option>
            <option value="RETIRED">RETIRED</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Tag</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Specs</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">Replace Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No assets matched the current filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const isReplacementUrgent = asset.replacement_score >= 70;
                  return (
                    <tr key={asset.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {asset.tag}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{asset.brand} {asset.model}</div>
                        <div className="text-[11px] text-gray-400">{asset.type} &bull; {formatCurrency(asset.value)}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {asset.ram > 0 ? `${asset.ram}GB RAM / ${asset.storage}GB` : 'Peripheral'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            asset.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : asset.status === 'IN_USE'
                              ? 'bg-blue-100 text-blue-700'
                              : asset.status === 'REPAIR'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {getOwnerName(asset.owner_id)}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {asset.location}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                asset.health >= 80 ? 'bg-emerald-500' : asset.health >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${asset.health}%` }}
                            />
                          </div>
                          <span className="font-medium text-[11px]">{asset.health}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold text-xs px-2 py-0.5 rounded ${
                            isReplacementUrgent
                              ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200'
                              : asset.replacement_score >= 40
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {asset.replacement_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            title="View Details"
                            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-blue-600 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                setEditModalAsset(asset);
                                setEditStatus(asset.status);
                                setEditLocation(asset.location);
                                setEditHealth(asset.health);
                              }}
                              title="Edit Asset"
                              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-indigo-600 rounded transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdmin && asset.status === 'AVAILABLE' && (
                            <button
                              onClick={() => {
                                setAssignModalAsset(asset);
                                setAssignUserId(data.profiles[0].id);
                              }}
                              title="Direct Assign"
                              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-emerald-600 rounded transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {asset.status === 'IN_USE' && (
                            <>
                              <button
                                onClick={() => {
                                  setTransferModalAsset(asset);
                                  setTransferToUserId(data.profiles[1].id);
                                }}
                                title="Transfer"
                                className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-amber-600 rounded transition-colors"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleReturnAsset(asset)}
                                  title="Return Asset"
                                  className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-rose-600 rounded transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
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

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedAsset.tag}</span>
                <h3 className="text-base font-bold text-gray-900">{selectedAsset.brand} {selectedAsset.model}</h3>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <span className="text-gray-400 block text-[10px]">Type & Value</span>
                <strong className="text-gray-800">{selectedAsset.type} &bull; {formatCurrency(selectedAsset.value)}</strong>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <span className="text-gray-400 block text-[10px]">Current Status</span>
                <strong className="text-gray-800">{selectedAsset.status}</strong>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <span className="text-gray-400 block text-[10px]">CPU / Specs</span>
                <strong className="text-gray-800">{selectedAsset.cpu || 'N/A'}</strong>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <span className="text-gray-400 block text-[10px]">RAM & Storage</span>
                <strong className="text-gray-800">{selectedAsset.ram} GB RAM / {selectedAsset.storage} GB</strong>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <span className="text-gray-400 block text-[10px]">Current Owner</span>
                <strong className="text-gray-800">{getOwnerName(selectedAsset.owner_id)}</strong>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg">
                <span className="text-gray-400 block text-[10px]">Warranty Valid Until</span>
                <strong className="text-gray-800">{selectedAsset.warranty_until}</strong>
              </div>
            </div>

            {/* Lifecycle & Repairs */}
            <div className="border-t pt-3">
              <h4 className="text-xs font-bold text-gray-700 mb-2">Lifecycle Health & Repair History</h4>
              <div className="flex items-center justify-between text-xs mb-2">
                <span>Replacement Score:</span>
                <span className="font-bold text-rose-600">{selectedAsset.replacement_score}/100</span>
              </div>
              <div className="text-xs text-gray-500">
                Total logged repairs: <strong>{selectedAsset.repairs_count}</strong>
              </div>
              {data.repairs.filter((r) => r.asset_id === selectedAsset.id).map((r) => (
                <div key={r.id} className="mt-1.5 p-2 bg-amber-50/70 border border-amber-200/60 rounded text-[11px] text-amber-800 flex justify-between">
                  <span>{r.issue} ({r.repair_date})</span>
                  <strong>{formatCurrency(r.cost)}</strong>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Admin) */}
      {editModalAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEditSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Edit Asset: {editModalAsset.tag}</h3>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AssetStatus)}
                className="w-full text-xs p-2 border rounded-lg"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="IN_USE">IN_USE</option>
                <option value="REPAIR">REPAIR</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Location</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full text-xs p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Health ({editHealth}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={editHealth}
                onChange={(e) => setEditHealth(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModalAsset(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded font-semibold hover:bg-blue-500"
              >
                Save Updates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Direct Assign Modal (Admin) */}
      {assignModalAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAssignSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Directly Assign Asset: {assignModalAsset.tag}</h3>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Assign to Employee</label>
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="w-full text-xs p-2 border rounded-lg"
                required
              >
                {data.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department} - {p.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalAsset(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-500"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleTransferSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Request Transfer: {transferModalAsset.tag}</h3>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Transfer to Employee</label>
              <select
                value={transferToUserId}
                onChange={(e) => setTransferToUserId(e.target.value)}
                className="w-full text-xs p-2 border rounded-lg"
                required
              >
                {data.profiles.filter((p) => p.id !== transferModalAsset.owner_id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Business Reason</label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Reason for asset reassignment..."
                className="w-full text-xs p-2 border rounded-lg h-20"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferModalAsset(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded font-semibold hover:bg-amber-500"
              >
                Submit Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
