import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import {
  Target, Building2, Save, Edit3, CheckCircle2,
  AlertTriangle, Calendar, CalendarDays, CalendarRange, Award
} from 'lucide-react';

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
    yearlyTarget: ''
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
    setFormState({
      dailyTarget: camp.dailyTarget || '',
      weeklyTarget: camp.weeklyTarget || '',
      monthlyTarget: camp.monthlyTarget || '',
      yearlyTarget: camp.yearlyTarget || ''
    });
    setError(null);
    setShowEditModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiService.updateCampTargets(selectedCamp.id, formState);
      setSuccessMessage(`Drilling targets for ${selectedCamp.campName} updated successfully!`);
      setShowEditModal(false);
      fetchCamps();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || "Failed to update targets.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMonthlyTargetChange = (val) => {
    const monthVal = parseFloat(val);
    if (!isNaN(monthVal) && monthVal > 0) {
      // Automatic calculation of definite numbers:
      // Year Target = Month Target * 12
      const yearVal = (monthVal * 12).toFixed(2);
      // Week Target = (Month Target * 12) / 52 weeks
      const weekVal = ((monthVal * 12) / 52).toFixed(2);
      // Day Target = Month Target / 30 days
      const dayVal = (monthVal / 30).toFixed(2);

      setFormState({
        monthlyTarget: val,
        yearlyTarget: parseFloat(yearVal).toString(),
        weeklyTarget: parseFloat(weekVal).toString(),
        dailyTarget: parseFloat(dayVal).toString()
      });
    } else {
      setFormState(p => ({
        ...p,
        monthlyTarget: val
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <Target className="w-5 h-5" /> Camp Drilling Targets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {canEditTargets
              ? "Configure official Day, Week, Month, and Year drilling targets with automatic formula calculation"
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
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">{camp.dailyTarget || 0} <span className="text-xs font-normal text-slate-500">m/day</span></p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <CalendarRange className="w-3.5 h-3.5 text-emerald-500" /> Week Target
                    </div>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">{camp.weeklyTarget || 0} <span className="text-xs font-normal text-slate-500">m/wk</span></p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" /> Month Target
                    </div>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">{camp.monthlyTarget || 0} <span className="text-xs font-normal text-slate-500">m/mo</span></p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <Award className="w-3.5 h-3.5 text-violet-500" /> Year Target
                    </div>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">{camp.yearlyTarget || 0} <span className="text-xs font-normal text-slate-500">m/yr</span></p>
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
                  <td className="p-3 font-bold text-blue-600">{camp.dailyTarget || 0} m</td>
                  <td className="p-3 font-bold text-emerald-600">{camp.weeklyTarget || 0} m</td>
                  <td className="p-3 font-bold text-amber-600">{camp.monthlyTarget || 0} m</td>
                  <td className="p-3 font-bold text-violet-600">{camp.yearlyTarget || 0} m</td>
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
          title={`Update Targets for ${selectedCamp.campName}`}
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Auto Calculation Banner */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
                <Target className="w-4 h-4 text-amber-500" /> Auto-Calculation Mode
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Updating the <strong>Month Target</strong> automatically calculates definite values for <strong>Day Target</strong> (Month / 30), <strong>Week Target</strong> (Year / 52), and <strong>Year Target</strong> (Month × 12).
              </p>
            </div>

            {/* Month Target - Primary */}
            <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20 space-y-1">
              <label className="block font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span>Month Target (Meters / Month)</span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded">Primary Input</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formState.monthlyTarget}
                onChange={e => handleMonthlyTargetChange(e.target.value)}
                placeholder="e.g. 600"
                className="w-full p-2.5 text-sm font-bold border border-amber-400 rounded-lg dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Daily Target */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Day Target (Meters / Day)</span>
                <span className="text-[10px] text-slate-400 font-normal">(Month / 30 days)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formState.dailyTarget}
                onChange={e => setFormState(p => ({ ...p, dailyTarget: e.target.value }))}
                placeholder="e.g. 20.0"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
              />
            </div>

            {/* Weekly Target */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Week Target (Meters / Week)</span>
                <span className="text-[10px] text-slate-400 font-normal">(Year / 52 weeks)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formState.weeklyTarget}
                onChange={e => setFormState(p => ({ ...p, weeklyTarget: e.target.value }))}
                placeholder="e.g. 138.46"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
              />
            </div>

            {/* Yearly Target */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Year Target (Meters / Year)</span>
                <span className="text-[10px] text-slate-400 font-normal">(Month × 12 months)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formState.yearlyTarget}
                onChange={e => setFormState(p => ({ ...p, yearlyTarget: e.target.value }))}
                placeholder="e.g. 7200.0"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
              />
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
                className="px-5 py-2 bg-cmpdi-navy text-white font-bold rounded-lg hover:bg-cmpdi-light transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-amber-400" /> Save Targets
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

