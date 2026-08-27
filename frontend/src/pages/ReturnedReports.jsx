import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { StatusChip } from '../components/common/StatusChip';
import { Link } from 'react-router-dom';
import { RotateCcw, Edit3, AlertCircle, MessageSquareWarning } from 'lucide-react';

export const ReturnedReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturned();
  }, []);

  const fetchReturned = async () => {
    setLoading(true);
    const data = await apiService.getReports({ status: 'RETURNED' });
    setReports(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-500" /> Returned Reports for Correction
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Reports sent back by Department HQ requiring field revision and resubmission</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl">Loading returned reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl">No returned reports requiring correction.</div>
        ) : (
          reports.map((r) => (
            <div key={r.reportId} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-rose-200 dark:border-rose-900/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-cmpdi-navy dark:text-sky-400">Report #{r.reportId}</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{r.campName}</span>
                  <StatusChip status={r.reportStatus} />
                </div>
                <Link
                  to={`/reports/${r.reportId}`}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit & Resubmit
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-slate-500">Date:</span> <p className="font-semibold">{r.reportDate}</p></div>
                <div><span className="text-slate-500">Machine:</span> <p className="font-semibold">{r.machineNumber}</p></div>
                <div><span className="text-slate-500">Drill Hole:</span> <p className="font-semibold">{r.drillHole}</p></div>
                <div><span className="text-slate-500">Daily Progress:</span> <p className="font-semibold text-blue-600">{r.dailyProgress} m</p></div>
              </div>

              {/* Correction remarks timeline box */}
              <div className="p-3 bg-rose-50/80 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 text-xs">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold mb-1">
                  <MessageSquareWarning className="w-4 h-4 text-rose-600" />
                  <span>HQ Department Correction Remark:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 pl-5">
                  "{r.correctionHistory?.[0]?.remarks || 'Field data requires re-verification before HQ approval.'}"
                </p>
                <div className="text-[10px] text-slate-400 pl-5 mt-1">
                  Issued by {r.correctionHistory?.[0]?.createdBy || 'Dept Executive'} on {r.correctionHistory?.[0]?.createdAt ? new Date(r.correctionHistory[0].createdAt).toLocaleDateString() : 'Recent'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
