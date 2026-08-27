import React from 'react';

export const KpiCard = ({ title, value, unit, icon: Icon, color = 'blue', trend, subtext }) => {
  const colorClasses = {
    blue: 'border-l-4 border-l-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    emerald: 'border-l-4 border-l-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
    amber: 'border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
    rose: 'border-l-4 border-l-rose-600 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400',
    indigo: 'border-l-4 border-l-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400',
    cyan: 'border-l-4 border-l-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400'
  };

  return (
    <div className={`p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 transition-all hover:shadow-md ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
            {unit && <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>}
          </div>
          {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-white dark:bg-slate-700 shadow-xs border border-slate-100 dark:border-slate-600">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
