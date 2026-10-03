import React from 'react';
import { Issue } from '../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { IssueTimeline } from './IssueTimeline';
import {
  X,
  MapPin,
  Calendar,
  Building2,
  User,
  Mail,
  GraduationCap,
  Tag,
  Wrench,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface IssueDetailModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onAdminAction?: () => void;
  isAdmin?: boolean;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  isOpen,
  onClose,
  onAdminAction,
  isAdmin = false,
}) => {
  if (!isOpen || !issue) return null;

  const createdDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md font-semibold tracking-wide">
              {issue.issueId}
            </span>
            <StatusBadge status={issue.status} size="md" />
            <PriorityBadge priority={issue.priority} size="md" />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Title & Category Banner */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Tag className="w-3.5 h-3.5" />
              <span>Category: {issue.category}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{issue.title}</h2>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block text-xs">Location</span>
                <span className="font-medium text-slate-900">{issue.location}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block text-xs">Reported On</span>
                <span className="font-medium text-slate-900">{createdDate}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-700">
              <Wrench className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block text-xs">Assigned Department</span>
                <span className="font-semibold text-blue-900">
                  {issue.assignedDepartment || 'Pending Assignment'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-700">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block text-xs">Submitted By</span>
                <span className="font-medium text-slate-900">
                  {issue.studentName}{' '}
                  <span className="text-slate-500 font-normal">({issue.studentDepartment || 'Student'})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Description & Findings
            </h4>
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {issue.description}
            </div>
          </div>

          {/* Image if available */}
          {issue.imageUrl && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Attached Photo Evidence
              </h4>
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-72">
                <img
                  src={issue.imageUrl}
                  alt={issue.title}
                  className="w-full h-full object-cover max-h-72 hover:scale-102 transition-transform duration-300"
                />
              </div>
            </div>
          )}

          {/* Admin Remarks banner if present */}
          {issue.adminRemarks && (
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm mb-1">
                <span>Official Campus Administrative Remarks</span>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{issue.adminRemarks}</p>
            </div>
          )}

          {/* Timeline Section */}
          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Resolution Progress & Lifecycle</h3>
            <IssueTimeline currentStatus={issue.status} statusHistory={issue.statusHistory || []} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Last updated: {new Date(issue.updatedAt || issue.createdAt).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onAdminAction && (
              <button
                onClick={onAdminAction}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Update Status & Department
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
