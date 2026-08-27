import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusChip } from '../components/common/StatusChip';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Eye, Download, Trash2 } from 'lucide-react';

export const ApprovedReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    setLoading(true);
    const data = await apiService.getReports({ status: 'APPROVED' });
    setReports(data);
    setLoading(false);
  };

  const handleDeleteApproved = async (reportId) => {
    if (window.confirm(`[ADMIN ONLY] Are you sure you want to delete Approved Report #${reportId}? This action cannot be undone.`)) {
      try {
        await apiService.deleteReport(reportId, user);
        fetchApproved();
      } catch (err) {
        alert("Failed to delete approved report: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Approved &amp; Permanently Locked Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Verified official drilling records archived for historical auditing</p>
        </div>

        <Link
          to="/export"
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Download className="w-4 h-4" /> Export Official Register
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-700/60 uppercase font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Report ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Camp</th>
                <th className="p-3">Machine</th>
                <th className="p-3">Drill Hole</th>
                <th className="p-3">Shift Progress</th>
                <th className="p-3">Lithology</th>
                <th className="p-3">Approved By</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="10" className="p-8 text-center text-slate-400">Loading approved records...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="10" className="p-8 text-center text-slate-400">No approved reports found.</td></tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.reportId} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">#{r.reportId}</td>
                    <td className="p-3 whitespace-nowrap">{r.reportDate}</td>
                    <td className="p-3 font-semibold">{r.campName}</td>
                    <td className="p-3">{r.machineNumber}</td>
                    <td className="p-3 font-bold">{r.drillHole}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{r.dailyProgress} m</td>
                    <td className="p-3 truncate max-w-xs">{r.formation}</td>
                    <td className="p-3 font-semibold">{r.approvedBy || 'Dr. Sunita Deshmukh'}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        <Lock className="w-3 h-3 text-emerald-600" /> Locked
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/reports/${r.reportId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </Link>
                        {user?.role === 'ROLE_ADMIN' && (
                          <button
                            onClick={() => handleDeleteApproved(r.reportId)}
                            title="Delete approved report (System Admin only)"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
