import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { ShieldCheck, History, User } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await apiService.getAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Immutable Audit & Security Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Complete traceability record storing every data creation, modification, approval, and IP address</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-700/60 uppercase font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Log ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Target Entity</th>
                <th className="p-3">Action</th>
                <th className="p-3">Old Value</th>
                <th className="p-3">New Value / Detail</th>
                <th className="p-3">Changed By</th>
                <th className="p-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono text-[11px]">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">Loading audit log entries...</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">#{log.id}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-semibold">{log.entityName} (#{log.entityId})</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'RETURN' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'CREATE' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{log.oldValue || '-'}</td>
                    <td className="p-3 font-medium max-w-xs truncate">{log.newValue}</td>
                    <td className="p-3 font-bold">{log.changedBy}</td>
                    <td className="p-3 text-slate-400">{log.ipAddress}</td>
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
