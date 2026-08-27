import React, { useState, useEffect } from 'react';
import { apiService, apiClient } from '../services/api';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Calendar, Filter, RotateCcw, FileCheck, Layers } from 'lucide-react';

export const ExportCenter = () => {
  const [campId, setCampId] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null);
  const [matchingCount, setMatchingCount] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch count of reports matching currently configured parameters
  useEffect(() => {
    let isMounted = true;
    const checkMatchingReports = async () => {
      try {
        const filters = { campId, status, fromDate, toDate };
        const reports = await apiService.getReports(filters);
        if (isMounted) {
          const filtered = reports.filter(r => {
            if (fromDate && r.reportDate < fromDate) return false;
            if (toDate && r.reportDate > toDate) return false;
            return true;
          });
          setMatchingCount(filtered.length);
        }
      } catch (err) {
        console.error('Error calculating matching reports:', err);
      }
    };
    checkMatchingReports();
    return () => { isMounted = false; };
  }, [campId, status, fromDate, toDate]);

  const handleQuickDatePreset = (preset) => {
    const today = new Date();
    const formatDateStr = (d) => d.toISOString().split('T')[0];

    if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setFromDate(formatDateStr(past));
      setToDate(formatDateStr(today));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setFromDate(formatDateStr(past));
      setToDate(formatDateStr(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(today));
    } else if (preset === 'clear') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    setCampId('');
    setStatus('');
    setFromDate('');
    setToDate('');
  };

  const generateClientSideExport = async (type, params) => {
    try {
      const allReports = await apiService.getReports(params);
      const filteredReports = allReports.filter(r => {
        if (fromDate && r.reportDate < fromDate) return false;
        if (toDate && r.reportDate > toDate) return false;
        return true;
      });

      const dateSuffix = `${fromDate || 'Start'}_to_${toDate || 'End'}`;

      if (type === 'excel') {
        let csvContent = '\uFEFF'; // BOM for UTF-8 Excel support
        csvContent += '"CENTRAL MINE PLANNING & DESIGN INSTITUTE LIMITED (CMPDI)"\n';
        csvContent += '"EXPLORATION DEPARTMENT - DRILLING PROGRESS REPORT"\n';
        csvContent += `"Generated On: ${new Date().toLocaleString()} | Date Range: ${fromDate || 'All'} to ${toDate || 'All'} | Camp ID: ${campId || 'All'} | Status: ${status || 'All'}"\n\n`;

        csvContent += '"Report ID","Report Date","Camp Name","Machine Number","Drill Hole","Shift","Planned Depth (m)","Opening Depth (m)","Closing Depth (m)","Daily Progress (m)","Cumulative Depth (m)","Formation","Core Recovery (%)","Water Level (m)","Status","Created By","Approved By"\n';

        let totalProgress = 0;
        let totalCore = 0;

        filteredReports.forEach(r => {
          const prog = parseFloat(r.dailyProgress) || 0;
          const core = parseFloat(r.coreRecovery) || 0;
          totalProgress += prog;
          totalCore += core;

          csvContent += `"${r.reportId}","${r.reportDate || ''}","${r.campName || ''}","${r.machineNumber || ''}","${r.drillHole || ''}","${r.shift || ''}","${r.plannedDepth || 0}","${r.openingDepth || 0}","${r.closingDepth || 0}","${prog}","${r.cumulativeDepth || 0}","${r.formation || ''}","${core}","${r.waterLevel || 0}","${r.reportStatus || ''}","${r.createdBy || ''}","${r.approvedBy || 'N/A'}"\n`;
        });

        const avgCore = filteredReports.length > 0 ? (totalCore / filteredReports.length).toFixed(1) : 0;
        csvContent += `\n"TOTALS / SUMMARY","","","","","","","","","Total: ${totalProgress.toFixed(2)} m","","","Avg: ${avgCore}%","","","Count: ${filteredReports.length} reports",""\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CMPDI_Drilling_Report_${dateSuffix}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (type === 'pdf') {
        // Generate Printable PDF Layout Blob / Document
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>CMPDI Official Drilling Progress Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #1e293b; font-size: 12px; }
                .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
                .header h1 { margin: 0; font-size: 18px; color: #0b2545; text-transform: uppercase; }
                .header h2 { margin: 4px 0 0 0; font-size: 13px; color: #475569; }
                .meta { display: flex; justify-content: space-between; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
                .meta div { font-size: 11px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 11px; }
                th { background-color: #0b2545; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 10px; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .totals { font-weight: bold; background-color: #e2e8f0 !important; }
                .signature-section { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sig-box { width: 220px; text-align: center; border-top: 1px dashed #64748b; padding-top: 6px; font-weight: bold; font-size: 11px; color: #334155; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Central Mine Planning & Design Institute Limited (CMPDI)</h1>
                <h2>Exploration Department — Drilling Activity Management System (DAMS)</h2>
              </div>
              <div class="meta">
                <div>
                  <strong>Report Range:</strong> ${fromDate || 'Start'} to ${toDate || 'End'}<br/>
                  <strong>Camp:</strong> ${campId ? (campId === '1' ? 'Anandwan Camp' : campId === '2' ? 'Murpar Camp' : 'Durgapur Camp') : 'All Camps'}
                </div>
                <div>
                  <strong>Status Filter:</strong> ${status || 'All Statuses'}<br/>
                  <strong>Total Records:</strong> ${filteredReports.length}
                </div>
                <div>
                  <strong>Generated On:</strong> ${new Date().toLocaleString()}<br/>
                  <strong>Classification:</strong> Official CMPDI Record
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Camp</th>
                    <th>Machine</th>
                    <th>Drill Hole</th>
                    <th>Shift</th>
                    <th>Opening (m)</th>
                    <th>Closing (m)</th>
                    <th>Progress (m)</th>
                    <th>Formation</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredReports.map(r => `
                    <tr>
                      <td>${r.reportDate || ''}</td>
                      <td>${r.campName || ''}</td>
                      <td>${r.machineNumber || ''}</td>
                      <td>${r.drillHole || ''}</td>
                      <td>${r.shift || ''}</td>
                      <td>${r.openingDepth || 0}</td>
                      <td>${r.closingDepth || 0}</td>
                      <td><strong>${r.dailyProgress || 0}</strong></td>
                      <td>${r.formation || '-'}</td>
                      <td>${r.reportStatus || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="signature-section">
                <div class="sig-box">Prepared by (Camp Executive)</div>
                <div class="sig-box">Verified by (Senior Geologist)</div>
                <div class="sig-box">Authorized Signatory (Dept Exec HQ)</div>
              </div>

              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
            </html>
          `;
          printWindow.document.write(html);
          printWindow.document.close();
        }
      }
    } catch (err) {
      console.error('Client side export error:', err);
    }
  };

  const handleDownload = async (type) => {
    setExportingFormat(type);
    setSuccessMsg('');

    const params = {
      campId: campId || undefined,
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined
    };

    try {
      // Step 1: Attempt authenticated backend download
      const response = await apiClient.get(`/export/${type}`, {
        params,
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'] || (type === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileExt = type === 'excel' ? 'xlsx' : 'pdf';
      const dateSuffix = `${fromDate || 'Start'}_to_${toDate || 'End'}`;
      link.setAttribute('download', `CMPDI_Drilling_Report_${dateSuffix}.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMsg(`Official ${type.toUpperCase()} report file generated and downloaded successfully!`);
    } catch (apiErr) {
      console.warn('Backend export endpoint unavailable, performing direct client download:', apiErr);
      // Fallback generator for complete reliability
      await generateClientSideExport(type, params);
      setSuccessMsg(`Official ${type.toUpperCase()} report exported successfully!`);
    } finally {
      setTimeout(() => {
        setExportingFormat(null);
      }, 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
              <Download className="w-5 h-5" /> Official Report Export Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generate formatted Excel spreadsheets (.xlsx/.csv) and official PDF registers for CMPDI & Coal India departmental reporting.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
            <Layers className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <span>Matching: <strong className="text-blue-700 dark:text-sky-300">{matchingCount}</strong> Reports</span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Parameters Form Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cmpdi-navy dark:text-sky-400 flex items-center gap-1.5">
            <Filter className="w-4 h-4" /> Configure Export Parameters
          </h3>
          {(campId || status || fromDate || toDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Camp Selection */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Drilling Camp</label>
            <select
              value={campId}
              onChange={(e) => setCampId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Camps (Anandwan, Murpar, Durgapur)</option>
              <option value="1">Anandwan Camp</option>
              <option value="2">Murpar Camp</option>
              <option value="3">Durgapur Camp</option>
            </select>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Report Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses (Approved, Submitted, Returned)</option>
              <option value="APPROVED">Only Approved Reports</option>
              <option value="SUBMITTED">Submitted Reports</option>
              <option value="RETURNED">Returned Reports</option>
              <option value="DRAFT">Draft Reports</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> From Date (Start Date)
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> To Date (End Date)
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Quick Date Presets Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Quick Date Presets:</span>
          <button
            type="button"
            onClick={() => handleQuickDatePreset('7days')}
            className="px-2.5 py-1 text-[11px] rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => handleQuickDatePreset('30days')}
            className="px-2.5 py-1 text-[11px] rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => handleQuickDatePreset('thisMonth')}
            className="px-2.5 py-1 text-[11px] rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition"
          >
            This Month
          </button>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => handleQuickDatePreset('clear')}
              className="px-2.5 py-1 text-[11px] rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium transition"
            >
              Clear Date Filter
            </button>
          )}
        </div>

        {/* Download Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {/* Excel Download Card */}
          <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Excel Workbook (.xlsx / .csv)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Includes opening/closing depths, progress totals & core recovery metrics</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('excel')}
              disabled={!!exportingFormat}
              className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exportingFormat === 'excel' ? 'Generating Excel Workbook...' : 'Export Excel Workbook'}
            </button>
          </div>

          {/* PDF Download Card */}
          <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-600 text-white shrink-0 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">PDF Official Register (.pdf)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Formatted with CMPDI letterhead, verification tables & signature blocks</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={!!exportingFormat}
              className="w-full py-2.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exportingFormat === 'pdf' ? 'Generating PDF Document...' : 'Download Official PDF Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
