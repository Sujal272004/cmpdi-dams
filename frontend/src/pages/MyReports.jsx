import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusChip } from '../components/common/StatusChip';
import { Link } from 'react-router-dom';
import { Eye, Edit3, PlusCircle, Search, Trash2 } from 'lucide-react';

export const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReports();
  }, [user, statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    const data = await apiService.getReports({
      campId: user?.campId || null,
      status: statusFilter || null
    });
    setReports(data);
    setLoading(false);
  };

  const handleDeleteDraft = async (reportId) => {
    if (window.confirm(`Are you sure you want to delete Draft Report #${reportId}? This action cannot be undone.`)) {
      await apiService.deleteReport(reportId, user);
      fetchReports();
    }
  };

  const filteredReports = reports.filter(r => 
    r.drillHole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.machineNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.formation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">My Camp Drilling Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Reports recorded for {user?.campName || 'All Camps'}</p>
        </div>

        <Link
          to="/entry"
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-cmpdi-navy text-white hover:bg-cmpdi-light transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" /> New Daily Report Entry
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Drill Hole, Machine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cmpdi-navy"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Drafts</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="RETURNED">Returned for Correction</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
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
                <th className="p-3">Opening (m)</th>
                <th className="p-3">Closing (m)</th>
                <th className="p-3">Daily Progress</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="11" className="p-8 text-center text-slate-400">Loading daily reports...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan="11" className="p-8 text-center text-slate-400">No daily reports found.</td></tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.reportId} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">#{r.reportId}</td>
                    <td className="p-3 whitespace-nowrap">{r.reportDate}</td>
                    <td className="p-3 font-semibold">{r.campName}</td>
                    <td className="p-3">{r.machineNumber}</td>
                    <td className="p-3 font-bold">{r.drillHole}</td>
                    <td className="p-3">{r.shift?.replace('_', ' ')}</td>
                    <td className="p-3">{r.openingDepth}</td>
                    <td className="p-3">{r.closingDepth}</td>
                    <td className="p-3 font-bold text-blue-700 dark:text-sky-300">{r.dailyProgress} m</td>
                    <td className="p-3"><StatusChip status={r.reportStatus} /></td>
                    <td className="p-3 text-right space-x-1.5">
                      <Link
                        to={`/reports/${r.reportId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      {(r.reportStatus === 'DRAFT' || r.reportStatus === 'RETURNED') && (
                        <Link
                          to={`/reports/${r.reportId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </Link>
                      )}
                      {r.reportStatus === 'DRAFT' && (
                        <button
                          onClick={() => handleDeleteDraft(r.reportId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition"
                          title="Delete Draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
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
