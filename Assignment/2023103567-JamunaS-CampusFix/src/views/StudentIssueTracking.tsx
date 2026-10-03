import React, { useState, useEffect } from 'react';
import { Issue } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { IssueTimeline } from '../components/IssueTimeline';
import {
  Search,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Tag,
  Building,
  Wrench,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface StudentIssueTrackingProps {
  initialIssueId?: string;
  onClearInitialId?: () => void;
}

export const StudentIssueTracking: React.FC<StudentIssueTrackingProps> = ({
  initialIssueId,
  onClearInitialId,
}) => {
  const [searchId, setSearchId] = useState(initialIssueId || '');
  const [searchedIssue, setSearchedIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (idToSearch: string) => {
    if (!idToSearch.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.issues.track(idToSearch.trim().toUpperCase());
      setSearchedIssue(res.issue);
    } catch (err) {
      setSearchedIssue(null);
      setError((err as Error).message || `No issue found with ID "${idToSearch}".`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialIssueId) {
      setSearchId(initialIssueId);
      performSearch(initialIssueId);
      if (onClearInitialId) onClearInitialId();
    }
  }, [initialIssueId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Campus Issue Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          Enter your unique Issue ID (e.g., <strong>CF-2026-1001</strong>) to view live physical repair updates, technician dispatch, and resolution audit logs.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. CF-2026-1001 or CF-2026-1003"
              className="w-full pl-11 pr-4 py-2.5 text-sm sm:text-base font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="max-w-2xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Issue Reference Not Found</div>
            <p className="mt-0.5 text-xs text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {searchedIssue && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden animate-fade-in">
          {/* Card Top Banner */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm px-3 py-1 bg-blue-600 text-white font-bold rounded-lg tracking-wide">
                {searchedIssue.issueId}
              </span>
              <StatusBadge status={searchedIssue.status} size="md" />
              <PriorityBadge priority={searchedIssue.priority} size="md" />
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Reported {new Date(searchedIssue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Title & Metadata */}
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>{searchedIssue.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {searchedIssue.title}
              </h2>
            </div>

            {/* Location & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-xs">Campus Location</span>
                  <span className="font-semibold text-slate-900">{searchedIssue.location}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Wrench className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-xs">Handling Department</span>
                  <span className="font-semibold text-blue-900">
                    {searchedIssue.assignedDepartment || 'General Administration'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Problem Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-4 leading-relaxed whitespace-pre-line">
                {searchedIssue.description}
              </p>
            </div>

            {/* Attached Photo */}
            {searchedIssue.imageUrl && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Photo Evidence
                </h4>
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100">
                  <img
                    src={searchedIssue.imageUrl}
                    alt={searchedIssue.title}
                    className="w-full h-full object-cover max-h-64"
                  />
                </div>
              </div>
            )}

            {/* Admin Remarks */}
            {searchedIssue.adminRemarks && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs font-bold text-amber-900 block mb-1">
                  Official Administrative Remark
                </span>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  "{searchedIssue.adminRemarks}"
                </p>
              </div>
            )}

            {/* Visual Timeline */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Lifecycle & Resolution Steps
              </h3>
              <IssueTimeline
                currentStatus={searchedIssue.status}
                statusHistory={searchedIssue.statusHistory || []}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
