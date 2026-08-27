import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusChip } from '../components/common/StatusChip';
import { Link } from 'react-router-dom';
import { CheckCircle2, RotateCcw, Eye, Clock } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const PendingReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnModalReport, setReturnModalReport] = useState(null);
  const [correctionRemark, setCorrectionRemark] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const data = await apiService.getReports({ status: 'SUBMITTED' });
    setReports(data);
    setLoading(false);
  };

  const handleApprove = async (reportId) => {
    await apiService.approveReport(reportId, user);
    setActionSuccess(`Report #${reportId} has been approved and permanently locked.`);
    fetchPending();
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!correctionRemark.trim()) return;

    await apiService.returnReport(returnModalReport.reportId, correctionRemark, user);
    setActionSuccess(`Report #${returnModalReport.reportId} returned for correction.`);
    setReturnModalReport(null);
    setCorrectionRemark('');
    fetchPending();
    setTimeout(() => setActionSuccess(''), 3000);
  };

  if (user?.role === 'ROLE_CAMP_EXEC') {
    return (
      <div className="p-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-center space-y-3">
        <Clock className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-amber-900 dark:text-amber-300">Pending Approvals Access Restricted</h2>
        <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto">
          The Pending Approvals queue is reserved for Department HQ Executives and System Administrators for reviewing and approving submitted daily drilling reports.
        </p>
        <Link to="/my-reports" className="inline-block px-4 py-2 text-xs font-bold rounded-lg bg-cmpdi-navy text-white hover:bg-cmpdi-light transition">
          View My Camp Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Pending Approvals Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Department Executive review portal for submitted daily drilling logs</p>
        </div>
        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold self-start sm:self-auto">
          {reports.length} Reports Awaiting Review
        </span>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {actionSuccess}
        </div>
      )}

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
                <th className="p-3">Shift</th>
                <th className="p-3">Daily Progress</th>
                <th className="p-3">Submitted By</th>
                <th className="p-3 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-400">Loading pending review queue...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-400">No pending reports for review. All reports up to date!</td></tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.reportId} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">#{r.reportId}</td>
                    <td className="p-3 whitespace-nowrap">{r.reportDate}</td>
                    <td className="p-3 font-semibold">{r.campName}</td>
                    <td className="p-3">{r.machineNumber}</td>
                    <td className="p-3 font-bold">{r.drillHole}</td>
                    <td className="p-3">{r.shift?.replace('_', ' ')}</td>
                    <td className="p-3 font-bold text-blue-700 dark:text-sky-300">{r.dailyProgress} m</td>
                    <td className="p-3">{r.createdBy}</td>
                    <td className="p-3 text-right space-x-2">
                      <Link
                        to={`/reports/${r.reportId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </Link>

                      <button
                        onClick={() => handleApprove(r.reportId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>

                      <button
                        onClick={() => { setReturnModalReport(r); setCorrectionRemark(''); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Return
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Correction Remarks Modal */}
      <Modal
        isOpen={!!returnModalReport}
        onClose={() => setReturnModalReport(null)}
        title={`Return Report #${returnModalReport?.reportId} for Correction`}
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <p><span className="font-semibold">Camp:</span> {returnModalReport?.campName}</p>
            <p><span className="font-semibold">Drill Hole:</span> {returnModalReport?.drillHole} ({returnModalReport?.machineNumber})</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mandatory Correction Remarks *
            </label>
            <textarea
              required
              rows="4"
              value={correctionRemark}
              onChange={(e) => setCorrectionRemark(e.target.value)}
              placeholder="State the exact discrepancy or data requiring re-verification by Camp Executive..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReturnModalReport(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              Confirm Return to Camp Executive
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
