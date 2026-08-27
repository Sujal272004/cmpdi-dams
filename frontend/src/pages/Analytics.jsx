import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  BarChart3, TrendingUp, Pickaxe, Clock, Fuel,
  CheckCircle2, RotateCcw, Activity, Target
} from 'lucide-react';
import {
  Line, Bar, Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── Shared chart defaults ───────────────────────────────────────────────────
const CAMP_PALETTE = ['#003366', '#0284C7', '#D4AF37', '#10B981', '#8B5CF6', '#EC4899'];

const baseLineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 12, padding: 16, font: { size: 11 } }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} m`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#64748b' }
    },
    y: {
      grid: { color: 'rgba(100,116,139,0.12)' },
      ticks: { font: { size: 11 }, color: '#64748b', callback: v => `${v} m` },
      title: { display: true, text: 'Meters Drilled', font: { size: 11 }, color: '#94a3b8' }
    }
  }
};

const baseBarOpts = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 12, padding: 16, font: { size: 11 } }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      padding: 10,
      cornerRadius: 8,
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
    y: {
      grid: { color: 'rgba(100,116,139,0.12)' },
      ticks: { font: { size: 11 }, color: '#64748b' },
    }
  }
};

// ─── KPI Summary Card ────────────────────────────────────────────────────────
function KpiTile({ label, value, unit, sub, icon: Icon, accent }) {
  const accents = {
    blue:    'border-l-blue-600 text-blue-600 dark:text-blue-400',
    emerald: 'border-l-emerald-500 text-emerald-600 dark:text-emerald-400',
    amber:   'border-l-amber-500 text-amber-600 dark:text-amber-400',
    rose:    'border-l-rose-500 text-rose-600 dark:text-rose-400',
    cyan:    'border-l-cyan-500 text-cyan-600 dark:text-cyan-400',
    violet:  'border-l-violet-500 text-violet-600 dark:text-violet-400',
  };
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${accents[accent]} p-4 shadow-xs flex items-start gap-3`}>
      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700 ${accents[accent]} mt-0.5`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 leading-none">
          {value}<span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">{unit}</span>
        </p>
        {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Chart Card Wrapper ──────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden ${className}`}>
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const Analytics = () => {
  const [activeRange, setActiveRange] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [campsList, setCampsList] = useState([]);
  const [reportsList, setReportsList] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [summary, camps, reports] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getCamps(),
        apiService.getReports()
      ]);
      setSummaryData(summary || {});
      setCampsList(Array.isArray(camps) ? camps : []);
      setReportsList(Array.isArray(reports) ? reports : []);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cmpdi-navy border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold animate-pulse">Computing analytics &amp; trend data from dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── DERIVED CALCULATIONS FROM EXACT DASHBOARD & REPORTS DATA ─────────────

  // Total Reports & Status breakdown
  const approvedCount = summaryData?.approvedReports ?? reportsList.filter(r => r.reportStatus === 'APPROVED').length;
  const pendingCount = summaryData?.pendingReports ?? reportsList.filter(r => r.reportStatus === 'SUBMITTED').length;
  const returnedCount = summaryData?.returnedReports ?? reportsList.filter(r => r.reportStatus === 'RETURNED').length;
  const draftCount = summaryData?.draftReports ?? reportsList.filter(r => r.reportStatus === 'DRAFT').length;
  const totalReportsCount = approvedCount + pendingCount + returnedCount + draftCount;

  // Meters Drilled
  const totalMeters = summaryData?.totalMeterDrilled ?? reportsList.reduce((sum, r) => sum + (parseFloat(r.dailyProgress) || 0), 0);
  const monthlyProgress = summaryData?.monthlyProgress ?? totalMeters;
  const avgEfficiency = reportsList.length > 0 ? (totalMeters / reportsList.length).toFixed(1) : "0.0";

  // Targets calculation
  const totalYearlyTarget = campsList.reduce((sum, c) => sum + (parseFloat(c.yearlyTarget) || 3600), 0) || 12000;
  const targetPct = totalYearlyTarget > 0 ? Math.min(100, ((totalMeters / totalYearlyTarget) * 100)).toFixed(1) : "0.0";

  // 1. Monthly Line Chart per Camp
  const currentMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, new Date().getMonth() + 1);
  const activeCamps = campsList.length > 0 ? campsList : [
    { id: 1, campName: 'Anandwan Camp' },
    { id: 2, campName: 'Murpar Camp' },
    { id: 3, campName: 'Durgapur Camp' }
  ];

  const lineDatasets = activeCamps.map((camp, idx) => {
    const color = CAMP_PALETTE[idx % CAMP_PALETTE.length];
    const monthTotals = currentMonthNames.map((_, mIdx) => {
      return reportsList
        .filter(r => {
          if (r.campId !== camp.id && r.campName !== camp.campName) return false;
          const rDate = r.reportDate ? new Date(r.reportDate) : null;
          return rDate && rDate.getMonth() === mIdx;
        })
        .reduce((sum, r) => sum + (parseFloat(r.dailyProgress) || 0), 0);
    });

    return {
      label: camp.campName,
      data: monthTotals,
      borderColor: color,
      backgroundColor: `${color}1F`,
      tension: 0.4, fill: true, pointRadius: 4, pointHoverRadius: 6,
      borderWidth: 2,
    };
  });

  const monthlyLineData = {
    labels: currentMonthNames.length > 0 ? currentMonthNames : ['Jul', 'Aug'],
    datasets: lineDatasets
  };

  // 2. Report Status Doughnut Chart
  const statusDoughnutData = {
    labels: ['Approved & Locked', 'Pending HQ Review', 'Returned for Correction', 'Draft (Unsaved)'],
    datasets: [{
      data: [approvedCount, pendingCount, returnedCount, draftCount],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#94A3B8'],
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 8,
    }]
  };

  // 3. Shift-wise Output (Shift A, Shift B, Shift C)
  const shiftA_Meters = reportsList.filter(r => r.shift === 'SHIFT_A' || r.shift === 'Shift A' || r.shift === 'A').reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0);
  const shiftB_Meters = reportsList.filter(r => r.shift === 'SHIFT_B' || r.shift === 'Shift B' || r.shift === 'B').reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0);
  const shiftC_Meters = reportsList.filter(r => r.shift === 'SHIFT_C' || r.shift === 'Shift C' || r.shift === 'C').reduce((s, r) => s + (parseFloat(r.dailyProgress) || 0), 0);

  const shiftBarData = {
    labels: ['Shift A (06:00–14:00)', 'Shift B (14:00–22:00)', 'Shift C (22:00–06:00)'],
    datasets: [
      {
        label: 'Total Meters Drilled',
        data: [shiftA_Meters, shiftB_Meters, shiftC_Meters],
        backgroundColor: ['#003366', '#0284C7', '#D4AF37'],
        borderRadius: 6,
        barThickness: 36,
      }
    ]
  };

  // 4. Cumulative Camp Comparison (Bar)
  const campCompList = (summaryData?.campComparison && summaryData.campComparison.length > 0)
    ? summaryData.campComparison
    : activeCamps.map(c => {
        const cMeters = reportsList
          .filter(r => r.campId === c.id || r.campName === c.campName)
          .reduce((sum, r) => sum + (parseFloat(r.dailyProgress) || 0), 0);
        return { campName: c.campName, totalMeters: cMeters };
      });

  const cumulativeBarData = {
    labels: campCompList.map(c => c.campName),
    datasets: [
      {
        label: 'Meters Drilled',
        data: campCompList.map(c => parseFloat(c.totalMeters || 0)),
        backgroundColor: campCompList.map((_, i) => CAMP_PALETTE[i % CAMP_PALETTE.length]),
        borderRadius: 6,
        barThickness: 28,
      }
    ]
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          padding: 12,
          font: { size: 11 },
          generateLabels: (chart) => {
            const data = chart.data;
            return data.labels.map((label, i) => ({
              text: `${label}  (${data.datasets[0].data[i]})`,
              fillStyle: data.datasets[0].backgroundColor[i],
              hidden: false,
              index: i,
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: ctx => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${ctx.parsed} reports (${pct}%)`;
          }
        }
      }
    }
  };

  const horizontalBarOpts = {
    ...baseBarOpts,
    indexAxis: 'y',
    scales: {
      x: {
        grid: { color: 'rgba(100,116,139,0.12)' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: v => `${v} m` },
        title: { display: true, text: 'Cumulative Meters Drilled', font: { size: 11 }, color: '#94a3b8' }
      },
      y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } }
    },
    plugins: {
      ...baseBarOpts.plugins,
      legend: { display: false },
      tooltip: {
        ...baseBarOpts.plugins.tooltip,
        callbacks: {
          label: ctx => ` Total: ${ctx.parsed.x} meters drilled`
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Exploration Analytics &amp; Performance Trends
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time quantitative metrics synced with system reports and dashboard summary
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 text-xs font-semibold">
          {['monthly', 'weekly'].map(r => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={`px-3 py-1.5 rounded-md capitalize transition ${activeRange === r ? 'bg-white dark:bg-slate-600 text-cmpdi-navy dark:text-sky-300 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Tiles Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Total Meters Drilled" value={totalMeters.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} unit="m" sub="Across all exploration camps" icon={Pickaxe} accent="blue" />
        <KpiTile label="Monthly Progress" value={monthlyProgress.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} unit="m" sub="Current calendar month output" icon={TrendingUp} accent="emerald" />
        <KpiTile label="Avg. Shift Output" value={avgEfficiency} unit="m/report" sub="Average drilling speed per report" icon={Activity} accent="cyan" />
        <KpiTile label="Annual Target Progress" value={targetPct} unit="%" sub={`${totalMeters} / ${totalYearlyTarget} m target`} icon={Target} accent="violet" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Reports Approved" value={approvedCount} unit="" sub="Permanently locked records" icon={CheckCircle2} accent="emerald" />
        <KpiTile label="Pending HQ Review" value={pendingCount} unit="" sub="Awaiting department approval" icon={Clock} accent="amber" />
        <KpiTile label="Returned for Correction" value={returnedCount} unit="" sub="Action required by camp exec" icon={RotateCcw} accent="rose" />
        <KpiTile label="Draft Reports" value={draftCount} unit="" sub="Unsubmitted drafts" icon={Fuel} accent="blue" />
      </div>

      {/* Row 1 — Line + Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          className="lg:col-span-2"
          title="Monthly Drilling Progress by Camp"
          subtitle="Cumulative meters drilled per month — calculated from live reports"
        >
          <div className="h-72">
            <Line data={monthlyLineData} options={baseLineOpts} />
          </div>
        </ChartCard>

        <ChartCard
          title="Report Status Breakdown"
          subtitle="Distribution of all system reports by current status"
        >
          <div className="h-72">
            <Doughnut data={statusDoughnutData} options={doughnutOpts} />
          </div>
          {/* Centre stat */}
          <div className="mt-3 flex justify-center">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Total Reports System-wide: <span className="text-slate-800 dark:text-white font-bold">{totalReportsCount}</span>
            </span>
          </div>
        </ChartCard>
      </div>

      {/* Row 2 — Shift Bar + Cumulative Horizontal Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          className="lg:col-span-2"
          title="Shift-Wise Drilling Output"
          subtitle="Total meters drilled broken down by Shift A (Morning), Shift B (Evening) &amp; Shift C (Night)"
        >
          <div className="h-72">
            <Bar data={shiftBarData} options={{
              ...baseBarOpts,
              plugins: {
                ...baseBarOpts.plugins,
                legend: { display: false }
              },
              scales: {
                ...baseBarOpts.scales,
                y: {
                  ...baseBarOpts.scales.y,
                  ticks: { font: { size: 11 }, color: '#64748b', callback: v => `${v} m` },
                  title: { display: true, text: 'Meters Drilled', font: { size: 11 }, color: '#94a3b8' }
                }
              }
            }} />
          </div>
        </ChartCard>

        <ChartCard
          title="Cumulative Camp Progress"
          subtitle="Total meters drilled per camp — synced with Dashboard"
        >
          <div className="h-72">
            <Bar data={cumulativeBarData} options={horizontalBarOpts} />
          </div>
          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {campCompList.map((c, i) => (
              <div key={c.campName} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: CAMP_PALETTE[i % CAMP_PALETTE.length] }} />
                  <span className="text-slate-600 dark:text-slate-400">{c.campName}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{(parseFloat(c.totalMeters) || 0).toFixed(1)} m</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Info Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Activity className="w-4 h-4 shrink-0 text-slate-400" />
        <span>All analytics are calculated dynamically from <strong className="text-slate-700 dark:text-slate-300">live database records</strong>. Charts update automatically as new daily reports are entered or approved.</span>
      </div>
    </div>
  );
};
