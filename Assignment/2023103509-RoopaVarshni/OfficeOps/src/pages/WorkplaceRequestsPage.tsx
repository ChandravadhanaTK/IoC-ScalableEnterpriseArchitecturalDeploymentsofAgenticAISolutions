import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Wrench,
  Laptop,
  Users2,
  Box,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { 
  WorkplaceRequest, 
  WorkplaceRequestType, 
  WorkplaceRequestPriority, 
  User 
} from '../types';
import { storage } from '../services/storage';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface WorkplaceRequestsPageProps {
  currentUser: User;
  onShowToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const WorkplaceRequestsPage: React.FC<WorkplaceRequestsPageProps> = ({
  currentUser,
  onShowToast
}) => {
  const [requests, setRequests] = useState<WorkplaceRequest[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Request Form State
  const [newType, setNewType] = useState<WorkplaceRequestType>('it_support');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<WorkplaceRequestPriority>('medium');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    const refresh = () => setRequests(storage.getRequests());
    refresh();
    const unsub = storage.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRequest: WorkplaceRequest = {
      id: `REQ-${Math.floor(4000 + Math.random() * 1000)}`,
      type: newType,
      title: newTitle,
      requester: currentUser.name,
      requesterEmail: currentUser.email,
      department: currentUser.department,
      priority: newPriority,
      status: 'pending',
      description: newDescription || 'Standard workplace service request submitted.',
      createdAt: new Date().toISOString()
    };

    storage.addRequest(newRequest);
    storage.addAuditLog({
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'SERVICE_REQUEST_FILED',
      targetResource: newRequest.id,
      decision: 'created',
      details: `Filed ${newType} ticket: "${newTitle}" (${newPriority} priority)`
    });

    setIsNewModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    onShowToast('Request Submitted', `Ticket ${newRequest.id} has been entered into queue.`, 'success');
  };

  const handleUpdateStatus = (req: WorkplaceRequest, newStatus: WorkplaceRequest['status']) => {
    const updated = {
      ...req,
      status: newStatus,
      resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : undefined
    };
    storage.updateRequest(updated);
    storage.addAuditLog({
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'REQUEST_STATUS_UPDATED',
      targetResource: req.id,
      decision: newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'executed',
      details: `Updated request status to ${newStatus.toUpperCase()}`
    });
    onShowToast('Ticket Updated', `Request ${req.id} is now ${newStatus}.`, 'info');
  };

  const getTypeIcon = (type: WorkplaceRequestType) => {
    switch (type) {
      case 'it_support':
        return <Laptop className="w-3.5 h-3.5 text-sky-400" />;
      case 'maintenance':
        return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
      case 'visitor_management':
        return <Users2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'equipment_request':
        return <Box className="w-3.5 h-3.5 text-indigo-400" />;
      case 'employee_onboarding':
        return <UserPlus className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.requester.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            <span>Workplace Operations Service Desk</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise facility service management, IT provisioning, and logistics ticketing
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Workplace Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-72 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, requester..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 flex-1 md:flex-none"
          >
            <option value="all">All Request Types</option>
            <option value="it_support">IT Support</option>
            <option value="maintenance">Facilities / Maintenance</option>
            <option value="visitor_management">Visitor Management</option>
            <option value="equipment_request">Equipment Allocation</option>
            <option value="employee_onboarding">Employee Onboarding</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 flex-1 md:flex-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="approved">Approved</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Requester</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-indigo-400">
                    {req.id}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 capitalize">
                      {getTypeIcon(req.type)}
                      <span>{req.type.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-white truncate max-w-xs">{req.title}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{req.description}</div>
                  </td>
                  <td className="py-3.5 px-4 font-sans text-slate-300">
                    <div>{req.requester}</div>
                    <div className="text-[10px] text-slate-400">{req.department}</div>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <Badge
                      variant={
                        req.priority === 'urgent'
                          ? 'danger'
                          : req.priority === 'high'
                          ? 'warning'
                          : req.priority === 'medium'
                          ? 'info'
                          : 'default'
                      }
                      size="sm"
                    >
                      {req.priority}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <Badge
                      variant={
                        req.status === 'resolved'
                          ? 'success'
                          : req.status === 'approved'
                          ? 'purple'
                          : req.status === 'in_progress'
                          ? 'info'
                          : req.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {req.createdAt.split('T')[0]}
                  </td>
                  <td className="py-3.5 px-4 text-right font-sans">
                    {(currentUser.role === 'operations_manager' || currentUser.role === 'admin') ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(req, 'approved')}
                            className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white text-[11px] font-semibold transition-all"
                          >
                            Approve
                          </button>
                        )}
                        {req.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(req, 'resolved')}
                            className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-semibold transition-all"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Tracking</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Request Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Submit Workplace Service Request"
        subtitle="Route request through workplace operations management"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Request Category</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as WorkplaceRequestType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="it_support">IT Support & Hardware</option>
              <option value="maintenance">Facility Maintenance & HVAC</option>
              <option value="visitor_management">Visitor Passes & Security</option>
              <option value="equipment_request">Equipment Allocation</option>
              <option value="employee_onboarding">Employee Onboarding Desk</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Subject / Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Request dual monitor dock setup in Room 402"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Priority Level</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as WorkplaceRequestPriority)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="low">Low (Standard SLA: 48h)</option>
              <option value="medium">Medium (Standard SLA: 24h)</option>
              <option value="high">High (Priority SLA: 4h)</option>
              <option value="urgent">Urgent (Immediate Operations SLA)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Detailed Description</label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Provide context, room numbers, serial tags or special requirements..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            Requester: <strong className="text-white">{currentUser.name}</strong> &bull; Dept: {currentUser.department}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
