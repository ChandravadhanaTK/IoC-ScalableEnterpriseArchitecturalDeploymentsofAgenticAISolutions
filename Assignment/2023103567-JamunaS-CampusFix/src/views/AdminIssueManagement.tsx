import React, { useState, useEffect } from 'react';
import { Issue, IssueCategory, IssuePriority, IssueStatus } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { IssueDetailModal } from '../components/IssueDetailModal';
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Wrench,
  CheckCircle2,
  XCircle,
  FileEdit,
  ExternalLink,
  MapPin,
  Calendar,
  User,
  X,
  AlertCircle,
  Building,
} from 'lucide-react';

const DEPARTMENTS = [
  'Plumbing & Civil Maintenance',
  'Electrical Works & Power Division',
  'Network & IT Infrastructure Cell',
  'Sanitation & Housekeeping Division',
  'Hostel Administration & Estate Management',
  'Academic Facilities & Audio-Visual Cell',
  'Laboratory Technical Support & Safety Cell',
  'Central Library Services',
  'Campus Hospitality & Food Safety Committee',
  'Campus Transport Fleet Operations',
  'General Administration',
];

const STATUSES: IssueStatus[] = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

export const AdminIssueManagement: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');

  // Selected for View Details
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null);

  // Selected for Status & Department Update Modal
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [newStatus, setNewStatus] = useState<IssueStatus>('Pending');
  const [newDepartment, setNewDepartment] = useState('');
  const [newRemarks, setNewRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api.issues.getAllIssues({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        priority: priority !== 'All' ? priority : undefined,
        status: status !== 'All' ? status : undefined,
      });
      setIssues(res.issues || []);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [category, priority, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  };

  const openUpdateModal = (issue: Issue) => {
    setEditingIssue(issue);
    setNewStatus(issue.status);
    setNewDepartment(issue.assignedDepartment || DEPARTMENTS[0]);
    setNewRemarks(issue.adminRemarks || '');
    setActionError(null);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;

    try {
      setUpdating(true);
      setActionError(null);
      const res = await api.issues.update(editingIssue._id, {
        status: newStatus,
        assignedDepartment: newDepartment,
        adminRemarks: newRemarks,
      });

      // Update in state
      setIssues((prev) =>
        prev.map((i) => (i._id === editingIssue._id ? res.issue : i))
      );

      if (detailIssue && detailIssue._id === editingIssue._id) {
        setDetailIssue(res.issue);
      }

      setSuccessBanner(`Issue ${res.issue.issueId} updated successfully.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      setEditingIssue(null);
    } catch (err) {
      setActionError((err as Error).message || 'Failed to update issue.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Issue Management & Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign responsible departments, escalate status workflows, and submit official inspection remarks.
          </p>
        </div>

        <button
          onClick={fetchIssues}
          disabled={loading}
          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between">
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID (e.g. CF-2026-1001), Student, Title, Location, Department..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </span>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Hostel">Hostel</option>
            <option value="Classroom">Classroom</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Library">Library</option>
            <option value="Canteen">Canteen</option>
            <option value="Transport">Transport</option>
            <option value="Electricity">Electricity</option>
            <option value="Water">Water</option>
            <option value="Internet">Internet</option>
            <option value="Cleanliness">Cleanliness</option>
            <option value="Other">Other</option>
          </select>

          {(search || category !== 'All' || priority !== 'All' || status !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setPriority('All');
                setStatus('All');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Fetching complaint records...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No issues match the criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting search filters or parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ref ID</th>
                  <th className="px-5 py-3.5">Title & Student</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Assigned Department</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reported</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-blue-700">
                      {issue.issueId}
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{issue.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{issue.studentName}</span>
                        <span className="text-[10px] text-slate-400">({issue.studentDepartment || 'Student'})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{issue.location}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-xs">
                        {issue.category}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[170px]">{issue.assignedDepartment || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <PriorityBadge priority={issue.priority} size="sm" />
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={issue.status} size="sm" />
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(issue.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => openUpdateModal(issue)}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <FileEdit className="w-3 h-3" />
                        <span>Update</span>
                      </button>

                      <button
                        onClick={() => setDetailIssue(issue)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <IssueDetailModal
        issue={detailIssue}
        isOpen={!!detailIssue}
        onClose={() => setDetailIssue(null)}
        isAdmin={true}
        onAdminAction={() => {
          if (detailIssue) {
            openUpdateModal(detailIssue);
          }
        }}
      />

      {/* Admin Quick Update Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manage Issue: {editingIssue.issueId}
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-sm">{editingIssue.title}</p>
              </div>

              <button
                onClick={() => setEditingIssue(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Issue Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st} {st === 'Resolved' ? '✅' : st === 'Rejected' ? '❌' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign Campus Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Administrative Remarks / Dispatch Notes
                </label>
                <textarea
                  rows={3}
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  placeholder="e.g., Crew dispatched; part ordered; issue resolved and inspected..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  disabled={updating}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Commit Status Update</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
