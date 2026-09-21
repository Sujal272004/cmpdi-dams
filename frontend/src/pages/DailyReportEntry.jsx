import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Save, Send, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

const Star = () => <span className="text-rose-500 font-bold ml-1" title="Mandatory Field">*</span>;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getTargetForMachineAndMonth = (machineList, machineNum, monthName) => {
  if (!machineList || machineList.length === 0 || !machineNum || !monthName) return null;
  const mach = machineList.find(m =>
    m.machineNumber?.trim().toLowerCase() === machineNum?.trim().toLowerCase()
  );
  if (!mach) return null;
  if (mach.monthwiseTargets && mach.monthwiseTargets[monthName] !== undefined && mach.monthwiseTargets[monthName] !== null) {
    return mach.monthwiseTargets[monthName];
  }
  if (mach.monthlyTarget !== undefined && mach.monthlyTarget !== null) {
    return mach.monthlyTarget;
  }
  return null;
};

export const DailyReportEntry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [camps, setCamps] = useState([]);
  const [machines, setMachines] = useState([]);
  const [bits, setBits] = useState([]);
  const [isCustomBit, setIsCustomBit] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    campId: user?.campId || 1,
    machineNumber: user?.campId === 1 ? 'RIG-AND-101' : user?.campId === 2 ? 'RIG-MRP-201' : 'RIG-DGP-301',
    shift: 'General Shift',
    plannedDepth: '',
    openingDepth: '148.00',
    closingDepth: '162.50',
    cumulativeDepth: '162.50',
    drillingStartTime: '06:00',
    drillingEndTime: '18:00',
    // Mandatory Borehole & Remarks details
    blockName: 'Block A',
    boreholeId: 'BH-AND-04',
    bitNo: 'BIT-NX-98472',
    boreholeDepth: '162.50',
    boreholeStartDate: new Date().toISOString().split('T')[0],
    workingHours: '12.00',
    preventiveHours: '0.00',
    dieselPump: '15.00',
    dieselRig: '45.00',
    remarks: 'Normal drilling operation in General Shift. Core recovery satisfactory.',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine current month name based on reportDate or today
  const dateObj = formData.reportDate ? new Date(formData.reportDate + 'T00:00:00') : new Date();
  const currentMonthName = MONTH_NAMES[isNaN(dateObj.getTime()) ? new Date().getMonth() : dateObj.getMonth()];
  const currentMonthTarget = getTargetForMachineAndMonth(machines, formData.machineNumber, currentMonthName);

  // Fetch camps, machines, and drill bits on mount, defaulting plannedDepth to current month's target
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [campsData, machinesData, bitsData] = await Promise.all([
          apiService.getCamps(),
          apiService.getMachines(),
          apiService.getBits()
        ]);
        const campList = campsData || [];
        const machineList = machinesData || [];
        const bitList = bitsData || [];
        setCamps(campList);
        setMachines(machineList);
        setBits(bitList);

        const initialCampId = user?.campId || (campList[0] ? campList[0].id : 1);
        const campMachines = machineList.filter(m => m.campId === parseInt(initialCampId));
        const initialMachine = campMachines.length > 0
          ? campMachines[0].machineNumber
          : (initialCampId === 1 ? 'RIG-AND-101' : initialCampId === 2 ? 'RIG-MRP-201' : 'RIG-DGP-301');

        const nowMonthName = MONTH_NAMES[new Date().getMonth()];
        const target = getTargetForMachineAndMonth(machineList, initialMachine, nowMonthName);

        const assignedBit = bitList.find(b => b.assignedMachineNumber?.trim().toUpperCase() === initialMachine?.trim().toUpperCase())
          || bitList.find(b => b.campId === parseInt(initialCampId) && b.status === 'IN_USE')
          || bitList.find(b => b.campId === parseInt(initialCampId));

        setFormData(prev => ({
          ...prev,
          campId: initialCampId,
          machineNumber: initialMachine,
          bitNo: assignedBit ? assignedBit.bitNumber : 'BIT-NX-98472',
          plannedDepth: target !== null && target !== undefined ? String(target) : '350.00'
        }));
      } catch (err) {
        console.error("Error loading master data in DailyReportEntry:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user]);

  // Auto calculated daily progress
  const openingNum = parseFloat(formData.openingDepth) || 0;
  const closingNum = parseFloat(formData.closingDepth) || 0;
  const dailyProgress = Math.max(0, (closingNum - openingNum)).toFixed(2);

  // Available bits for currently selected camp
  const campBits = bits.filter(b => !formData.campId || b.campId === parseInt(formData.campId));

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'campId') {
      const nextCampId = parseInt(value);
      const nextCampMachines = machines.filter(m => m.campId === nextCampId);
      const nextMachine = nextCampMachines.length > 0 ? nextCampMachines[0].machineNumber : '';
      const target = getTargetForMachineAndMonth(machines, nextMachine, currentMonthName);
      const assignedBit = bits.find(b => b.assignedMachineNumber?.trim().toUpperCase() === nextMachine?.trim().toUpperCase())
        || bits.find(b => b.campId === nextCampId && b.status === 'IN_USE')
        || bits.find(b => b.campId === nextCampId);
      setFormData(prev => ({
        ...prev,
        campId: value,
        machineNumber: nextMachine || prev.machineNumber,
        bitNo: assignedBit ? assignedBit.bitNumber : prev.bitNo,
        plannedDepth: target !== null && target !== undefined ? String(target) : prev.plannedDepth
      }));
      setError(null);
      return;
    }

    if (name === 'machineNumber') {
      const target = getTargetForMachineAndMonth(machines, value, currentMonthName);
      const assignedBit = bits.find(b => b.assignedMachineNumber?.trim().toUpperCase() === value?.trim().toUpperCase());
      setFormData(prev => ({
        ...prev,
        machineNumber: value,
        bitNo: assignedBit ? assignedBit.bitNumber : prev.bitNo,
        plannedDepth: target !== null && target !== undefined ? String(target) : prev.plannedDepth
      }));
      setError(null);
      return;
    }

    if (name === 'reportDate') {
      const d = value ? new Date(value + 'T00:00:00') : new Date();
      const mName = MONTH_NAMES[isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth()];
      const target = getTargetForMachineAndMonth(machines, formData.machineNumber, mName);
      setFormData(prev => ({
        ...prev,
        reportDate: value,
        plannedDepth: target !== null && target !== undefined ? String(target) : prev.plannedDepth
      }));
      setError(null);
      return;
    }

    if (name === 'shift') {
      const isGeneral = value === 'General Shift';
      setFormData(prev => ({
        ...prev,
        shift: value,
        drillingStartTime: isGeneral ? '06:00' : '18:00',
        drillingEndTime: isGeneral ? '18:00' : '06:00',
        workingHours: '12.00'
      }));
      setError(null);
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e, status = 'DRAFT') => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate mandatory fields
    if (!formData.reportDate || !formData.campId || !formData.machineNumber?.trim()) {
      setError("Please complete all basic identification mandatory fields (*).");
      return;
    }

    if (!formData.blockName?.trim() || !formData.boreholeId?.trim() || !formData.boreholeDepth || !formData.boreholeStartDate) {
      setError("Borehole details (Block Name, Borehole ID, Borehole Depth, Start Date) are mandatory fields (*).");
      return;
    }

    if (!formData.remarks?.trim()) {
      setError("Operational field remarks are mandatory (*).");
      return;
    }

    if (closingNum < openingNum) {
      setError("Closing depth cannot be less than opening depth.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        campId: parseInt(formData.campId),
        drillHole: formData.drillHole || formData.boreholeId || formData.machineNumber,
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
        preventiveHours: parseFloat(formData.preventiveHours) || 0,
        dieselPump: parseFloat(formData.dieselPump) || null,
        dieselRig: parseFloat(formData.dieselRig) || null,
        remarks: formData.remarks.trim(),
        blockName: formData.blockName.trim(),
        boreholeId: formData.boreholeId.trim(),
        bitNo: formData.bitNo ? formData.bitNo.trim() : null,
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
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Daily Drilling Progress Entry</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Submit official shift progress data for CMPDI exploration records</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
          Fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date<Star /></label>
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
              <label className={labelClass}>Drilling Camp<Star /></label>
              <select
                name="campId"
                value={formData.campId}
                onChange={handleChange}
                required
                className={inputClass}
              >
                {camps.length > 0 ? (
                  camps.map(c => (
                    <option key={c.id} value={c.id}>{c.campName}</option>
                  ))
                ) : (
                  <>
                    <option value="1">Anandwan Camp</option>
                    <option value="2">Murpar Camp</option>
                    <option value="3">Durgapur Camp</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className={labelClass}>Machine / Rig Number<Star /></label>
              {machines.filter(m => m.campId === parseInt(formData.campId)).length > 0 ? (
                <select
                  name="machineNumber"
                  value={formData.machineNumber}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  {machines
                    .filter(m => m.campId === parseInt(formData.campId))
                    .map(m => (
                      <option key={m.id} value={m.machineNumber}>
                        {m.machineNumber} {m.machineName ? `(${m.machineName})` : ''}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="machineNumber"
                  value={formData.machineNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. RIG-AND-101"
                  className={inputClass}
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Shift Timing & Depth Progress */}
        <div>
          <h3 className={sectionHeadClass}>2. Shift Timing &amp; Depth Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Shift<Star /></label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="General Shift">General Shift (06:00 AM - 6:00 PM)</option>
                <option value="Night Shift">Night Shift (6:00 PM - 06:00 AM)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Planned Target Depth (m)</label>
              <input
                type="number"
                step="any"
                name="plannedDepth"
                value={formData.plannedDepth}
                onChange={handleChange}
                placeholder="Target depth in meters"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Opening Depth (m)<Star /></label>
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
              <label className={labelClass}>Closing Depth (m)<Star /></label>
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
              <label className={labelClass}>Block Name<Star /></label>
              <input
                type="text"
                name="blockName"
                value={formData.blockName}
                onChange={handleChange}
                required
                placeholder="e.g. Block A"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Borehole ID<Star /></label>
              <input
                type="text"
                name="boreholeId"
                value={formData.boreholeId}
                onChange={handleChange}
                required
                placeholder="e.g. BH-AND-01"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Bit No. (Manufacturer S/N)<Star /></label>
              <select
                name="bitNo"
                value={formData.bitNo}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">-- Select Drill Bit --</option>
                {campBits.map(b => (
                  <option key={b.id || b.bitNumber} value={b.bitNumber}>
                    {b.bitNumber} — {b.bitType} ({b.size}) {b.assignedMachineNumber ? `[Rig: ${b.assignedMachineNumber}]` : '[Stock]'}
                  </option>
                ))}
                {formData.bitNo && !campBits.some(b => b.bitNumber === formData.bitNo) && (
                  <option value={formData.bitNo}>{formData.bitNo} (Current / Assigned)</option>
                )}
              </select>
            </div>

            <div>
              <label className={labelClass}>Borehole Depth (m)<Star /></label>
              <input
                type="number"
                step="0.01"
                name="boreholeDepth"
                value={formData.boreholeDepth}
                onChange={handleChange}
                required
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Borehole Start Date<Star /></label>
              <input
                type="date"
                name="boreholeStartDate"
                value={formData.boreholeStartDate}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>
        </div>


        {/* Section 4: Operational Parameters & Field Remarks */}
        <div>
          <h3 className={sectionHeadClass}>4. Operational Parameters &amp; Field Remarks</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelClass}>Preventive Hrs (hrs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="preventiveHours"
                value={formData.preventiveHours}
                onChange={handleChange}
                placeholder="e.g. 1.50"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Diesel in Pump (liters)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="dieselPump"
                value={formData.dieselPump}
                onChange={handleChange}
                placeholder="e.g. 15.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Diesel in Rig (liters)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="dieselRig"
                value={formData.dieselRig}
                onChange={handleChange}
                placeholder="e.g. 45.00"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Operational Remarks &amp; Observations<Star /></label>
            <textarea
              rows="4"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              required
              placeholder="Enter operational observations, delay reasons, maintenance details, etc. (Required)"
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

