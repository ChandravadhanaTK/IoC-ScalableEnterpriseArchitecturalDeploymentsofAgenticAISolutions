import React from 'react';
import { IssueStatus } from '../types';
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  switch (status) {
    case 'Pending':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses[size]}`}
        >
          <Clock className={iconSizes[size]} />
          Pending
        </span>
      );
    case 'Assigned':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses[size]}`}
        >
          <ArrowUpRight className={iconSizes[size]} />
          Assigned
        </span>
      );
    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${sizeClasses[size]}`}
        >
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          In Progress
        </span>
      );
    case 'Resolved':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className={iconSizes[size]} />
          Resolved
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses[size]}`}
        >
          <XCircle className={iconSizes[size]} />
          Rejected
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
        >
          <AlertCircle className={iconSizes[size]} />
          {status}
        </span>
      );
  }
};
