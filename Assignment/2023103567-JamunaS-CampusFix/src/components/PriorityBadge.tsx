import React from 'react';
import { IssuePriority } from '../types';
import { AlertTriangle, AlertOctagon, Flame, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: IssuePriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  switch (priority) {
    case 'Critical':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-red-100 text-red-800 border border-red-300 font-semibold ${sizeClasses[size]}`}
        >
          <Flame className={`${iconSizes[size]} text-red-600 animate-pulse`} />
          Critical
        </span>
      );
    case 'High':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses[size]}`}
        >
          <AlertOctagon className={`${iconSizes[size]} text-orange-600`} />
          High
        </span>
      );
    case 'Medium':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses[size]}`}
        >
          <AlertTriangle className={`${iconSizes[size]} text-blue-600`} />
          Medium
        </span>
      );
    case 'Low':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
        >
          <ArrowDown className={`${iconSizes[size]} text-slate-500`} />
          Low
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
        >
          {priority}
        </span>
      );
  }
};
