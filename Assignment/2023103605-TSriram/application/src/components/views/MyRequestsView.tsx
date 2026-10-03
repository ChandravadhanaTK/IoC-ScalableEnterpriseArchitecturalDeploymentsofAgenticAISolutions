import React from 'react';
import {
  Clock,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { StorageData } from '../../services/storage';
import { Profile } from '../../types';
import { formatDate } from '../../lib/utils';

interface MyRequestsViewProps {
  data: StorageData;
  currentUser: Profile;
  onNavigateToWorkflow: (requestId: string) => void;
  onNavigateToRequest: () => void;
}

export const MyRequestsView: React.FC<MyRequestsViewProps> = ({
  data,
  currentUser,
  onNavigateToWorkflow,
  onNavigateToRequest,
}) => {
  // If user is admin/manager, show all or user's requests
  const userRequests = data.asset_requests.filter(
    (r) => r.requester_id === currentUser.id || currentUser.role === 'admin'
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Hardware Requisitions & Tickets</h2>
          <p className="text-xs text-gray-500">
            {currentUser.role === 'admin'
              ? 'All active and completed equipment requests across enterprise departments.'
              : `Tracking requests submitted by ${currentUser.name}.`}
          </p>
        </div>
        <button
          onClick={onNavigateToRequest}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Asset Type</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Risk Profile</th>
                <th className="py-3 px-4">Recommended Asset</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No requests found. Click "New Requisition" to submit equipment requirements.
                  </td>
                </tr>
              ) : (
                userRequests.map((req) => {
                  const asset = data.assets.find((a) => a.id === req.recommended_asset_id);
                  return (
                    <tr key={req.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {req.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {req.asset_type}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {req.purpose}
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
                          {req.risk || 'ANALYZING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {asset ? `${asset.tag} (${asset.brand} ${asset.model})` : 'Searching Catalog'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : req.status === 'APPROVAL_REQUIRED'
                              ? 'bg-amber-100 text-amber-700'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-700'
                              : req.status === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToWorkflow(req.id)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Trace</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
