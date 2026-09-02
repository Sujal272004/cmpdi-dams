import React, { useEffect, useState, useMemo } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusChip } from '../components/common/StatusChip';
import { Link } from 'react-router-dom';
import {
  History, Filter, RotateCcw, Eye, CalendarDays,
  CalendarRange, CalendarCheck2, Sun, MapPin
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getWeekNumber = (dateStr) => {
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d - startOfYear;
  return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
};

const getISOWeekLabel = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt) => dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
};

const isSunday = (dateStr) => new Date(dateStr).getDay() === 0;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Shared sub-components ────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'blue' }) => {
  const colors = {
    blue:    'text-cmpdi-navy dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber:   'text-amber-600 dark:text-amber-400',
    violet:  'text-violet-600 dark:text-violet-400',
  };
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
};

const inputCls = "w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cmpdi-navy focus:outline-none";
const labelCls = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";
const thCls = "p-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300";
const tdCls = "p-3 text-xs text-slate-700 dark:text-slate-200";

// ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'daily',    label: 'Daily Drilling',    icon: CalendarDays },
  { key: 'weekly',   label: 'Weekly Drilling',   icon: CalendarRange },
  { key: 'monthly',  label: 'Monthly Drilling',  icon: CalendarCheck2 },
  { key: 'sunday',   label: 'Sundaywise Drilling', icon: Sun },
];

// ─── DAILY TAB ────────────────────────────────────────────────────────────────
const DailyTab = ({ reports, loading, isCampExec }) => {
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', campId: '', blockName: '', bitNo: '', status: '' });

  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (filters.fromDate && r.reportDate < filters.fromDate) return false;
      if (filters.toDate   && r.reportDate > filters.toDate)   return false;
      if (filters.campId   && r.campId !== parseInt(filters.campId)) return false;
      if (filters.blockName && !r.blockName?.toLowerCase().includes(filters.blockName.toLowerCase())) return false;
      if (filters.bitNo     && !r.bitNo?.toLowerCase().includes(filters.bitNo.toLowerCase())) return false;
      if (filters.status   && r.reportStatus !== filters.status) return false;
      return true;
    });
  }, [reports, filters]);

  const totalMeters   = filtered.reduce((s, r) => s + (r.dailyProgress || 0), 0);
  const avgMeters     = filtered.length ? (totalMeters / filtered.length).toFixed(2) : 0;
  const approvedCount = filtered.filter(r => r.reportStatus === 'APPROVED').length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-500" /> Multi-Field Filters
          </span>
          <button onClick={() => setFilters({ fromDate: '', toDate: '', campId: '', blockName: '', bitNo: '', status: '' })}
            className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className={labelCls}>From Date</label>
            <input type="date" value={filters.fromDate} onChange={e => setFilters(p => ({ ...p, fromDate: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>To Date</label>
            <input type="date" value={filters.toDate} onChange={e => setFilters(p => ({ ...p, toDate: e.target.value }))} className={inputCls} />
          </div>
          {!isCampExec && (
            <div>
              <label className={labelCls}>Camp</label>
              <select value={filters.campId} onChange={e => setFilters(p => ({ ...p, campId: e.target.value }))} className={inputCls}>
                <option value="">All Camps</option>
                <option value="1">Anandwan</option>
                <option value="2">Murpar</option>
                <option value="3">Durgapur</option>
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Block Name</label>
            <input
              type="text"
              placeholder="Search block..."
              value={filters.blockName}
              onChange={e => setFilters(p => ({ ...p, blockName: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Bit No. (S/N)</label>
            <input
              type="text"
              placeholder="Search Bit No..."
              value={filters.bitNo}
              onChange={e => setFilters(p => ({ ...p, bitNo: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className={inputCls}>
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="RETURNED">Returned</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Meters Drilled" value={`${totalMeters.toFixed(2)} m`} color="blue" />
        <StatCard label="Avg Daily Progress"   value={`${avgMeters} m/shift`} color="emerald" />
        <StatCard label="Matching Records"      value={filtered.length} color="violet" />
        <StatCard label="Approved Records"      value={`${filtered.length ? ((approvedCount/filtered.length)*100).toFixed(0) : 0}%`} color="amber" sub={`${approvedCount} of ${filtered.length}`} />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className={thCls}>#ID</th>
                <th className={thCls}>Date</th>
                <th className={thCls}>Camp</th>
                <th className={thCls}>Block Name</th>
                <th className={thCls}>Machine</th>
                <th className={thCls}>Drill Hole</th>
                <th className={thCls}>Bit No.</th>
                <th className={thCls}>Shift</th>
                <th className={thCls}>Progress</th>
                <th className={thCls}>Status</th>
                <th className={`${thCls} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="11" className="p-8 text-center text-slate-400">Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="11" className="p-8 text-center text-slate-400">No records match the filters.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.reportId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className={`${tdCls} font-bold text-cmpdi-navy dark:text-sky-400`}>#{r.reportId}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{r.reportDate}</td>
                  <td className={`${tdCls} font-semibold`}>{r.campName}</td>
                  <td className={`${tdCls} font-medium text-slate-600 dark:text-slate-300`}>{r.blockName || '—'}</td>
                  <td className={tdCls}>{r.machineNumber}</td>
                  <td className={`${tdCls} font-bold`}>{r.drillHole}</td>
                  <td className={`${tdCls} font-medium text-amber-700 dark:text-amber-300`}>{r.bitNo || '—'}</td>
                  <td className={tdCls}>{r.shift?.replace('SHIFT_', 'Shift ')}</td>
                  <td className={`${tdCls} font-bold text-blue-700 dark:text-sky-300`}>{r.dailyProgress} m</td>
                  <td className={tdCls}><StatusChip status={r.reportStatus} /></td>
                  <td className={`${tdCls} text-right`}>
                    <Link to={`/reports/${r.reportId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-cmpdi-navy hover:text-white transition">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// ─── WEEKLY TAB ───────────────────────────────────────────────────────────────
const WeeklyTab = ({ reports, loading, isCampExec }) => {
  const [campId, setCampId]       = useState('');
  const [blockName, setBlockName] = useState('');
  const [bitNo, setBitNo]         = useState('');
  const [year, setYear]           = useState(new Date().getFullYear().toString());

  const grouped = useMemo(() => {
    let base = reports.filter(r => {
      if (campId && r.campId !== parseInt(campId)) return false;
      if (blockName && !r.blockName?.toLowerCase().includes(blockName.toLowerCase())) return false;
      if (bitNo && !r.bitNo?.toLowerCase().includes(bitNo.toLowerCase())) return false;
      if (year   && !r.reportDate.startsWith(year)) return false;
      return true;
    });

    const map = {};
    base.forEach(r => {
      const wk   = getWeekNumber(r.reportDate);
      const key  = `${r.reportDate.slice(0, 4)}-W${String(wk).padStart(2, '0')}`;
      const lbl  = getISOWeekLabel(r.reportDate);
      if (!map[key]) map[key] = { weekKey: key, weekLabel: lbl, records: [], totalMeters: 0, camps: new Set() };
      map[key].records.push(r);
      map[key].totalMeters += r.dailyProgress || 0;
      map[key].camps.add(r.campName);
    });

    return Object.values(map)
      .sort((a, b) => b.weekKey.localeCompare(a.weekKey))
      .map(w => ({ ...w, camps: [...w.camps].join(', '), avgMeters: (w.totalMeters / w.records.length).toFixed(2) }));
  }, [reports, campId, blockName, bitNo, year]);

  const grandTotal = grouped.reduce((s, w) => s + w.totalMeters, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className={`grid gap-3 ${isCampExec ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-2 lg:grid-cols-5'}`}>
          <div>
            <label className={labelCls}>Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className={inputCls}>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
          {!isCampExec && (
            <div>
              <label className={labelCls}>Camp</label>
              <select value={campId} onChange={e => setCampId(e.target.value)} className={inputCls}>
                <option value="">All Camps</option>
                <option value="1">Anandwan</option>
                <option value="2">Murpar</option>
                <option value="3">Durgapur</option>
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Block Name</label>
            <input
              type="text"
              placeholder="Search block..."
              value={blockName}
              onChange={e => setBlockName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Bit No. (S/N)</label>
            <input
              type="text"
              placeholder="Search Bit No..."
              value={bitNo}
              onChange={e => setBitNo(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setCampId(''); setBlockName(''); setBitNo(''); setYear(new Date().getFullYear().toString()); }}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center gap-1 transition">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Weeks" value={grouped.length} sub="with drilling activity" color="violet" />
        <StatCard label="Grand Total Meters" value={`${grandTotal.toFixed(2)} m`} color="blue" />
        <StatCard label="Avg per Week" value={`${grouped.length ? (grandTotal / grouped.length).toFixed(2) : 0} m`} color="emerald" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className={thCls}>Week</th>
                <th className={thCls}>Date Range</th>
                <th className={thCls}>Reports</th>
                <th className={thCls}>Camps Active</th>
                <th className={thCls}>Total Meters</th>
                <th className={thCls}>Avg / Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading...</td></tr>
              ) : grouped.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No weekly data found.</td></tr>
              ) : grouped.map(w => (
                <tr key={w.weekKey} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className={`${tdCls} font-bold text-cmpdi-navy dark:text-sky-400`}>{w.weekKey}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{w.weekLabel}</td>
                  <td className={tdCls}>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-semibold">{w.records.length}</span>
                  </td>
                  <td className={tdCls}>{w.camps}</td>
                  <td className={`${tdCls} font-extrabold text-blue-700 dark:text-sky-300`}>{w.totalMeters.toFixed(2)} m</td>
                  <td className={`${tdCls} font-semibold text-emerald-600 dark:text-emerald-400`}>{w.avgMeters} m</td>
                </tr>
              ))}
            </tbody>
            {grouped.length > 0 && (
              <tfoot className="bg-cmpdi-navy/5 dark:bg-cmpdi-navy/20 border-t-2 border-cmpdi-navy/20">
                <tr>
                  <td colSpan="4" className="p-3 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Grand Total</td>
                  <td className="p-3 text-sm font-extrabold text-cmpdi-navy dark:text-sky-300">{grandTotal.toFixed(2)} m</td>
                  <td className="p-3 text-xs font-semibold text-emerald-600">{grouped.length ? (grandTotal / grouped.length).toFixed(2) : 0} m</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── MONTHLY TAB ──────────────────────────────────────────────────────────────
const MonthlyTab = ({ reports, loading, isCampExec }) => {
  const [campId, setCampId]       = useState('');
  const [blockName, setBlockName] = useState('');
  const [bitNo, setBitNo]         = useState('');
  const [year, setYear]           = useState(new Date().getFullYear().toString());

  const grouped = useMemo(() => {
    let base = reports.filter(r => {
      if (campId && r.campId !== parseInt(campId)) return false;
      if (blockName && !r.blockName?.toLowerCase().includes(blockName.toLowerCase())) return false;
      if (bitNo && !r.bitNo?.toLowerCase().includes(bitNo.toLowerCase())) return false;
      if (year   && !r.reportDate.startsWith(year)) return false;
      return true;
    });

    const map = {};
    base.forEach(r => {
      const monthKey = r.reportDate.slice(0, 7); // YYYY-MM
      const [y, m]   = monthKey.split('-');
      if (!map[monthKey]) map[monthKey] = {
        monthKey, monthLabel: `${MONTH_NAMES[parseInt(m) - 1]} ${y}`,
        records: [], totalMeters: 0, camps: new Set(), approvedCount: 0
      };
      map[monthKey].records.push(r);
      map[monthKey].totalMeters += r.dailyProgress || 0;
      map[monthKey].camps.add(r.campName);
      if (r.reportStatus === 'APPROVED') map[monthKey].approvedCount++;
    });

    return Object.values(map)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map(m => ({
        ...m,
        camps: [...m.camps].join(', '),
        avgPerDay: (m.totalMeters / m.records.length).toFixed(2),
      }));
  }, [reports, campId, blockName, bitNo, year]);

  const grandTotal = grouped.reduce((s, m) => s + m.totalMeters, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className={`grid gap-3 ${isCampExec ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-2 lg:grid-cols-5'}`}>
          <div>
            <label className={labelCls}>Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className={inputCls}>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
          {!isCampExec && (
            <div>
              <label className={labelCls}>Camp</label>
              <select value={campId} onChange={e => setCampId(e.target.value)} className={inputCls}>
                <option value="">All Camps</option>
                <option value="1">Anandwan</option>
                <option value="2">Murpar</option>
                <option value="3">Durgapur</option>
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Block Name</label>
            <input
              type="text"
              placeholder="Search block..."
              value={blockName}
              onChange={e => setBlockName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Bit No. (S/N)</label>
            <input
              type="text"
              placeholder="Search Bit No..."
              value={bitNo}
              onChange={e => setBitNo(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setCampId(''); setBlockName(''); setBitNo(''); setYear(new Date().getFullYear().toString()); }}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center gap-1 transition">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Months with Data" value={grouped.length} color="violet" />
        <StatCard label="Grand Total Meters" value={`${grandTotal.toFixed(2)} m`} color="blue" />
        <StatCard label="Best Month" value={grouped.length ? `${Math.max(...grouped.map(m => m.totalMeters)).toFixed(2)} m` : '—'} color="emerald" />
        <StatCard label="Avg per Month" value={`${grouped.length ? (grandTotal / grouped.length).toFixed(2) : 0} m`} color="amber" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className={thCls}>Month</th>
                <th className={thCls}>Total Reports</th>
                <th className={thCls}>Approved</th>
                <th className={thCls}>Camps Active</th>
                <th className={thCls}>Total Meters</th>
                <th className={thCls}>Avg / Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading...</td></tr>
              ) : grouped.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No monthly data found.</td></tr>
              ) : grouped.map(m => (
                <tr key={m.monthKey} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className={`${tdCls} font-bold text-cmpdi-navy dark:text-sky-400`}>{m.monthLabel}</td>
                  <td className={tdCls}>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-semibold">{m.records.length}</span>
                  </td>
                  <td className={tdCls}>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">{m.approvedCount}</span>
                  </td>
                  <td className={tdCls}>{m.camps}</td>
                  <td className={`${tdCls} font-extrabold text-blue-700 dark:text-sky-300`}>{m.totalMeters.toFixed(2)} m</td>
                  <td className={`${tdCls} font-semibold text-emerald-600 dark:text-emerald-400`}>{m.avgPerDay} m</td>
                </tr>
              ))}
            </tbody>
            {grouped.length > 0 && (
              <tfoot className="bg-cmpdi-navy/5 dark:bg-cmpdi-navy/20 border-t-2 border-cmpdi-navy/20">
                <tr>
                  <td colSpan="4" className="p-3 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Yearly Grand Total</td>
                  <td className="p-3 text-sm font-extrabold text-cmpdi-navy dark:text-sky-300">{grandTotal.toFixed(2)} m</td>
                  <td className="p-3 text-xs font-semibold text-emerald-600">
                    {grouped.length ? (grandTotal / grouped.length).toFixed(2) : 0} m/mo avg
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── SUNDAY TAB ───────────────────────────────────────────────────────────────
const SundayTab = ({ reports, loading, isCampExec }) => {
  const [campId, setCampId]       = useState('');
  const [blockName, setBlockName] = useState('');
  const [bitNo, setBitNo]         = useState('');
  const [month,  setMonth]        = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  const sundayReports = useMemo(() => {
    return reports.filter(r => {
      if (!isSunday(r.reportDate)) return false;
      if (campId && r.campId !== parseInt(campId)) return false;
      if (blockName && !r.blockName?.toLowerCase().includes(blockName.toLowerCase())) return false;
      if (bitNo && !r.bitNo?.toLowerCase().includes(bitNo.toLowerCase())) return false;
      if (month  && !r.reportDate.startsWith(month)) return false;
      return true;
    }).sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  }, [reports, campId, blockName, bitNo, month]);

  // Group by Sunday date for summary
  const byDate = useMemo(() => {
    const map = {};
    sundayReports.forEach(r => {
      if (!map[r.reportDate]) map[r.reportDate] = { date: r.reportDate, records: [], totalMeters: 0 };
      map[r.reportDate].records.push(r);
      map[r.reportDate].totalMeters += r.dailyProgress || 0;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [sundayReports]);

  const grandTotal    = sundayReports.reduce((s, r) => s + (r.dailyProgress || 0), 0);
  const sundayCount   = byDate.length;
  const [yr, mo]      = month.split('-');
  const monthLabel    = `${MONTH_NAMES[parseInt(mo) - 1]} ${yr}`;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
        <Sun className="w-4 h-4 shrink-0 text-amber-500" />
        <span><strong>Sundaywise Drilling</strong> — shows all drilling reports recorded on Sundays for the selected month, with a grand total of meters drilled on those Sundays.</span>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className={`grid gap-3 ${isCampExec ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-2 lg:grid-cols-5'}`}>
          <div>
            <label className={labelCls}>Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className={inputCls} />
          </div>
          {!isCampExec && (
            <div>
              <label className={labelCls}>Camp</label>
              <select value={campId} onChange={e => setCampId(e.target.value)} className={inputCls}>
                <option value="">All Camps</option>
                <option value="1">Anandwan</option>
                <option value="2">Murpar</option>
                <option value="3">Durgapur</option>
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Block Name</label>
            <input
              type="text"
              placeholder="Search block..."
              value={blockName}
              onChange={e => setBlockName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Bit No. (S/N)</label>
            <input
              type="text"
              placeholder="Search Bit No..."
              value={bitNo}
              onChange={e => setBitNo(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setCampId(''); setBlockName(''); setBitNo(''); setMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`); }}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center gap-1 transition">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Month Selected" value={monthLabel} color="amber" />
        <StatCard label="Sundays with Drilling" value={sundayCount} sub="out of ~4-5 Sundays" color="violet" />
        <StatCard label="Total Sunday Reports" value={sundayReports.length} color="blue" />
        <StatCard label="Total Sunday Meters" value={`${grandTotal.toFixed(2)} m`} color="emerald" sub="Grand total for month" />
      </div>

      {/* Sunday Summary Cards */}
      {byDate.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {byDate.map(sd => {
            const dateObj = new Date(sd.date);
            const fmtDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            return (
              <div key={sd.date} className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{fmtDate}</span>
                </div>
                <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300">{sd.totalMeters.toFixed(2)} m</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{sd.records.length} shift report{sd.records.length !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            All Sunday Reports — {monthLabel}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className={thCls}>#ID</th>
                <th className={thCls}>Sunday Date</th>
                <th className={thCls}>Camp</th>
                <th className={thCls}>Block Name</th>
                <th className={thCls}>Machine</th>
                <th className={thCls}>Drill Hole</th>
                <th className={thCls}>Bit No.</th>
                <th className={thCls}>Shift</th>
                <th className={thCls}>Meters</th>
                <th className={thCls}>Status</th>
                <th className={`${thCls} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="11" className="p-8 text-center text-slate-400">Loading...</td></tr>
              ) : sundayReports.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-10 text-center">
                    <Sun className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No drilling records found on Sundays in {monthLabel}.</p>
                  </td>
                </tr>
              ) : sundayReports.map(r => (
                <tr key={r.reportId} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition">
                  <td className={`${tdCls} font-bold text-cmpdi-navy dark:text-sky-400`}>#{r.reportId}</td>
                  <td className={`${tdCls} font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap`}>{r.reportDate} <span className="text-[10px] text-amber-500">(Sun)</span></td>
                  <td className={`${tdCls} font-semibold`}>{r.campName}</td>
                  <td className={`${tdCls} font-medium text-slate-600 dark:text-slate-300`}>{r.blockName || '—'}</td>
                  <td className={tdCls}>{r.machineNumber}</td>
                  <td className={`${tdCls} font-bold`}>{r.drillHole}</td>
                  <td className={`${tdCls} font-medium text-amber-700 dark:text-amber-300`}>{r.bitNo || '—'}</td>
                  <td className={tdCls}>{r.shift?.replace('SHIFT_', 'Shift ')}</td>
                  <td className={`${tdCls} font-extrabold text-amber-700 dark:text-amber-300`}>{r.dailyProgress} m</td>
                  <td className={tdCls}><StatusChip status={r.reportStatus} /></td>
                  <td className={`${tdCls} text-right`}>
                    <Link to={`/reports/${r.reportId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-cmpdi-navy hover:text-white transition">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            {sundayReports.length > 0 && (
              <tfoot className="bg-amber-50 dark:bg-amber-950/20 border-t-2 border-amber-200 dark:border-amber-800">
                <tr>
                  <td colSpan="7" className="p-3 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Total Sunday Drilling — {monthLabel}
                  </td>
                  <td className="p-3 text-sm font-extrabold text-amber-700 dark:text-amber-300">{grandTotal.toFixed(2)} m</td>
                  <td colSpan="2" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const ReportHistory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  const isCampExec = user?.role === 'ROLE_CAMP_EXEC';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await apiService.getReports({});
      // Camp execs only see their own camp's records
      const scoped = isCampExec
        ? data.filter(r => r.campId === user.campId)
        : data;
      setReports(scoped);
      setLoading(false);
    };
    load();
  }, [isCampExec, user?.campId]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <History className="w-5 h-5" /> Drilling Activity — Search &amp; History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View drilling records grouped by daily shift, week, month, or Sundays
          </p>
        </div>
        {isCampExec && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cmpdi-navy/10 dark:bg-cmpdi-navy/30 rounded-lg border border-cmpdi-navy/20 text-xs font-semibold text-cmpdi-navy dark:text-sky-300 shrink-0">
            <MapPin className="w-3.5 h-3.5" />
            Viewing: {user.campName}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-1 justify-center ${
              activeTab === key
                ? 'bg-white dark:bg-slate-700 text-cmpdi-navy dark:text-sky-300 shadow-xs border border-slate-200 dark:border-slate-600'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${key === 'sunday' ? 'text-amber-500' : ''}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'daily'   && <DailyTab   reports={reports} loading={loading} isCampExec={isCampExec} />}
      {activeTab === 'weekly'  && <WeeklyTab  reports={reports} loading={loading} isCampExec={isCampExec} />}
      {activeTab === 'monthly' && <MonthlyTab reports={reports} loading={loading} isCampExec={isCampExec} />}
      {activeTab === 'sunday'  && <SundayTab  reports={reports} loading={loading} isCampExec={isCampExec} />}
    </div>
  );
};
