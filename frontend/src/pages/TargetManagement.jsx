import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import {
  Target, Building2, Save, Edit3, CheckCircle2,
  AlertTriangle, Calendar, CalendarDays, CalendarRange, Award, Sparkles, Layers
} from 'lucide-react';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// Helper to format values as clean real whole numbers (no decimals)
const formatInteger = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  return Math.round(parseFloat(val) || 0);
};

export const TargetManagement = () => {
  const { user } = useAuth();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formState, setFormState] = useState({
    dailyTarget: '',
    weeklyTarget: '',
    monthlyTarget: '',
    yearlyTarget: '',
    months: {
      Apr: 450, May: 400, Jun: 300, Jul: 200, Aug: 250, Sep: 350,
      Oct: 450, Nov: 500, Dec: 500, Jan: 450, Feb: 450, Mar: 500
    }
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEditTargets = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_DEPT_EXEC';

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    setLoading(true);
    const data = await apiService.getCamps();
    setCamps(data);
    setLoading(false);
  };

  const handleOpenEdit = (camp) => {
    if (!canEditTargets) return;
    setSelectedCamp(camp);
    const moTarget = formatInteger(camp.monthlyTarget || 450);
    const yrTarget = formatInteger(camp.yearlyTarget || moTarget * 12);
    const wkTarget = formatInteger(camp.weeklyTarget || yrTarget / 52);
    const dyTarget = formatInteger(camp.dailyTarget || moTarget / 30);

    // Initial 12 months estimate based on monthly target
    const initMonths = {};
    MONTHS.forEach(m => {
      initMonths[m] = moTarget;
    });

    setFormState({
      dailyTarget: dyTarget.toString(),
      weeklyTarget: wkTarget.toString(),
      monthlyTarget: moTarget.toString(),
      yearlyTarget: yrTarget.toString(),
      months: initMonths
    });
    setError(null);
    setShowEditModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        dailyTarget: formatInteger(formState.dailyTarget),
        weeklyTarget: formatInteger(formState.weeklyTarget),
        monthlyTarget: formatInteger(formState.monthlyTarget),
        yearlyTarget: formatInteger(formState.yearlyTarget)
      };

      await apiService.updateCampTargets(selectedCamp.id, payload);
      setSuccessMessage(`Official drilling targets for ${selectedCamp.campName} updated successfully!`);
      setShowEditModal(false);
      fetchCamps();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || "Failed to update targets.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recalculates whole integer targets from 12-month grid
  const recalculateFromMonthsGrid = (updatedMonths) => {
    const totalYear = Object.values(updatedMonths).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
    const avgMonth = Math.round(totalYear / 12);
    const avgWeek = Math.round(totalYear / 52);
    const avgDay = Math.round(avgMonth / 30);

    setFormState({
      yearlyTarget: totalYear.toString(),
      monthlyTarget: avgMonth.toString(),
      weeklyTarget: avgWeek.toString(),
      dailyTarget: avgDay.toString(),
      months: updatedMonths
    });
  };

  // Handle individual month input change in grid
  const handleSingleMonthChange = (monthKey, val) => {
    const intVal = Math.max(0, parseInt(val) || 0);
    const updated = { ...formState.months, [monthKey]: intVal };
    recalculateFromMonthsGrid(updated);
  };

  // Handle main monthly target input change (Fills all 12 months evenly)
  const handleMonthlyTargetChange = (val) => {
    const moVal = Math.max(0, parseInt(val) || 0);
    const updatedMonths = {};
    MONTHS.forEach(m => {
      updatedMonths[m] = moVal;
    });
    recalculateFromMonthsGrid(updatedMonths);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <Target className="w-5 h-5" /> Camp Drilling Targets Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {canEditTargets
              ? "Set month-by-month target metrics for all 12 months with real-number auto-calculation for Day, Week, and Year targets"
              : `Official Day, Week, Month, and Year drilling targets assigned to ${user?.campName || 'your camp'} by HQ`}
          </p>
        </div>
        {!canEditTargets && (
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 text-xs font-semibold self-start sm:self-auto">
            HQ Assigned Targets (View Only)
          </span>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid of Camp Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-slate-400">Loading camp target configurations...</div>
        ) : (
          camps.map((camp) => {
            const isMyCamp = user?.campId === camp.id;
            return (
              <div
                key={camp.id}
                className={`bg-white dark:bg-slate-800 rounded-xl shadow-xs border p-5 space-y-4 transition ${isMyCamp
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-700'
                  }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cmpdi-navy/10 dark:bg-cmpdi-navy/30 text-cmpdi-navy dark:text-sky-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{camp.campName}</h3>
                        {isMyCamp && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-400 text-slate-950">
                            YOUR CAMP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{camp.campCode}</p>
                    </div>
                  </div>
                  {canEditTargets ? (
                    <button
                      onClick={() => handleOpenEdit(camp)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Targets
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">Active Target</span>
                  )}
                </div>

                {/* Targets List */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> Day Target
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatInteger(camp.dailyTarget)} <span className="text-xs font-normal text-slate-500">m/day</span></p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <CalendarRange className="w-3.5 h-3.5 text-emerald-500" /> Week Target
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatInteger(camp.weeklyTarget)} <span className="text-xs font-normal text-slate-500">m/wk</span></p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" /> Month Target
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatInteger(camp.monthlyTarget)} <span className="text-xs font-normal text-slate-500">m/mo</span></p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <Award className="w-3.5 h-3.5 text-violet-500" /> Year Target
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatInteger(camp.yearlyTarget)} <span className="text-xs font-normal text-slate-500">m/yr</span></p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Target Master Overview Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-cmpdi-navy dark:text-sky-400" /> All-Camp Drilling Targets Master Table
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-700/60 uppercase font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Camp Code</th>
                <th className="p-3">Camp Name</th>
                <th className="p-3">Location</th>
                <th className="p-3">Day Target (m)</th>
                <th className="p-3">Week Target (m)</th>
                <th className="p-3">Month Target (m)</th>
                <th className="p-3">Year Target (m)</th>
                {canEditTargets && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {camps.map(camp => (
                <tr key={camp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">{camp.campCode}</td>
                  <td className="p-3 font-semibold">{camp.campName}</td>
                  <td className="p-3 text-slate-500">{camp.location}</td>
                  <td className="p-3 font-bold text-blue-600">{formatInteger(camp.dailyTarget)} m</td>
                  <td className="p-3 font-bold text-emerald-600">{formatInteger(camp.weeklyTarget)} m</td>
                  <td className="p-3 font-bold text-amber-600">{formatInteger(camp.monthlyTarget)} m</td>
                  <td className="p-3 font-bold text-violet-600">{formatInteger(camp.yearlyTarget)} m</td>
                  {canEditTargets && (
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(camp)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
                      >
                        Update
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Targets Modal */}
      {showEditModal && selectedCamp && canEditTargets && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Configure Targets for ${selectedCamp.campName}`}
        >
          <form onSubmit={handleSave} className="space-y-5 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Auto Calculation Banner */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-500" /> Financial Year Target Calculator (Apr – Mar)
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Enter custom targets for each month of the <strong>Financial Year (Apr to Mar)</strong>. The system automatically calculates whole integer totals for Year Target (Sum of 12 FY Months), Week Target (Year / 52), and Day Target (Avg Month / 30).
              </p>
            </div>

            {/* Quick Fill Default Target */}
            <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
              <label className="block font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                <span>Quick Fill Default Monthly Target (Meters)</span>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase bg-blue-200 dark:bg-blue-900/60 px-2 py-0.5 rounded">Quick Fill</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formState.monthlyTarget}
                  onChange={e => handleMonthlyTargetChange(e.target.value)}
                  placeholder="e.g. 500"
                  className="flex-1 p-2 text-sm font-bold border border-blue-300 dark:border-blue-700 rounded-lg dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[10px] text-blue-600 dark:text-blue-400">
                Entering a number here fills all 12 FY months with this value. You can adjust individual months below.
              </p>
            </div>

            {/* 12 Months Custom Breakdown Grid */}
            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" /> Financial Year Monthly Grid (Apr – Mar)
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {MONTHS.map((m) => (
                  <div key={m} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">{m}</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.months[m] ?? 0}
                      onChange={e => handleSingleMonthChange(m, e.target.value)}
                      className="w-full p-1.5 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Calculated Real Numbers */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 space-y-3 pt-3">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">
                Calculated Targets Summary (Whole Real Numbers)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-500 font-semibold">Day Target</span>
                  <strong className="text-base text-blue-600 dark:text-sky-400">{formatInteger(formState.dailyTarget)} m</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-500 font-semibold">Week Target</span>
                  <strong className="text-base text-emerald-600 dark:text-emerald-400">{formatInteger(formState.weeklyTarget)} m</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-500 font-semibold">Avg Month</span>
                  <strong className="text-base text-amber-600 dark:text-amber-400">{formatInteger(formState.monthlyTarget)} m</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-500 font-semibold">Year Total</span>
                  <strong className="text-base text-violet-600 dark:text-violet-400">{formatInteger(formState.yearlyTarget)} m</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-cmpdi-navy text-white font-bold rounded-lg hover:bg-cmpdi-light transition flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4 text-amber-400" /> Save Whole Target Values
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};


