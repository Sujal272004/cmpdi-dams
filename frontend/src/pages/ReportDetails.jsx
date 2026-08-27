import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusChip } from '../components/common/StatusChip';
import { Modal } from '../components/common/Modal';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  RotateCcw,
  Edit3,
  Printer,
  History,
  Trash2,
  Send
} from 'lucide-react';

export const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [correctionRemark, setCorrectionRemark] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  // Form state for editing
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    const data = await apiService.getReportById(id);
    setReport(data);
    setEditForm(data || {});
    // Auto open edit mode if coming from edit button or query param or if report is RETURNED
    if (data?.reportStatus === 'RETURNED' || location.search.includes('edit=true') || location.state?.edit) {
      setIsEditing(true);
    }
    setLoading(false);
  };

  const isApproved = report?.reportStatus === 'APPROVED';
  const isDeptExecOrAdmin = user?.role === 'ROLE_DEPT_EXEC' || user?.role === 'ROLE_ADMIN';
  const canEdit = !isApproved && (user?.role === 'ROLE_CAMP_EXEC' || user?.role === 'ROLE_ADMIN');

  const handleApprove = async () => {
    await apiService.approveReport(report.reportId, user);
    setActionMessage("Report approved and locked permanently.");
    fetchDetail();
  };

  const handleDeleteDraft = async () => {
    if (window.confirm(`Are you sure you want to delete Draft Report #${report.reportId}? This action cannot be undone.`)) {
      await apiService.deleteReport(report.reportId, user);
      navigate(-1);
    }
  };

  const handleDeleteApproved = async () => {
    if (window.confirm(`[ADMIN ONLY] Are you sure you want to delete Approved Report #${report.reportId}? This action cannot be undone.`)) {
      await apiService.deleteReport(report.reportId, user);
      navigate('/approved');
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!correctionRemark.trim()) return;

    await apiService.returnReport(report.reportId, correctionRemark, user);
    setShowReturnModal(false);
    setCorrectionRemark('');
    setActionMessage("Report returned to camp executive with correction remarks.");
    fetchDetail();
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Safe NaN-proof calculations so toFixed never crashes
  const rawOpening = parseFloat(editForm?.openingDepth);
  const rawClosing = parseFloat(editForm?.closingDepth);
  const editOpeningNum = Number.isNaN(rawOpening) ? 0 : rawOpening;
  const editClosingNum = Number.isNaN(rawClosing) ? 0 : rawClosing;
  const progressDiff = editClosingNum - editOpeningNum;
  const editDailyProgress = (Number.isNaN(progressDiff) || progressDiff < 0 ? 0 : progressDiff).toFixed(2);

  const handleSaveEdit = async (e, targetStatus) => {
    e.preventDefault();
    const payload = {
      ...editForm,
      openingDepth: editOpeningNum,
      closingDepth: editClosingNum,
      dailyProgress: parseFloat(editDailyProgress),
      plannedDepth: parseFloat(editForm?.plannedDepth) || 0,
      boreholeDepth: parseFloat(editForm?.boreholeDepth) || null,
      workingHours: parseFloat(editForm?.workingHours) || null,
      dieselPump: parseFloat(editForm?.dieselPump) || null,
      dieselRig: parseFloat(editForm?.dieselRig) || null,
      reportStatus: targetStatus || editForm?.reportStatus
    };

    await apiService.updateReport(report.reportId, payload, user);
    setIsEditing(false);
    setActionMessage("Report updated and resubmitted successfully.");
    fetchDetail();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading daily report details...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-rose-500 font-bold">Report not found.</div>;
  }

  const inputCls = "w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cmpdi-navy focus:outline-none";
  const labelCls = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";
  const secHeadCls = "text-xs font-bold uppercase tracking-wider text-cmpdi-navy dark:text-sky-400 pb-2 border-b border-slate-200 dark:border-slate-700 mb-4";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">
              Drilling Report #{report.reportId}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{report.campName} • Date: {report.reportDate}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={report.reportStatus} />

          {/* Department Executive Actions */}
          {isDeptExecOrAdmin && report.reportStatus === 'SUBMITTED' && (
            <>
              <button
                onClick={handleApprove}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Report
              </button>
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Return for Correction
              </button>
            </>
          )}

          {/* Camp Executive Edit Action */}
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Report
            </button>
          )}

          {/* Delete Draft Action */}
          {report.reportStatus === 'DRAFT' && (
            <button
              onClick={handleDeleteDraft}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Draft
            </button>
          )}

          {/* Delete Approved Action (System Admin Only) */}
          {isApproved && user?.role === 'ROLE_ADMIN' && (
            <button
              onClick={handleDeleteApproved}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1"
              title="Delete approved report (System Admin only)"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Approved Report
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Print Official Record"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          {actionMessage}
        </div>
      )}

      {/* Returned for Correction Alert Banner */}
      {report.reportStatus === 'RETURNED' && !isEditing && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" /> Report Returned for Correction
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
            >
              Edit All Parameters &amp; Resubmit
            </button>
          </div>
          {report.correctionHistory?.[0] && (
            <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-200 dark:border-rose-950">
              <span className="font-bold text-rose-700 dark:text-rose-400">HQ Remark:</span> "{report.correctionHistory[0].remarks}"
            </p>
          )}
        </div>
      )}

      {/* Lock banner if approved */}
      {isApproved && (
        <div className="p-4 rounded-xl bg-slate-900 text-amber-400 text-xs font-semibold border border-amber-400/30 flex items-center gap-2 shadow-xs">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>PERMANENTLY LOCKED: This report was approved by {report.approvedBy} on {new Date(report.approvedDate || Date.now()).toLocaleDateString()}. Data is immutable.</span>
        </div>
      )}

      {/* Read-Only Details Box vs Full Edit Form */}
      {!isEditing ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 space-y-6">
          {/* Section 1: Identification */}
          <div>
            <h3 className={secHeadCls}>1. Operational Identification</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div><span className="text-slate-500">Report Date:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.reportDate}</p></div>
              <div><span className="text-slate-500">Drilling Camp:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.campName}</p></div>
              <div><span className="text-slate-500">Machine / Rig ID:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.machineNumber}</p></div>
              <div><span className="text-slate-500">Drill Hole ID:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.drillHole}</p></div>
            </div>
          </div>

          {/* Section 2: Depths & Progress */}
          <div>
            <h3 className={secHeadCls}>2. Shift &amp; Depth Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div><span className="text-slate-500">Shift Name:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.shift?.replace('_', ' ')}</p></div>
              <div><span className="text-slate-500">Opening Depth:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.openingDepth} m</p></div>
              <div><span className="text-slate-500">Closing Depth:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.closingDepth} m</p></div>
              <div>
                <span className="text-slate-500">Shift Daily Progress:</span>
                <p className="font-extrabold text-sm text-blue-700 dark:text-sky-300 mt-0.5">{report.dailyProgress} m</p>
              </div>
            </div>
          </div>

          {/* Section 3: Borehole Details */}
          <div>
            <h3 className={secHeadCls}>3. Borehole Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div><span className="text-slate-500">Block Name:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.blockName || '—'}</p></div>
              <div><span className="text-slate-500">Borehole ID:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.boreholeId || '—'}</p></div>
              <div><span className="text-slate-500">Borehole Depth:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.boreholeDepth ? `${report.boreholeDepth} m` : '—'}</p></div>
              <div><span className="text-slate-500">Borehole Start Date:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.boreholeStartDate || '—'}</p></div>
            </div>
          </div>

          {/* Section 4: Operational Data */}
          <div>
            <h3 className={secHeadCls}>4. Operational Data</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div><span className="text-slate-500">Working Hours:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.workingHours ? `${report.workingHours} hrs` : '—'}</p></div>
              <div><span className="text-slate-500">Diesel in Pump:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.dieselPump ? `${report.dieselPump} Ltrs` : '—'}</p></div>
              <div><span className="text-slate-500">Diesel in Rig:</span><p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.dieselRig ? `${report.dieselRig} Ltrs` : '—'}</p></div>
            </div>
            <div className="mt-4 text-xs">
              <span className="text-slate-500 font-semibold">Field Remarks:</span>
              <p className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-medium mt-1">
                {report.remarks || 'No specific remarks entered.'}
              </p>
            </div>
          </div>

          {/* Correction History Log */}
          {report.correctionHistory && report.correctionHistory.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 pb-2 border-b border-slate-200 dark:border-slate-700 mb-4 flex items-center gap-1.5">
                <History className="w-4 h-4" /> Correction History Log
              </h3>
              <div className="space-y-3">
                {report.correctionHistory.map((c) => (
                  <div key={c.id} className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 text-xs">
                    <p className="font-bold text-rose-900 dark:text-rose-300">"{c.remarks}"</p>
                    <p className="text-[11px] text-slate-500 mt-1">Returned by {c.createdBy} on {new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Full Comprehensive Edit Form Mode */
        <form
          onSubmit={(e) => handleSaveEdit(e, report.reportStatus === 'RETURNED' ? 'SUBMITTED' : report.reportStatus)}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-cmpdi-navy dark:text-sky-400">
                Edit All Report Parameters #{report.reportId}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modify all operational, depth, borehole, and diesel parameters before resubmission
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-400 text-slate-950">
              FULL EDIT MODE
            </span>
          </div>

          {/* Section 1: Identification */}
          <div>
            <h4 className={secHeadCls}>1. Operational Identification</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Date</label>
                <input
                  type="date"
                  name="reportDate"
                  value={editForm.reportDate || ''}
                  onChange={handleEditChange}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Drilling Camp</label>
                <select
                  name="campId"
                  value={editForm.campId || ''}
                  onChange={handleEditChange}
                  required
                  className={inputCls}
                >
                  <option value="1">Anandwan Camp</option>
                  <option value="2">Murpar Camp</option>
                  <option value="3">Durgapur Camp</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Machine / Rig Number</label>
                <input
                  type="text"
                  name="machineNumber"
                  value={editForm.machineNumber || ''}
                  onChange={handleEditChange}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Drill Hole ID</label>
                <input
                  type="text"
                  name="drillHole"
                  value={editForm.drillHole || ''}
                  onChange={handleEditChange}
                  required
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shift & Depths */}
          <div>
            <h4 className={secHeadCls}>2. Shift Timing &amp; Depth Progress</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Shift</label>
                <select
                  name="shift"
                  value={editForm.shift || ''}
                  onChange={handleEditChange}
                  required
                  className={inputCls}
                >
                  <option value="SHIFT_A">Shift A (06:00 - 14:00)</option>
                  <option value="SHIFT_B">Shift B (14:00 - 22:00)</option>
                  <option value="SHIFT_C">Shift C (22:00 - 06:00)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Planned Depth (m)</label>
                <input
                  type="number"
                  step="0.01"
                  name="plannedDepth"
                  value={editForm.plannedDepth || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Opening Depth (m)</label>
                <input
                  type="number"
                  step="0.01"
                  name="openingDepth"
                  value={editForm.openingDepth || ''}
                  onChange={handleEditChange}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Closing Depth (m)</label>
                <input
                  type="number"
                  step="0.01"
                  name="closingDepth"
                  value={editForm.closingDepth || ''}
                  onChange={handleEditChange}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            {/* Auto progress box */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                  Updated Daily Progress (Auto Calculated)
                </span>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">Closing Depth − Opening Depth</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-blue-900 dark:text-sky-300">{editDailyProgress}</span>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 ml-1">meters</span>
              </div>
            </div>
          </div>

          {/* Section 3: Borehole Details */}
          <div>
            <h4 className={secHeadCls}>3. Borehole Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Block Name</label>
                <input
                  type="text"
                  name="blockName"
                  value={editForm.blockName || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Borehole ID</label>
                <input
                  type="text"
                  name="boreholeId"
                  value={editForm.boreholeId || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Borehole Depth (m)</label>
                <input
                  type="number"
                  step="0.01"
                  name="boreholeDepth"
                  value={editForm.boreholeDepth || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Borehole Start Date</label>
                <input
                  type="date"
                  name="boreholeStartDate"
                  value={editForm.boreholeStartDate || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Operational Data */}
          <div>
            <h4 className={secHeadCls}>4. Operational Data &amp; Remarks</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Working Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  name="workingHours"
                  value={editForm.workingHours || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Diesel in Pump (Ltrs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="dieselPump"
                  value={editForm.dieselPump || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Diesel in Rig (Ltrs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="dieselRig"
                  value={editForm.dieselRig || ''}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Field Remarks</label>
              <textarea
                rows="3"
                name="remarks"
                value={editForm.remarks || ''}
                onChange={handleEditChange}
                className={inputCls}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-cmpdi-navy text-white hover:bg-cmpdi-light transition flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-4 h-4 text-amber-400" /> Save &amp; Resubmit to HQ
            </button>
          </div>
        </form>
      )}

      {/* Return Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Return Report for Correction"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Mandatory Correction Remarks *</label>
            <textarea
              rows="4"
              value={correctionRemark}
              onChange={(e) => setCorrectionRemark(e.target.value)}
              placeholder="State the exact parameters that require correction..."
              className="w-full p-2.5 border rounded-lg text-xs dark:bg-slate-900"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowReturnModal(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white"
            >
              Confirm & Return Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
