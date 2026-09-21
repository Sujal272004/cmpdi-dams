import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import {
  Cpu,
  Building2,
  Plus,
  Trash2,
  Edit3,
  Target,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Sliders,
  X
} from 'lucide-react';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const MACHINE_TYPES = [
  'Diamond Core Rig',
  'Hydrostatic Core Rig',
  'Heavy Duty Core Drill',
  'Rotary Drilling Rig',
  'Reverse Circulation Rig',
  'DTH Hammer Rig'
];

export const MachineManagement = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isDeptExec = user?.role === 'ROLE_DEPT_EXEC';
  const canManage = isAdmin || isDeptExec;

  // Pre-select camp from URL query param (?campId=X) when navigated from Camp Management
  const urlCampId = searchParams.get('campId') || '';

  const [machines, setMachines] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampId, setSelectedCampId] = useState(urlCampId);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetYear, setTargetYear] = useState(2026);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Form states
  const [machineForm, setMachineForm] = useState({
    machineNumber: '',
    machineName: '',
    machineType: 'Diamond Core Rig',
    campId: '',
    status: 'ACTIVE',
    operatorName: '',
    monthlyTarget: '250'
  });

  const [monthwiseTargets, setMonthwiseTargets] = useState({});
  const [modalError, setModalError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [selectedCampId, targetYear]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const campsData = await apiService.getCamps();
      setCamps(campsData);
      if (campsData.length > 0 && !machineForm.campId) {
        setMachineForm(prev => ({ ...prev, campId: campsData[0].id.toString() }));
      }
      await fetchMachines();
    } catch (err) {
      console.error("Error loading initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const data = await apiService.getMachines(selectedCampId ? parseInt(selectedCampId) : null, targetYear);
      setMachines(data);
    } catch (err) {
      console.error("Error loading machines:", err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered machines
  const filteredMachines = machines.filter(m => {
    const matchesCamp = !selectedCampId || m.campId === parseInt(selectedCampId);
    const matchesStatus = !statusFilter || m.status === statusFilter;
    const matchesSearch = !searchQuery ||
      m.machineNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.machineName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.operatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.machineType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCamp && matchesStatus && matchesSearch;
  });

  // Fleet Statistics
  const totalFleetCount = machines.length;
  const activeCount = machines.filter(m => m.status === 'ACTIVE').length;
  const maintenanceCount = machines.filter(m => m.status === 'MAINTENANCE' || m.status === 'STANDBY').length;
  const totalFleetTargetMeters = machines.reduce((sum, m) => sum + (parseFloat(m.yearlyTarget) || 0), 0);

  // Handlers for Add Machine
  const handleOpenAdd = () => {
    setMachineForm({
      machineNumber: '',
      machineName: '',
      machineType: 'Diamond Core Rig',
      campId: camps[0]?.id?.toString() || '',
      status: 'ACTIVE',
      operatorName: '',
      monthlyTarget: '0'
    });
    setModalError(null);
    setShowAddModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!machineForm.machineNumber.trim()) {
      setModalError("Rig code is required (e.g. RIG-AND-103)");
      return;
    }
    if (!machineForm.campId) {
      setModalError("Please select an assigned camp");
      return;
    }

    setIsSubmitting(true);
    try {
      const rigCode = machineForm.machineNumber.trim().toUpperCase();
      const payload = {
        machineNumber: rigCode,
        machineName: rigCode,
        machineType: 'Diamond Core Rig',
        campId: parseInt(machineForm.campId),
        status: machineForm.status || 'ACTIVE',
        monthlyTarget: 0,
        yearlyTarget: 0,
        targetYear
      };

      await apiService.createMachine(payload);
      showToast(`Rig ${payload.machineNumber} added to fleet successfully!`);
      setShowAddModal(false);
      fetchMachines();
    } catch (err) {
      setModalError(err.message || "Failed to create machine");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Edit Machine
  const handleOpenEdit = (machine) => {
    setSelectedMachine(machine);
    setMachineForm({
      machineNumber: machine.machineNumber || '',
      campId: machine.campId ? machine.campId.toString() : (camps[0]?.id?.toString() || ''),
      status: machine.status || 'ACTIVE'
    });
    setModalError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!machineForm.machineNumber.trim()) {
      setModalError("Rig code is required (e.g. RIG-AND-103)");
      return;
    }
    if (!machineForm.campId) {
      setModalError("Please select an assigned camp");
      return;
    }

    setIsSubmitting(true);
    try {
      const rigCode = machineForm.machineNumber.trim().toUpperCase();
      const payload = {
        machineNumber: rigCode,
        campId: parseInt(machineForm.campId),
        status: machineForm.status || 'ACTIVE',
        targetYear
      };

      await apiService.updateMachine(selectedMachine.id, payload);
      showToast(`Rig ${payload.machineNumber} updated.`);
      setShowEditModal(false);
      fetchMachines();
    } catch (err) {
      setModalError(err.message || "Failed to update machine");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Monthwise Targets
  const handleOpenTargets = async (machine) => {
    setSelectedMachine(machine);
    setModalError(null);
    const existing = machine.monthwiseTargets || {};
    const baseTarget = Math.round(machine.monthlyTarget || 250);

    const initMonths = {};
    MONTHS.forEach(m => {
      initMonths[m] = existing[m] !== undefined ? Math.round(existing[m]) : (baseTarget > 0 ? baseTarget : 0);
    });

    setMonthwiseTargets(initMonths);
    setShowTargetModal(true);
  };

  const handleTargetChange = (month, value) => {
    if (value === '') {
      setMonthwiseTargets(prev => ({ ...prev, [month]: '' }));
      return;
    }
    const num = Math.max(0, parseFloat(value) || 0);
    setMonthwiseTargets(prev => ({ ...prev, [month]: num }));
  };

  const totalCalculatedTarget = Object.values(monthwiseTargets).reduce((a, b) => a + (parseFloat(b) || 0), 0);

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);
    try {
      const sanitizedTargets = {};
      MONTHS.forEach(m => {
        sanitizedTargets[m] = parseFloat(monthwiseTargets[m]) || 0;
      });
      const payload = {
        machineId: selectedMachine.id,
        targetYear,
        targets: sanitizedTargets,
        notes: `Updated for FY ${targetYear}-${((targetYear + 1) % 100).toString().padStart(2, '0')}`
      };

      await apiService.updateMachineTargets(selectedMachine.id, payload);
      showToast(`Monthwise targets for ${selectedMachine.machineNumber} saved successfully (${totalCalculatedTarget.toLocaleString()} m/year)!`);
      setShowTargetModal(false);
      fetchMachines();
    } catch (err) {
      setModalError(err.message || "Failed to save monthwise targets");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Delete Machine
  const handleOpenDelete = (machine) => {
    setSelectedMachine(machine);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMachine) return;
    setIsSubmitting(true);
    try {
      await apiService.deleteMachine(selectedMachine.id);
      showToast(`Machine ${selectedMachine.machineNumber} removed from active fleet.`);
      setShowDeleteModal(false);
      fetchMachines();
    } catch (err) {
      showToast(err.message || "Failed to delete machine");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg border border-emerald-500 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-cmpdi-navy to-slate-900 p-6 rounded-2xl shadow-md border border-slate-800 text-white">
        <div>
          {/* Back to Camps button when navigated from a camp */}
          {urlCampId && (
            <button
              onClick={() => navigate('/camps')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 text-xs font-semibold mb-3 transition-colors group"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              Back to Camp Management
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Machine Fleet &amp; Monthwise Targets</h1>
              <p className="text-xs sm:text-sm text-slate-300">
                {urlCampId && camps.find(c => c.id === parseInt(urlCampId))
                  ? `Showing machines for: ${camps.find(c => c.id === parseInt(urlCampId))?.campName}`
                  : 'Manage drilling rigs across exploration camps and configure month-by-month drilling targets'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-slate-400 mr-2">FY:</span>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-bold"
            >
              <option value={2025} className="bg-slate-900 text-white">2025-26</option>
              <option value={2026} className="bg-slate-900 text-white">2026-27</option>
              <option value={2027} className="bg-slate-900 text-white">2027-28</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Drilling Machine</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Fleet Rigs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalFleetCount}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Across {camps.length} Exploration Camps</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Drilling Rigs</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeCount}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{((activeCount / (totalFleetCount || 1)) * 100).toFixed(0)}% Fleet Availability</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-800">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Standby / Maintenance</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{maintenanceCount}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Under service or standby</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-800">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Annual Fleet Target</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{Math.round(totalFleetTargetMeters).toLocaleString()} <span className="text-xs font-normal text-slate-500">m</span></p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sum of all machine targets</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Camp Filter */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCampId}
              onChange={(e) => setSelectedCampId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cmpdi-navy outline-none font-semibold"
            >
              <option value="">All Camps ({camps.length})</option>
              {camps.map(c => (
                <option key={c.id} value={c.id}>{c.campName} ({c.campCode})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-cmpdi-navy outline-none font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Rigs</option>
              <option value="STANDBY">Standby</option>
              <option value="MAINTENANCE">Under Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Rig ID, Model, Operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-cmpdi-navy outline-none"
          />
        </div>
      </div>

      {/* Machine Fleet List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>CMPDI Drilling Machines</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {filteredMachines.length} Rigs
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click <strong className="text-amber-600 dark:text-amber-400">Set Monthwise Targets</strong> to configure monthly targets for any machine
            </p>
          </div>
        </div>

        {filteredMachines.length === 0 ? (
          <div className="p-12 text-center">
            <Cpu className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Drilling Machines Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No machines match the selected camp or search criteria.
            </p>
            {canManage && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 bg-cmpdi-navy text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-cmpdi-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Machine to Camp
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Machine Code / Name</th>
                  <th className="py-3 px-4">Camp Assignment</th>
                  <th className="py-3 px-4">Rig Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Annual Target</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredMachines.map((m) => {
                  const statusColors = {
                    ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    STANDBY: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                    MAINTENANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    INACTIVE: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  };
                  const badgeClass = statusColors[m.status] || statusColors.ACTIVE;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      {/* Code & Model */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{m.machineNumber}</span>
                        </div>
                        {m.machineName && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {m.machineName}
                          </div>
                        )}
                      </td>

                      {/* Camp */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{m.campName || 'Unassigned'}</span>
                        </div>
                        {m.campCode && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {m.campCode}
                          </div>
                        )}
                      </td>

                      {/* Rig Type */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {m.machineType || 'Core Drill'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {m.status}
                        </span>
                      </td>

                      {/* Annual Target */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-800/50">
                          {Math.round(m.yearlyTarget ?? 0).toLocaleString()} m
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Set Monthwise Target Button */}
                          <button
                            onClick={() => handleOpenTargets(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cmpdi-navy/10 hover:bg-cmpdi-navy text-cmpdi-navy hover:text-white dark:bg-amber-500/10 dark:hover:bg-amber-500 dark:text-amber-400 dark:hover:text-slate-950 rounded-lg font-bold text-[11px] transition-all"
                            title="Configure month-by-month drilling target"
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>Set Targets</span>
                          </button>

                          {canManage && (
                            <>
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Edit machine specifications"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleOpenDelete(m)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Delete machine from fleet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD MACHINE */}
      {/* ======================================================== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Drilling Machine"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Rig <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. RIG-AND-103"
                value={machineForm.machineNumber}
                onChange={(e) => setMachineForm({ ...machineForm, machineNumber: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono uppercase focus:ring-2 focus:ring-cmpdi-navy outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Assigned Camp <span className="text-rose-500">*</span>
              </label>
              <select
                value={machineForm.campId}
                onChange={(e) => setMachineForm({ ...machineForm, campId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cmpdi-navy outline-none font-semibold"
              >
                {camps.map(c => (
                  <option key={c.id} value={c.id}>{c.campName} ({c.campCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Operational Status
              </label>
              <select
                value={machineForm.status}
                onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cmpdi-navy outline-none font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="STANDBY">STANDBY</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-cmpdi-navy hover:bg-cmpdi-dark text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Add Machine to Fleet"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: EDIT MACHINE */}
      {/* ======================================================== */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Specifications: ${selectedMachine?.machineNumber}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Rig <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={machineForm.machineNumber}
                onChange={(e) => setMachineForm({ ...machineForm, machineNumber: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono uppercase focus:ring-2 focus:ring-cmpdi-navy outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Assigned Camp <span className="text-rose-500">*</span>
              </label>
              <select
                value={machineForm.campId}
                onChange={(e) => setMachineForm({ ...machineForm, campId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cmpdi-navy outline-none font-semibold"
              >
                {camps.map(c => (
                  <option key={c.id} value={c.id}>{c.campName} ({c.campCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Status
              </label>
              <select
                value={machineForm.status}
                onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cmpdi-navy outline-none font-semibold"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="STANDBY">STANDBY</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-cmpdi-navy hover:bg-cmpdi-dark text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: MONTHWISE TARGETS CONFIGURATION */}
      {/* ======================================================== */}
      <Modal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        title={`Set Monthwise Drilling Targets: ${selectedMachine?.machineNumber}`}
      >
        <form onSubmit={handleSaveTargets} className="space-y-5">
          {modalError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Machine Header Info */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Assigned Camp: </span>
              <span className="font-bold text-slate-800 dark:text-white">{selectedMachine?.campName}</span>
            </div>
            <div>
              <span className="text-slate-400">Rig Type: </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{selectedMachine?.machineType}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Financial Year {targetYear}-{((targetYear + 1) % 100).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* 12 Months Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              Month-by-Month Drilling Target (Meters)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {MONTHS.map((month, idx) => {
                const isMonsoon = month === 'Jul' || month === 'Aug';
                return (
                  <div
                    key={month}
                    className={`p-2.5 rounded-xl border ${isMonsoon
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                        : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {month} <span className="text-[10px] font-normal text-slate-400">({idx < 9 ? targetYear : targetYear + 1})</span>
                      </span>
                      {isMonsoon && (
                        <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Monsoon</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={monthwiseTargets[month] !== undefined ? monthwiseTargets[month] : ''}
                        onChange={(e) => handleTargetChange(month, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white pr-7 focus:ring-2 focus:ring-cmpdi-navy outline-none"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 pointer-events-none">
                        m
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Summary Bar */}
          <div className="p-3 bg-gradient-to-r from-slate-900 to-cmpdi-navy text-white rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-300">Total Yearly Target (Sum of 12 Months)</p>
              <p className="text-lg font-extrabold text-amber-400">
                {totalCalculatedTarget.toLocaleString()} <span className="text-xs font-normal text-white">meters</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-md">
                Updates yearly target directly
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowTargetModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Monthwise Targets"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: DELETE MACHINE CONFIRMATION */}
      {/* ======================================================== */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Machine Deletion"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-200 space-y-1">
              <p className="font-bold">Are you sure you want to delete this drilling machine?</p>
              <p className="text-slate-600 dark:text-slate-300">
                Machine <strong className="font-mono">{selectedMachine?.machineNumber}</strong> ({selectedMachine?.machineName || selectedMachine?.machineType}) assigned to <strong className="font-semibold">{selectedMachine?.campName}</strong> will be marked as deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isSubmitting ? "Deleting..." : "Delete Rig"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MachineManagement;
