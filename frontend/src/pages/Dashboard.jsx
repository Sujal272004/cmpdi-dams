import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KpiCard } from '../components/common/KpiCard';
import { StatusChip } from '../components/common/StatusChip';
import { Link } from 'react-router-dom';
import {
  Building2, CalendarCheck2, Clock, CheckCircle2, RotateCcw,
  Pickaxe, TrendingUp, Award, ArrowRight, AlertCircle,
  FilePlus2, MapPin, Activity, Fuel, Target, Send
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Shared chart style helpers ───────────────────────────────────────────────
const tooltipDefaults = {
  backgroundColor: '#1e293b',
  titleColor: '#f8fafc',
  bodyColor: '#cbd5e1',
  padding: 10,
  cornerRadius: 8,
};

// ─── ADMIN / DEPT-EXEC FULL DASHBOARD ─────────────────────────────────────────
const HQDashboard = ({ data, reload }) => {
  const lineChartData = {
    labels: ['1 Jul', '5 Jul', '10 Jul', '15 Jul', '20 Jul', '25 Jul', '30 Jul'],
    datasets: [
      {
        label: 'Anandwan Camp (m)',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#003366',
        backgroundColor: 'rgba(0,51,102,0.1)',
        tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2,
      },
      {
        label: 'Murpar Camp (m)',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#0284C7',
        backgroundColor: 'rgba(2,132,199,0.1)',
        tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2,
      },
      {
        label: 'Durgapur Camp (m)',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212,175,55,0.1)',
        tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2,
      },
    ],
  };

  const barChartData = {
    labels: data?.campComparison?.map(c => c.campName) || ['Anandwan', 'Murpar', 'Durgapur'],
    datasets: [{
      label: 'Total Meters Drilled',
      data: data?.campComparison?.map(c => c.totalMeters) || [0, 0, 0],
      backgroundColor: ['#003366', '#0284C7', '#D4AF37'],
      borderRadius: 6,
    }],
  };

  const doughnutData = {
    labels: ['Approved', 'Pending Review', 'Returned', 'Draft'],
    datasets: [{
      data: [
        data?.approvedReports || 0,
        data?.pendingReports || 0,
        data?.returnedReports || 0,
        data?.draftReports || 0,
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#94A3B8'],
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } },
      tooltip: { ...tooltipDefaults, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} m` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
      y: {
        grid: { color: 'rgba(100,116,139,0.12)' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: v => `${v} m` },
        title: { display: true, text: 'Meters / Day', font: { size: 11 }, color: '#94a3b8' },
      },
    },
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipDefaults, callbacks: { label: ctx => ` ${ctx.parsed.y} m drilled` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
      y: {
        grid: { color: 'rgba(100,116,139,0.12)' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: v => `${v} m` },
        title: { display: true, text: 'Total Meters', font: { size: 11 }, color: '#94a3b8' },
      },
    },
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10, padding: 12, font: { size: 11 },
          generateLabels: chart => chart.data.labels.map((label, i) => ({
            text: `${label}  (${chart.data.datasets[0].data[i]})`,
            fillStyle: chart.data.datasets[0].backgroundColor[i],
            hidden: false, index: i,
          })),
        },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: ctx => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            return ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed / total) * 100).toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> HQ Exploration Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All-camp drilling progress, approval queue &amp; performance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Last Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={reload}
            className="px-3 py-1.5 rounded-lg bg-cmpdi-navy text-white text-xs font-semibold hover:bg-cmpdi-light transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Active Drilling Camps" value={data?.totalCamps ?? 0} icon={Building2} color="blue" subtext="Anandwan, Murpar, Durgapur" />
        <KpiCard title="Today's Entries" value={data?.todayReports ?? 0} icon={CalendarCheck2} color="indigo" subtext="Daily reports generated" />
        <KpiCard title="Pending Review" value={data?.pendingReports ?? 0} icon={Clock} color="amber" subtext="Awaiting HQ Approval" />
        <KpiCard title="Approved Reports" value={data?.approvedReports ?? 0} icon={CheckCircle2} color="emerald" subtext="Locked & Verified" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Returned Corrections" value={data?.returnedReports ?? 0} icon={RotateCcw} color="rose" subtext="Action Required" />
        <KpiCard title="Total Meters Drilled" value={data?.totalMeterDrilled ?? 0} unit="m" icon={Pickaxe} color="cyan" subtext="Cumulative depth achieved" />
        <KpiCard title="Monthly Progress" value={data?.monthlyProgress ?? 0} unit="m" icon={TrendingUp} color="emerald" subtext="Current month drilling" />
        <KpiCard title="Yearly Target Achieved" value={data?.yearlyProgress ?? 0} unit="m" icon={Award} color="blue" subtext="Annual cumulative" />
      </div>

      {/* Financial Year Comparison Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-blue-200 dark:border-blue-900/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Financial Year Achievement &amp; Comparison ({data?.currentFyLabel || 'FY 2026-27'})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Comparing current financial year progress against previous year achievement ({data?.previousFyLabel || 'FY 2025-26'}). Auto-updates at the end of each FY (March 31).
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 self-start sm:self-auto ${
            (data?.fyGrowthPercentage ?? 0) >= 0
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300'
          }`}>
            <TrendingUp className="w-3.5 h-3.5" />
            {data?.fyGrowthPercentage ?? 0}% vs Prev Year
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Current Year Progress ({data?.currentFyLabel || 'FY 2026-27'})
            </span>
            <strong className="text-xl font-extrabold text-blue-700 dark:text-sky-300 block">
              {Math.round(data?.yearlyProgress || 0)} <span className="text-xs font-normal">meters</span>
            </strong>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 block">April 1 to Present</span>
          </div>

          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Previous Year Achievement ({data?.previousFyLabel || 'FY 2025-26'})
            </span>
            <strong className="text-xl font-extrabold text-amber-700 dark:text-amber-300 block">
              {Math.round(data?.previousYearAchievement || 0)} <span className="text-xs font-normal">meters</span>
            </strong>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block">Full Year Total (Apr 1 - Mar 31)</span>
          </div>

          <div className="p-3 bg-violet-50/60 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900 space-y-1 sm:col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Financial Year Status
            </span>
            <strong className="text-sm font-bold text-violet-800 dark:text-violet-300 block">
              {(data?.yearlyProgress || 0) >= (data?.previousYearAchievement || 0) ? '🎯 Exceeded Previous Year' : '📈 In Progress towards FY Goal'}
            </strong>
            <span className="text-[10px] text-violet-600 dark:text-violet-400 block">
              Auto-rolls over to next FY after March 31
            </span>
          </div>
        </div>
      </div>


      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Camp-Wise Daily Progress Trend (July 2026)</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Meters drilled per day across all three CMPDI exploration camps</p>
          <div className="h-64">
            <Line data={lineChartData} options={lineOpts} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Camp Cumulative Progress</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Total approved meters drilled per camp</p>
          <div className="h-64">
            <Bar data={barChartData} options={barOpts} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Report Status Breakdown</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Distribution of all reports by approval stage</p>
          <div className="h-52">
            <Doughnut data={doughnutData} options={doughnutOpts} />
          </div>
        </div>

        {/* Returned corrections panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Pending Corrections &amp; Returned Reports
            </h3>
            <Link to="/returned" className="text-xs font-semibold text-cmpdi-navy dark:text-sky-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data?.pendingCorrections?.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-lg text-center">
                ✅ No reports currently returned for correction.
              </p>
            ) : (
              data?.pendingCorrections?.map((report) => (
                <div key={report.reportId} className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">Report #{report.reportId} — {report.campName}</span>
                      <StatusChip status={report.reportStatus} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <span className="font-semibold">Remark:</span> {report.correctionHistory?.[0]?.remarks || 'Requires field value re-verification'}
                    </p>
                  </div>
                  <Link
                    to={`/reports/${report.reportId}`}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition self-start sm:self-auto whitespace-nowrap"
                  >
                    Edit &amp; Resubmit
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CAMP EXECUTIVE DASHBOARD ──────────────────────────────────────────────────
const CampDashboard = ({ user, data, reload }) => {
  const [campInfo, setCampInfo] = useState(null);

  useEffect(() => {
    const loadCampTargets = async () => {
      const camps = await apiService.getCamps();
      const current = camps.find(c => c.id === user.campId) || camps[0];
      setCampInfo(current);
    };
    loadCampTargets();
  }, [user.campId]);

  // Filter only this camp's reports
  const campReports  = data?.recentActivities?.filter(r => r.campId === user.campId) || [];
  const myApproved   = campReports.filter(r => r.reportStatus === 'APPROVED').length;
  const myPending    = campReports.filter(r => r.reportStatus === 'SUBMITTED').length;
  const myReturned   = campReports.filter(r => r.reportStatus === 'RETURNED').length;
  const myDraft      = campReports.filter(r => r.reportStatus === 'DRAFT').length;
  const myMeters     = campReports.reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0);

  // Filter strictly for current month's progress
  const now = new Date();
  const curYr = now.getFullYear();
  const curMo = now.getMonth();
  const currentMonthReports = campReports.filter(r => {
    if (!r.reportDate) return false;
    const d = new Date(r.reportDate);
    return d.getFullYear() === curYr && d.getMonth() === curMo;
  });
  const currentMonthMeters = currentMonthReports.reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0);

  // Dynamic weekly line chart data from recent reports

  const recent7 = campReports.slice(0, 7).reverse();
  const weeklyLine = {
    labels: recent7.length > 0 ? recent7.map(r => r.reportDate || r.drillHole || 'Day') : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: `${user.campName} — Daily Progress (m)`,
      data: recent7.length > 0 ? recent7.map(r => parseFloat(r.dailyProgress) || 0) : [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#003366',
      backgroundColor: 'rgba(0,51,102,0.12)',
      tension: 0.4, fill: true, pointRadius: 5, pointHoverRadius: 7, borderWidth: 2,
    }],
  };

  const statusDoughnut = {
    labels: ['Approved', 'Submitted', 'Returned', 'Draft'],
    datasets: [{
      data: [myApproved, myPending, myReturned, myDraft],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#94A3B8'],
      borderWidth: 2, hoverOffset: 6,
    }],
  };

  // Shift performance calculation
  const shiftA = campReports.filter(r => r.shift === 'SHIFT_A');
  const shiftB = campReports.filter(r => r.shift === 'SHIFT_B');
  const shiftC = campReports.filter(r => r.shift === 'SHIFT_C');
  const avgA = shiftA.length > 0 ? (shiftA.reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0) / shiftA.length) : 0;
  const avgB = shiftB.length > 0 ? (shiftB.reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0) / shiftB.length) : 0;
  const avgC = shiftC.length > 0 ? (shiftC.reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0) / shiftC.length) : 0;

  const shiftBar = {
    labels: ['Shift A', 'Shift B', 'Shift C'],
    datasets: [{
      label: 'Avg. Meters / Shift',
      data: [parseFloat(avgA.toFixed(1)), parseFloat(avgB.toFixed(1)), parseFloat(avgC.toFixed(1))],
      backgroundColor: ['#003366', '#0284C7', '#D4AF37'],
      borderRadius: 6,
    }],
  };

  // Yearly cumulative data by month
  const MONTHS_FULL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();
  const yearlyActual = Array(12).fill(null).map((_, idx) => {
    if (idx > currentMonthIdx) return null;
    const monthReports = campReports.filter(r => {
      if (!r.reportDate) return false;
      const d = new Date(r.reportDate);
      return d.getMonth() === idx;
    });
    return monthReports.reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0);
  });

  const yearlyTargetVal = campInfo?.monthlyTarget ?? 0;
  const yearlyTarget = Array(12).fill(yearlyTargetVal);

  const yearlyCumulative = {
    labels: MONTHS_FULL,
    datasets: [
      {
        label: 'Actual Meters Drilled (m)',
        data: yearlyActual,
        backgroundColor: yearlyActual.map(v =>
          v === null ? 'rgba(0,51,102,0.15)' : '#003366'
        ),
        borderRadius: 5,
        order: 1,
      },
      {
        label: 'Monthly Target (m)',
        data: yearlyTarget,
        type: 'line',
        borderColor: '#D4AF37',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 3,
        pointBackgroundColor: '#D4AF37',
        tension: 0,
        order: 0,
      },
    ],
  };

  const yearlyBarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, padding: 14, font: { size: 11 } },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: ctx =>
            ctx.parsed.y === null
              ? ` ${ctx.dataset.label}: Upcoming`
              : ` ${ctx.dataset.label}: ${ctx.parsed.y} m`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
      y: {
        grid: { color: 'rgba(100,116,139,0.12)' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: v => `${v} m` },
        title: { display: true, text: 'Meters Drilled', font: { size: 11 }, color: '#94a3b8' },
        beginAtZero: true,
      },
    },
  };

  const yearlyTotal = yearlyActual.filter(Boolean).reduce((a, b) => a + b, 0);
  const yearlyTargetTotal = campInfo?.yearlyTarget ?? yearlyTarget.reduce((a, b) => a + b, 0);
  const yearlyPct = yearlyTargetTotal > 0 ? ((yearlyTotal / yearlyTargetTotal) * 100).toFixed(1) : "0.0";

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } },
      tooltip: { ...tooltipDefaults, callbacks: { label: ctx => ` ${ctx.parsed.y} m drilled` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
      y: {
        grid: { color: 'rgba(100,116,139,0.12)' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: v => `${v} m` },
        title: { display: true, text: 'Meters Drilled', font: { size: 11 }, color: '#94a3b8' },
      },
    },
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipDefaults, callbacks: { label: ctx => ` Avg: ${ctx.parsed.y} m per shift` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
      y: {
        grid: { color: 'rgba(100,116,139,0.12)' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: v => `${v} m` },
        title: { display: true, text: 'Avg Meters', font: { size: 11 }, color: '#94a3b8' },
      },
    },
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10, padding: 12, font: { size: 11 },
          generateLabels: chart => chart.data.labels.map((label, i) => ({
            text: `${label}  (${chart.data.datasets[0].data[i]})`,
            fillStyle: chart.data.datasets[0].backgroundColor[i],
            hidden: false, index: i,
          })),
        },
      },
      tooltip: { ...tooltipDefaults },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-cmpdi-navy to-cmpdi-light p-5 rounded-xl shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">{user.campName}</span>
          </div>
          <h1 className="text-xl font-bold">My Camp Dashboard</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Logged in as <span className="font-semibold text-white">{user.name}</span> · {user.designation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/entry"
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <FilePlus2 className="w-4 h-4" /> New Report Entry
          </Link>
          <button
            onClick={reload}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* HQ Assigned Targets Banner Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-amber-400/40 dark:border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              HQ Assigned Drilling Targets ({user.campName})
            </h3>
          </div>
          <Link to="/targets" className="text-xs font-semibold text-cmpdi-navy dark:text-sky-400 hover:underline">
            View All Targets →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Day Target</span>
            <span className="text-base font-extrabold text-blue-700 dark:text-blue-300">{campInfo?.dailyTarget ?? 0} m/day</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Week Target</span>
            <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">{campInfo?.weeklyTarget ?? 0} m/wk</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Month Target</span>
            <span className="text-base font-extrabold text-amber-700 dark:text-amber-300">{campInfo?.monthlyTarget ?? 0} m/mo</span>
          </div>
          <div className="p-3 rounded-lg bg-violet-50/80 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Year Target</span>
            <span className="text-base font-extrabold text-violet-700 dark:text-violet-300">{campInfo?.yearlyTarget ?? 0} m/yr</span>
          </div>
        </div>
      </div>

      {/* KPI Cards — camp-specific */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="My Total Reports" value={campReports.length} icon={CalendarCheck2} color="blue" subtext="All submitted entries" />
        <KpiCard title="Approved & Locked" value={myApproved} icon={CheckCircle2} color="emerald" subtext="Verified by HQ" />
        <KpiCard title="Pending HQ Review" value={myPending} icon={Clock} color="amber" subtext="Awaiting approval" />
        <KpiCard title="Returned for Correction" value={myReturned} icon={RotateCcw} color="rose" subtext="Needs revision" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="My Meters Drilled" value={myMeters.toFixed(1)} unit="m" icon={Pickaxe} color="cyan" subtext="Cumulative approved depth" />
        <KpiCard title="This Month's Progress" value={currentMonthMeters.toFixed(1)} unit="m" icon={TrendingUp} color="emerald" subtext="Current month drilling" />
        <KpiCard title="Yearly Total (2026)" value={yearlyTotal} unit="m" icon={Award} color="blue" subtext={`${yearlyPct}% of annual target`} />
        <KpiCard title="Avg. Daily Progress" value={myApproved > 0 ? (myMeters / myApproved).toFixed(1) : "0.0"} unit="m" icon={Activity} color="indigo" subtext="Per approved shift" />
      </div>


      {/* Yearly Cumulative Chart — Full Width */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Yearly Cumulative Drilling Progress — 2026
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Month-by-month meters drilled at {user.campName} vs monthly target (dashed gold line)
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-cmpdi-navy/10 dark:bg-cmpdi-navy/30 text-cmpdi-navy dark:text-sky-300">
              Drilled: {yearlyTotal} m
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              Target: {yearlyTargetTotal} m
            </span>
            <span className={`px-2.5 py-1 rounded-lg font-bold ${
              parseFloat(yearlyPct) >= 60
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
            }`}>
              {yearlyPct}% achieved
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>0 m</span>
            <span className="font-semibold text-cmpdi-navy dark:text-sky-300">{yearlyTotal} m drilled so far</span>
            <span>{yearlyTargetTotal} m (target)</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cmpdi-navy to-sky-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, parseFloat(yearlyPct))}%` }}
            />
          </div>
        </div>

        <div className="h-64">
          <Bar data={yearlyCumulative} options={yearlyBarOpts} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly line */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">This Week's Daily Drilling Progress</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Meters drilled each day at {user.campName} — current week</p>
          <div className="h-60">
            <Line data={weeklyLine} options={lineOpts} />
          </div>
        </div>

        {/* Doughnut */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">My Report Status</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Breakdown of all my submitted reports</p>
          <div className="h-60">
            <Doughnut data={statusDoughnut} options={doughnutOpts} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift Bar */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Shift Performance</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Average meters drilled per shift type at your camp</p>
          <div className="h-52">
            <Bar data={shiftBar} options={barOpts} />
          </div>
        </div>

        {/* Returned / Action required */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" /> My Returned Reports — Action Required
            </h3>
            <Link to="/returned" className="text-xs font-semibold text-cmpdi-navy dark:text-sky-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.pendingCorrections?.filter(r => r.campId === user.campId) || []).length === 0 ? (
              <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">All clear! No reports returned for correction.</p>
              </div>
            ) : (
              data.pendingCorrections
                .filter(r => r.campId === user.campId)
                .map(report => (
                  <div key={report.reportId} className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Report #{report.reportId}</span>
                        <StatusChip status={report.reportStatus} />
                        <span className="text-[10px] text-slate-500">{report.reportDate}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        <span className="font-semibold">HQ Remark:</span> {report.correctionHistory?.[0]?.remarks || 'Requires re-verification'}
                      </p>
                    </div>
                    <Link
                      to={`/reports/${report.reportId}`}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition self-start sm:self-auto flex items-center gap-1 whitespace-nowrap"
                    >
                      <Send className="w-3 h-3" /> Edit &amp; Resubmit
                    </Link>
                  </div>
                ))
            )}
          </div>

          {/* Quick links for camp exec */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2">
            <Link to="/entry" className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-cmpdi-navy hover:text-white dark:hover:bg-cmpdi-navy text-slate-600 dark:text-slate-400 transition text-center text-[11px] font-semibold">
              <FilePlus2 className="w-4 h-4" /> New Entry
            </Link>
            <Link to="/my-reports" className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-cmpdi-navy hover:text-white dark:hover:bg-cmpdi-navy text-slate-600 dark:text-slate-400 transition text-center text-[11px] font-semibold">
              <CalendarCheck2 className="w-4 h-4" /> My Reports
            </Link>
            <Link to="/returned" className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-cmpdi-navy hover:text-white dark:hover:bg-cmpdi-navy text-slate-600 dark:text-slate-400 transition text-center text-[11px] font-semibold">
              <RotateCcw className="w-4 h-4 text-rose-500" /> Returned Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ROUTER COMPONENT ─────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    const summary = await apiService.getDashboardSummary();
    setData(summary);
    setLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cmpdi-navy border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold animate-pulse">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const isCampExec = user?.role === 'ROLE_CAMP_EXEC';

  return isCampExec
    ? <CampDashboard user={user} data={data} reload={loadDashboard} />
    : <HQDashboard data={data} reload={loadDashboard} />;
};
