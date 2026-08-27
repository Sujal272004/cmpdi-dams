import React from 'react';
import { CheckCircle2, Clock, RotateCcw, FileEdit } from 'lucide-react';

export const StatusChip = ({ status }) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Approved
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Pending Review
        </span>
      );
    case 'RETURNED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Returned for Correction
        </span>
      );
    case 'DRAFT':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
          <FileEdit className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Draft
        </span>
      );
  }
};
