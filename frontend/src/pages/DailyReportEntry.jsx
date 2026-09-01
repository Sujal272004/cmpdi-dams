import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Save, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const DailyReportEntry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    campId: user?.campId || 1,
    machineNumber: user?.campId === 1 ? 'RIG-AND-101' : user?.campId === 2 ? 'RIG-MRP-201' : 'RIG-DGP-301',
    drillHole: 'DH-AND-04',
    shift: 'SHIFT_A',
    plannedDepth: '350.00',
    openingDepth: '148.00',
    closingDepth: '162.50',
    cumulativeDepth: '162.50',
    drillingStartTime: '06:00',
    drillingEndTime: '14:00',
    // New fields
    blockName: '',
    boreholeId: '',
    bitNo: '',
    boreholeStartDate: '',
    workingHours: '',
    dieselPump: '',
    dieselRig: '',
    remarks: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto calculated daily progress
  const openingNum = parseFloat(formData.openingDepth) || 0;
  const closingNum = parseFloat(formData.closingDepth) || 0;
  const dailyProgress = Math.max(0, (closingNum - openingNum)).toFixed(2);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e, status = 'DRAFT') => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (closingNum < openingNum) {
      setError("Closing depth cannot be less than opening depth.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        campId: parseInt(formData.campId),
        plannedDepth: parseFloat(formData.plannedDepth) || null,
        openingDepth: parseFloat(formData.openingDepth) || 0,
        closingDepth: parseFloat(formData.closingDepth) || 0,
        dailyProgress: parseFloat(dailyProgress) || 0,
        cumulativeDepth: parseFloat(formData.cumulativeDepth) || null,
        boreholeDepth: parseFloat(formData.boreholeDepth) || null,
        boreholeStartDate: formData.boreholeStartDate ? formData.boreholeStartDate : null,
        drillingStartTime: formData.drillingStartTime ? formData.drillingStartTime : null,
        drillingEndTime: formData.drillingEndTime ? formData.drillingEndTime : null,
        workingHours: parseFloat(formData.workingHours) || null,
        dieselPump: parseFloat(formData.dieselPump) || null,
        dieselRig: parseFloat(formData.dieselRig) || null,
        remarks: formData.remarks || null,
        blockName: formData.blockName || null,
        boreholeId: formData.boreholeId || null,
        bitNo: formData.bitNo || null,
        reportStatus: status
      };

      await apiService.createReport(payload, user);
      setSuccess(`Daily drilling report ${status === 'SUBMITTED' ? 'submitted to Department HQ' : 'saved as draft'} successfully!`);
      setTimeout(() => {
        navigate('/my-reports');
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to create daily report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cmpdi-navy focus:outline-none";
  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";
  const sectionHeadClass = "text-xs font-bold uppercase tracking-wider text-cmpdi-navy dark:text-sky-400 pb-2 border-b border-slate-200 dark:border-slate-700 mb-4";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Daily Drilling Progress Entry</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Submit official shift progress data for CMPDI exploration records</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'SUBMITTED')} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 space-y-6">

        {/* Section 1: Camp & Drilling Identification */}
        <div>
          <h3 className={sectionHeadClass}>1. Camp &amp; Drilling Identification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                name="reportDate"
                value={formData.reportDate}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Drilling Camp</label>
              <select
                name="campId"
                value={formData.campId}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="1">Anandwan Camp</option>
                <option value="2">Murpar Camp</option>
                <option value="3">Durgapur Camp</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Machine / Rig Number</label>
              <input
                type="text"
                name="machineNumber"
                value={formData.machineNumber}
                onChange={handleChange}
                required
                placeholder="e.g. RIG-AND-101"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Drill Hole ID</label>
              <input
                type="text"
                name="drillHole"
                value={formData.drillHole}
                onChange={handleChange}
                required
                placeholder="e.g. DH-AND-04"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shift Timing & Depth Progress */}
        <div>
          <h3 className={sectionHeadClass}>2. Shift Timing &amp; Depth Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Shift</label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="SHIFT_A">Shift A (06:00 - 14:00)</option>
                <option value="SHIFT_B">Shift B (14:00 - 22:00)</option>
                <option value="SHIFT_C">Shift C (22:00 - 06:00)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Planned Target Depth (m)</label>
              <input
                type="number"
                step="0.01"
                name="plannedDepth"
                value={formData.plannedDepth}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Opening Depth (m)</label>
              <input
                type="number"
                step="0.01"
                name="openingDepth"
                value={formData.openingDepth}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Closing Depth (m)</label>
              <input
                type="number"
                step="0.01"
                name="closingDepth"
                value={formData.closingDepth}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Auto calculated progress highlight card */}
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">Shift Daily Progress (Auto Calculated)</span>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">Closing Depth − Opening Depth</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-blue-900 dark:text-sky-300">{dailyProgress}</span>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 ml-1">meters</span>
            </div>
          </div>
        </div>

        {/* Section 3: Borehole & Equipment Details */}
        <div>
          <h3 className={sectionHeadClass}>3. Borehole &amp; Bit Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className={labelClass}>Block Name</label>
              <input
                type="text"
                name="blockName"
                value={formData.blockName}
                onChange={handleChange}
                placeholder="e.g. Block A"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Borehole ID</label>
              <input
                type="text"
                name="boreholeId"
                value={formData.boreholeId}
                onChange={handleChange}
                placeholder="e.g. BH-AND-01"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Bit No. (Manufacturer S/N)</label>
              <input
                type="text"
                name="bitNo"
                value={formData.bitNo}
                onChange={handleChange}
                placeholder="e.g. BIT-SN-98472"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Borehole Depth (m)</label>
              <input
                type="number"
                step="0.01"
                name="boreholeDepth"
                value={formData.boreholeDepth}
                onChange={handleChange}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Borehole Start Date</label>
              <input
                type="date"
                name="boreholeStartDate"
                value={formData.boreholeStartDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>


        {/* Section 4: Field Remarks */}
        <div>
          <h3 className={sectionHeadClass}>4. Field Remarks</h3>
          <div>
            <label className={labelClass}>Operational Remarks &amp; Observations</label>
            <textarea
              rows="4"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Enter any specific field operational observations, delay reasons, formation notes, etc."
              className={inputClass}
            />
          </div>
        </div>


        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-slate-500" /> Save as Draft
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-cmpdi-navy text-white hover:bg-cmpdi-light transition flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-4 h-4 text-amber-400" /> {isSubmitting ? 'Submitting...' : 'Submit Report to HQ'}
          </button>
        </div>
      </form>
    </div>
  );
};
