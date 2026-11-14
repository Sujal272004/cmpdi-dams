import React, { useState, useEffect } from 'react';
import { apiService, apiClient } from '../services/api';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Calendar, Filter, RotateCcw, Layers, Sun, TrendingUp } from 'lucide-react';

export const ExportCenter = () => {
  const [reportMode, setReportMode] = useState('standard'); // 'standard' | 'sundaywise'
  const [campId, setCampId] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [exportingFormat, setExportingFormat] = useState(null);
  const [matchingCount, setMatchingCount] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  // Helper to check if a YYYY-MM-DD date is a Sunday
  const isSunday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getDay() === 0;
  };

  // Fetch count of reports matching currently configured parameters
  useEffect(() => {
    let isMounted = true;
    const checkMatchingReports = async () => {
      try {
        const filters = { campId, status };
        const reports = await apiService.getReports(filters);
        if (isMounted) {
          const filtered = reports.filter(r => {
            if (reportMode === 'sundaywise') {
              if (selectedMonth && !r.reportDate.startsWith(selectedMonth)) return false;
              if (!isSunday(r.reportDate)) return false;
            } else {
              if (fromDate && r.reportDate < fromDate) return false;
              if (toDate && r.reportDate > toDate) return false;
            }
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
  }, [reportMode, campId, status, fromDate, toDate, selectedMonth]);

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
    setSelectedMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  };

  const getFinancialYearStartDate = (dateStr) => {
    if (!dateStr) return `${new Date().getFullYear()}-04-01`;
    const [y, m] = dateStr.split('-').map(Number);
    const fyYear = m >= 4 ? y : y - 1;
    return `${fyYear}-04-01`;
  };

  const getMonthStartDate = (dateStr) => {
    if (!dateStr) return `${new Date().toISOString().slice(0, 7)}-01`;
    return `${dateStr.slice(0, 7)}-01`;
  };

  const generateClientSideExport = async (type, params) => {
    try {
      const targetDate = params?.toDate || params?.fromDate || new Date().toISOString().split('T')[0];
      const fyStartDate = getFinancialYearStartDate(targetDate);
      const monthStartDate = getMonthStartDate(targetDate);

      // Fetch all reports in the financial year to date to accurately calculate cumulative progress
      let fyReports = [];
      try {
        fyReports = await apiService.getReports({
          campId: params?.campId,
          status: params?.status,
          fromDate: fyStartDate,
          toDate: targetDate
        });
      } catch (e) {
        console.warn('Could not fetch financial year reports:', e);
      }

      const machineMonthly = {};
      const machineYearly = {};

      fyReports.forEach(r => {
        const machine = (r.machineNumber || 'RIG').trim().toUpperCase();
        const rDate = r.reportDate || '';
        const prog = parseFloat(r.dailyProgress) || 0;
        machineYearly[machine] = (machineYearly[machine] || 0) + prog;
        if (rDate >= monthStartDate && rDate <= targetDate) {
          machineMonthly[machine] = (machineMonthly[machine] || 0) + prog;
        }
      });

      const allReports = await apiService.getReports(params);

      const dprHeaders = '"Camp Name","RIG No.","Shift","Total Day Progress","Monthly Cummulative Meterage","Yearly Cummulative Meterage","Borehole ID","Borehole Start dt","Block Name","BH Type","B/D Hours.Minutes","Remarks","Preventive Hrs","Working Hrs","Diesel in Pump(Ltrs)","Diesel in Rig(Ltrs)","Bit No"\n';

      if (reportMode === 'sundaywise') {
        const sundayReports = allReports.filter(r => {
          if (selectedMonth && !r.reportDate.startsWith(selectedMonth)) return false;
          return isSunday(r.reportDate);
        });

        const sortedSundayReports = [...sundayReports].sort((a, b) => {
          const dateDiff = (a.reportDate || '').localeCompare(b.reportDate || '');
          if (dateDiff !== 0) return dateDiff;
          return (a.reportId || 0) - (b.reportId || 0);
        });

        let csvContent = '\uFEFF' + dprHeaders;

        const sundayMonthly = {};
        const sundayYearly = {};

        sortedSundayReports.forEach(r => {
          const machine = (r.machineNumber || 'RIG').trim().toUpperCase();
          const prog = parseFloat(r.dailyProgress) || 0;
          sundayMonthly[machine] = (sundayMonthly[machine] || 0) + prog;
          sundayYearly[machine] = (sundayYearly[machine] || 0) + prog;

          const monthlyCum = (machineMonthly[machine] || sundayMonthly[machine]).toFixed(2);
          const yearlyCum = (machineYearly[machine] || sundayYearly[machine]).toFixed(2);
          const bhStartDate = r.boreholeStartDate
            ? r.boreholeStartDate.split('-').reverse().join('-')
            : '';
          const boreholeId = r.boreholeId || r.drillHole || '';
          const remarksClean = (r.remarks || '').replace(/"/g, '""');

          const bhType = r.drillingType || 'C';
          const bdHours = r.breakdownHours || '0.00';
          csvContent += `"${r.campName || ''}","${r.machineNumber || ''}","${r.shift || ''}","${prog}","${monthlyCum}","${yearlyCum}","${boreholeId}","${bhStartDate}","${r.blockName || ''}","${bhType}","${bdHours}","${remarksClean}","${r.preventiveHours || 0}","${r.workingHours || 0}","${r.dieselPump || 0}","${r.dieselRig || 0}","${r.bitNo || ''}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CMPDI_Sundaywise_Drilling_Report_${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      const filteredReports = allReports.filter(r => {
        if (fromDate && r.reportDate < fromDate) return false;
        if (toDate && r.reportDate > toDate) return false;
        return true;
      });

      const dateSuffix = `${fromDate || 'Start'}_to_${toDate || 'End'}`;

      if (type === 'excel') {
        const sortedReports = [...filteredReports].sort((a, b) => {
          const dateDiff = (a.reportDate || '').localeCompare(b.reportDate || '');
          if (dateDiff !== 0) return dateDiff;
          return (a.reportId || 0) - (b.reportId || 0);
        });

        let csvContent = '\uFEFF' + dprHeaders;

        sortedReports.forEach(r => {
          const machine = (r.machineNumber || 'RIG').trim().toUpperCase();
          const prog = parseFloat(r.dailyProgress) || 0;

          const monthlyCum = (machineMonthly[machine] != null ? machineMonthly[machine] : prog).toFixed(2);
          const yearlyCum = (machineYearly[machine] != null ? machineYearly[machine] : prog).toFixed(2);
          const bhStartDate = r.boreholeStartDate
            ? r.boreholeStartDate.split('-').reverse().join('-')
            : '';
          const boreholeId = r.boreholeId || r.drillHole || '';
          const remarksClean = (r.remarks || '').replace(/"/g, '""');

          const bhType = r.drillingType || 'C';
          const bdHours = r.breakdownHours || '0.00';
          csvContent += `"${r.campName || ''}","${r.machineNumber || ''}","${r.shift || ''}","${prog}","${monthlyCum}","${yearlyCum}","${boreholeId}","${bhStartDate}","${r.blockName || ''}","${bhType}","${bdHours}","${remarksClean}","${r.preventiveHours || 0}","${r.workingHours || 0}","${r.dieselPump || 0}","${r.dieselRig || 0}","${r.bitNo || ''}"\n`;
        });

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
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const sortedReports = [...filteredReports].sort((a, b) => {
            const dateDiff = (a.reportDate || '').localeCompare(b.reportDate || '');
            if (dateDiff !== 0) return dateDiff;
            return (a.reportId || 0) - (b.reportId || 0);
          });

          // Group by Camp
          const campNames = ['Anandwan Camp', 'Murpar Camp', 'Durgapur Camp'];
          const campGroups = {};
          campNames.forEach(c => { campGroups[c] = []; });

          sortedReports.forEach(r => {
            const cName = r.campName || 'Other Camp';
            if (!campGroups[cName]) campGroups[cName] = [];
            campGroups[cName].push(r);
          });

          const reportDateStr = toDate ? toDate.split('-').reverse().join('.') : (fromDate ? fromDate.split('-').reverse().join('.') : new Date().toLocaleDateString('en-GB').replace(/\//g, '.'));

          let grandTotalDaily = 0;
          let grandTotalMonthly = 0;
          let grandTotalYearly = 0;
          let grandTotalDiesel = 0;

          const campBlocksHtml = Object.keys(campGroups).map(cName => {
            const cReports = campGroups[cName];
            if (campId && !cName.toLowerCase().includes(campId === '1' ? 'anandwan' : campId === '2' ? 'murpar' : 'durgapur')) {
              return '';
            }

            const isDurgapur = cName.toLowerCase().includes('durgapur');
            let campDaily = 0;
            let campMonthly = 0;
            let campYearly = 0;
            let campPump = 0;
            let campRig = 0;

            const rowsHtml = cReports.map(r => {
              const machine = (r.machineNumber || 'RIG').trim().toUpperCase();
              const prog = parseFloat(r.dailyProgress) || 0;
              const mCum = machineMonthly[machine] != null ? machineMonthly[machine] : prog;
              const yCum = machineYearly[machine] != null ? machineYearly[machine] : prog;
              const sh = (r.shift || '').toLowerCase();
              const isShift2 = sh.includes('2nd') || sh.includes('night');
              const shift1 = isShift2 ? 0 : prog;
              const shift2 = isShift2 ? prog : 0;
              const bhDepth = r.boreholeDepth != null ? parseFloat(r.boreholeDepth).toFixed(2) : '0.00';
              const bhStartDate = r.boreholeStartDate ? r.boreholeStartDate.split('-').reverse().join('.') : '';
              const bhId = r.boreholeId || r.drillHole || '';
              const bhIdAndDate = bhStartDate ? `${bhId} / ${bhStartDate}` : bhId;
              let bhType = r.drillingType || 'C';
              if (bhType.toLowerCase() === 'coring') bhType = 'C';
              const bdHours = r.breakdownHours || 'Nil hr';
              const pump = parseFloat(r.dieselPump) || 0;
              const rig = parseFloat(r.dieselRig) || 0;

              campDaily += prog;
              campMonthly += mCum;
              campYearly += yCum;
              campPump += pump;
              campRig += rig;

              return `
                <tr>
                  <td style="text-align: left; font-weight: 500;">${machine}</td>
                  <td>${shift1.toFixed(2)}</td>
                  <td>${shift2.toFixed(2)}</td>
                  <td style="font-weight: bold;">${prog.toFixed(2)}</td>
                  <td style="font-weight: bold;">${mCum.toFixed(2)}</td>
                  <td style="font-weight: bold;">${yCum.toFixed(2)}</td>
                  <td>${bhDepth}</td>
                  <td>${bhIdAndDate}</td>
                  <td style="text-align: left;">${r.blockName || ''}</td>
                  <td>${bhType}</td>
                  <td>${bdHours}</td>
                  <td style="text-align: left;">${r.remarks || ''}</td>
                  <td>${r.preventiveHours != null ? r.preventiveHours : '0.00'}</td>
                  <td>${r.workingHours != null ? r.workingHours : '0.00'}</td>
                  <td>${pump > 0 ? pump.toFixed(2) : '0.00'}</td>
                  <td>${rig > 0 ? rig.toFixed(2) : '0.00'}</td>
                  <td>${r.bitNo || '-'}</td>
                </tr>
              `;
            }).join('');

            grandTotalDaily += campDaily;
            grandTotalMonthly += campMonthly;
            grandTotalYearly += campYearly;
            grandTotalDiesel += (campPump + campRig);

            const isAnandwan = cName.toLowerCase().includes('anandwan');
            const requirementNote = isAnandwan ? 'Requirement:- 300 nos. NQ drill rod, Pipe wrench 18",24" & 36"' : '';

            return `
              <!-- Header Row 1 -->
              <tr class="camp-header">
                <th style="width: 9%; text-align: left;">${cName}</th>
                <th colspan="2" style="width: 7%;">Shift</th>
                <th style="width: 5%;">Total (m)</th>
                <th style="width: 6%;">Monthly Cumm.<br/>Meterage</th>
                <th style="width: 6%;">Yearly Cumm.<br/>Meterage</th>
                <th style="width: 4%;">BH<br/>Depth<br/>(m)</th>
                <th style="width: 8.5%;">BH ID / Start dt</th>
                <th style="width: 9.5%;">Block Name</th>
                <th style="width: 4%;">BH Type</th>
                <th style="width: 6%;">B/D Hours.Minutes</th>
                <th style="width: 15%;">Remarks</th>
                <th style="width: 4%;">Preventive<br/>Hrs</th>
                <th style="width: 4%;">Working<br/>Hrs</th>
                <th colspan="2" style="width: 7%;">Diesel (Ltrs)</th>
                <th style="width: 6%;">Bit No</th>
              </tr>
              <!-- Header Row 2 -->
              <tr class="sub-header">
                <th></th>
                <th>${isDurgapur ? '1ST SHIFT' : '12hr'}</th>
                <th>${isDurgapur ? '2ND SHIFT' : ''}</th>
                <th colspan="11"></th>
                <th>Pump (Ltrs)</th>
                <th>Rig (Ltrs)</th>
                <th></th>
              </tr>
              <!-- Machine rows -->
              ${rowsHtml}
              <!-- Camp Total row -->
              <tr class="camp-total">
                <td style="font-weight: bold; text-align: center;">Total</td>
                <td></td>
                <td></td>
                <td style="font-weight: bold;">${campDaily.toFixed(2)}</td>
                <td style="font-weight: bold;">${campMonthly.toFixed(2)}</td>
                <td style="font-weight: bold;">${campYearly.toFixed(2)}</td>
                <td colspan="5"></td>
                <td style="text-align: left; font-size: 8px;">${requirementNote}</td>
                <td colspan="2"></td>
                <td style="font-weight: bold;">${campPump > 0 ? campPump.toFixed(2) : ''}</td>
                <td style="font-weight: bold;">${campRig > 0 ? campRig.toFixed(2) : ''}</td>
                <td></td>
              </tr>
            `;
          }).join('');

          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>DRILLING PROGRESS OF RI-IV,NAGPUR</title>
              <style>
                @page { size: landscape; margin: 8mm; }
                body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; font-size: 8.5px; }
                .doc-title { text-align: center; font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 2px; }
                .doc-date { text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                th, td { border: 1px solid #000; padding: 2.5px 3px; text-align: center; font-size: 8px; line-height: 1.15; }
                th { background-color: #fff; font-weight: bold; }
                .camp-header th { font-size: 8px; font-weight: bold; background-color: #fff; }
                .sub-header th { font-size: 7.5px; font-weight: bold; background-color: #fff; }
                .camp-total td { font-weight: bold; background-color: #fff; }
                .grand-total-row td { font-weight: bold; font-size: 8.5px; }
              </style>
            </head>
            <body>
              <div class="doc-title">DRILLING PROGRESS OF RI-IV,NAGPUR</div>
              <div class="doc-date">${reportDateStr}</div>

              <table>
                <tbody>
                  ${campBlocksHtml}
                  <!-- Grand Total Row 1 -->
                  <tr class="grand-total-row">
                    <td colspan="4" style="font-weight: bold; text-align: center;">RI-IV, CMPDI, NAGPUR</td>
                    <td style="font-weight: bold;">Monthly Cumm.<br/>Meterage</td>
                    <td style="font-weight: bold;">Yearly Cumm.<br/>Meterage</td>
                    <td colspan="11"></td>
                  </tr>
                  <!-- Grand Total Row 2 -->
                  <tr class="grand-total-row">
                    <td colspan="3" style="font-weight: bold; text-align: center;">TOTAL (m)</td>
                    <td style="font-weight: bold;">${grandTotalDaily.toFixed(2)}</td>
                    <td style="font-weight: bold;">${grandTotalMonthly.toFixed(2)}</td>
                    <td style="font-weight: bold;">${grandTotalYearly.toFixed(2)}</td>
                    <td colspan="8"></td>
                    <td colspan="2" style="font-weight: bold;">${grandTotalDiesel.toFixed(0)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

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

    const endpoint = reportMode === 'sundaywise' ? '/export/excel/sundaywise' : `/export/${type}`;
    const params = reportMode === 'sundaywise' ? {
      campId: campId || undefined,
      status: status || undefined,
      month: selectedMonth
    } : {
      campId: campId || undefined,
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined
    };

    try {
      const response = await apiClient.get(endpoint, {
        params,
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'] || (type === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileExt = type === 'excel' ? 'xlsx' : 'pdf';
      const filename = reportMode === 'sundaywise'
        ? `CMPDI_Sundaywise_Drilling_Report_${selectedMonth}.${fileExt}`
        : `CMPDI_Drilling_Report_${fromDate || 'Start'}_to_${toDate || 'End'}.${fileExt}`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMsg(`Official ${reportMode === 'sundaywise' ? 'SUNDAYWISE EXCEL' : type.toUpperCase()} report file generated and downloaded successfully!`);
    } catch (apiErr) {
      console.warn('Backend export endpoint unavailable, performing direct client download:', apiErr);
      await generateClientSideExport(type, params);
      setSuccessMsg(`Official ${reportMode === 'sundaywise' ? 'SUNDAYWISE EXCEL' : type.toUpperCase()} report exported successfully!`);
    } finally {
      setTimeout(() => {
        setExportingFormat(null);
      }, 1000);
    }
  };

  // Achievement Against Target — separate report
  const handleAchievementDownload = async () => {
    setExportingFormat('achievement');
    setSuccessMsg('');
    try {
      const response = await apiClient.get('/export/achievement', {
        params: { asOfDate: toDate || undefined },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const dateStr = toDate || new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Achievement_Against_Target_RI-IV_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setSuccessMsg('Achievement Against Target report downloaded successfully!');
    } catch (err) {
      console.error('Achievement report download failed:', err);
      setSuccessMsg('Failed to generate Achievement report. Please try again.');
    } finally {
      setTimeout(() => setExportingFormat(null), 1000);
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
              Generate formatted Excel spreadsheets (.xlsx/.csv) and official PDF registers for CMPDI &amp; Coal India departmental reporting.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
            <Layers className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <span>Matching: <strong className="text-blue-700 dark:text-sky-300">{matchingCount}</strong> Reports</span>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setReportMode('standard')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
            reportMode === 'standard'
              ? 'bg-white dark:bg-slate-700 text-cmpdi-navy dark:text-sky-300 shadow-xs border border-slate-200 dark:border-slate-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          Standard Drilling Progress Report
        </button>
        <button
          onClick={() => setReportMode('sundaywise')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
            reportMode === 'sundaywise'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-300 dark:border-amber-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Sun className="w-4 h-4 text-amber-500" />
          Sundaywise Monthly Report
        </button>
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
            <Filter className="w-4 h-4" />
            {reportMode === 'sundaywise' ? 'Sundaywise Export Parameters' : 'Configure Export Parameters'}
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
        {reportMode === 'sundaywise' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Selected Month */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Select Month &amp; Year
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
              />
            </div>

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
          </div>
        ) : (
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
        )}

        {/* Quick Date Presets Toolbar (Standard Mode Only) */}
        {reportMode === 'standard' && (
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
        )}

        {/* Download Action Cards */}
        {reportMode === 'sundaywise' ? (
          <div className="p-5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-600 text-white shrink-0 shadow-xs">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sundaywise Monthly Excel Report (.xlsx)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Exports drilling reports recorded on <strong>Sundays</strong> for {selectedMonth} formatted strictly as per official 15-column DPR format.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('excel')}
              disabled={!!exportingFormat}
              className="w-full py-2.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exportingFormat === 'excel' ? 'Generating Sundaywise Excel Report...' : `Export Sundaywise Excel Report (${selectedMonth})`}
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Excel + PDF row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Excel Download Card */}
              <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Excel Workbook (.xlsx / .csv)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Strictly follows official DPR Format: 17 columns with cumulative meterage, borehole start date, block, remarks, preventive hours, diesel &amp; bit number.</p>
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Formatted with CMPDI letterhead, verification tables &amp; signature blocks</p>
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

            {/* Achievement Against Target Card */}
            <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-600 text-white shrink-0 shadow-xs">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Achievement Against Target (.xlsx)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Standalone Excel report — each machine's FY target vs actual drilled meterage, with camp-wise SUB TOTALs and GRAND TOTAL. Financial Year (Apr – Mar).
                  </p>
                </div>
              </div>
              <button
                onClick={handleAchievementDownload}
                disabled={!!exportingFormat}
                className="w-full py-2.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exportingFormat === 'achievement' ? 'Generating Achievement Report...' : 'Download Achievement vs Target Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

