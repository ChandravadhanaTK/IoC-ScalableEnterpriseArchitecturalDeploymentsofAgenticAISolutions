import React from 'react';
import { CareStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: CareStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  if (status === 'Overdue') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
        <AlertTriangle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        Overdue
      </span>
    );
  }

  if (status === 'Care Due') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
        <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        Care Due
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
      <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      Healthy
    </span>
  );
};
