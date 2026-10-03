import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Issue, StudentStats } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { IssueDetailModal } from '../components/IssueDetailModal';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Calendar,
  MapPin,
  ExternalLink,
  Loader2,
  RefreshCw,
  Building,
  GraduationCap,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
  onOpenReportModal: () => void;
  onSelectTrackIssue: (issueId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenReportModal,
  onSelectTrackIssue,
}) => {
  const { user, logout } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalIssues: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [issuesRes, statsRes] = await Promise.all([
        api.issues.getMyIssues(),
        api.issues.getMyStats(),
      ]);
      setIssues(issuesRes.issues || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = filterCategory === 'All' || issue.category === filterCategory;
    const matchesSearch =
      searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issueId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/60 border border-blue-400/30 text-xs font-semibold mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Portal • {user?.department || 'Undergraduate'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-blue-100 max-w-xl">
              Report campus facilities, track real-time resolution progress, and monitor physical repairs across your hostel and departments.
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>+ Report New Issue</span>
            </button>
            <button
              onClick={() => onNavigate('track-issue')}
              className="px-4 py-2.5 bg-blue-600/70 hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm rounded-xl border border-blue-400/40 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Track Issues</span>
            </button>
            <button
              onClick={() => onNavigate('student-profile')}
              className="px-3.5 py-2.5 bg-blue-900/50 hover:bg-blue-900 text-white font-semibold text-xs sm:text-sm rounded-xl border border-blue-400/30 transition-colors"
            >
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Total, Pending, In Progress, Resolved */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Issues</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalIssues}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Registered under your account</span>
        </div>

        <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">{stats.pending}</div>
          <span className="text-[11px] text-amber-600/80 mt-1 block">Awaiting admin triage</span>
        </div>

        <div className="bg-white border border-indigo-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
              </span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900">
            {stats.inProgress + stats.assigned}
          </div>
          <span className="text-[11px] text-indigo-600/80 mt-1 block">Technicians actively on task</span>
        </div>

        <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">{stats.resolved}</div>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">Successfully inspected & fixed</span>
        </div>
      </div>

      {/* Recent Issues Table & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>My Campus Complaints</span>
              <button
                onClick={loadData}
                disabled={loading}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                title="Refresh table"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </h2>
            <p className="text-xs text-slate-500">
              Showing issues you have submitted along with assigned crews and status updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues, IDs, locations..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
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
          </div>
        </div>

        {/* Content list/table */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading complaints from database...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No issues found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || filterCategory !== 'All'
                ? 'Try adjusting your search query or category filter.'
                : 'You have not submitted any complaints yet. Report an issue to get started.'}
            </p>
            <button
              onClick={onOpenReportModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Issue Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Issue ID</th>
                  <th className="px-5 py-3.5">Title & Description</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reported</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue._id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-blue-700">
                      {issue.issueId}
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {issue.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {issue.description}
                      </div>
                      {issue.assignedDepartment && (
                        <div className="text-[10px] text-blue-600 font-medium mt-1">
                          ↳ {issue.assignedDepartment}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-xs">
                        {issue.category}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-slate-600 text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{issue.location}</span>
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

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
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

      {/* Issue Detail Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />
    </div>
  );
};
