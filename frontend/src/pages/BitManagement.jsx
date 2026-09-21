import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import {
  Disc,
  Building2,
  Cpu,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Activity,
  Layers,
  Wrench,
  Clock,
  Sparkles,
  Award,
  Filter,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';

const BIT_TYPES = [
  'Diamond Core Bit',
  'Surface Set Diamond',
  'Impregnated Diamond',
  'TC Carbide Bit',
  'PDC Core Bit',
  'Tricone Roller Bit'
];

const BIT_SIZES = [
  'NX (75.7mm)',
  'BX (60mm)',
  'NQ (75.7mm)',
  'HQ (96mm)',
  'PQ (122.6mm)',
  '150mm Roller',
  '200mm Roller'
];

const MANUFACTURERS = [
  'Boart Longyear',
  'Christensen',
  'Sandvik',
  'Atlas Copco',
  'DCI Drilling',
  'Diamant Boart',
  'Other / Indigenous'
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available (In Stock)', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
  { value: 'IN_USE', label: 'In Use (On Rig)', color: 'sky', bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800' },
  { value: 'MAINTENANCE', label: 'Maintenance / Retipping', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  { value: 'WORN_OUT', label: 'Worn Out (Retired)', color: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' },
  { value: 'SCRAPPED', label: 'Scrapped', color: 'slate', bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' }
];

export const BitManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isDeptExec = user?.role === 'ROLE_DEPT_EXEC';
  const isCampExec = user?.role === 'ROLE_CAMP_EXEC';
  const canManage = isAdmin || isDeptExec || isCampExec;

  const [bits, setBits] = useState([]);
  const [camps, setCamps] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCampId, setSelectedCampId] = useState(isCampExec && user?.campId ? user.campId.toString() : '');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBit, setSelectedBit] = useState(null);

  // Form State
  const defaultForm = {
    bitNumber: '',
    bitType: 'Diamond Core Bit',
    size: 'NX (75.7mm)',
    manufacturer: 'Boart Longyear',
    campId: user?.campId ? user.campId.toString() : '1',
    assignedMachineNumber: '',
    status: 'AVAILABLE',
    totalMetersDrilled: '0.00',
    issueDate: new Date().toISOString().split('T')[0],
    remarks: ''
  };
  const [bitForm, setBitForm] = useState(defaultForm);
  const [modalError, setModalError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchBits();
  }, [selectedCampId, selectedStatus]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [campsData, machinesData] = await Promise.all([
        apiService.getCamps(),
        apiService.getMachines()
      ]);
      setCamps(campsData || []);
      setMachines(machinesData || []);
      if (campsData?.length > 0 && !bitForm.campId) {
        setBitForm(prev => ({ ...prev, campId: campsData[0].id.toString() }));
      }
      await fetchBits();
    } catch (err) {
      console.error("Error loading initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBits = async () => {
    try {
      const campIdParam = selectedCampId ? parseInt(selectedCampId) : null;
      const data = await apiService.getBits(campIdParam, selectedStatus);
      setBits(data || []);
    } catch (err) {
      console.error("Error loading drill bits:", err);
    }
  };

  // Filtered Bits
  const filteredBits = bits.filter(b => {
    const matchesCamp = !selectedCampId || b.campId === parseInt(selectedCampId);
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    const matchesType = selectedType === 'ALL' || b.bitType === selectedType;
    const matchesSearch = !searchQuery || (
      b.bitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.assignedMachineNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.campName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesCamp && matchesStatus && matchesType && matchesSearch;
  });

  // KPI Calculations
  const totalBitsCount = bits.length;
  const inUseCount = bits.filter(b => b.status === 'IN_USE').length;
  const availableCount = bits.filter(b => b.status === 'AVAILABLE').length;
  const maintenanceCount = bits.filter(b => b.status === 'MAINTENANCE').length;
  const retiredCount = bits.filter(b => b.status === 'WORN_OUT' || b.status === 'SCRAPPED').length;
  const totalMetersSum = bits.reduce((acc, b) => acc + (parseFloat(b.totalMetersDrilled) || 0), 0);

  // Available machines for current modal camp selection
  const campMachines = machines.filter(m => !bitForm.campId || m.campId === parseInt(bitForm.campId));

  const handleOpenAdd = () => {
    setModalError(null);
    setBitForm({
      ...defaultForm,
      campId: selectedCampId || (camps[0]?.id?.toString() || '1')
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (bit) => {
    setModalError(null);
    setSelectedBit(bit);
    setBitForm({
      bitNumber: bit.bitNumber || '',
      bitType: bit.bitType || 'Diamond Core Bit',
      size: bit.size || 'NX (75.7mm)',
      manufacturer: bit.manufacturer || '',
      campId: bit.campId ? bit.campId.toString() : (camps[0]?.id?.toString() || '1'),
      assignedMachineNumber: bit.assignedMachineNumber || '',
      status: bit.status || 'AVAILABLE',
      totalMetersDrilled: (bit.totalMetersDrilled ?? 0).toString(),
      issueDate: bit.issueDate || new Date().toISOString().split('T')[0],
      remarks: bit.remarks || ''
    });
    setShowEditModal(true);
  };

  const handleOpenDelete = (bit) => {
    setSelectedBit(bit);
    setShowDeleteModal(true);
  };

  const handleCreateBit = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!bitForm.bitNumber.trim()) {
      setModalError("Bit Serial Number is required.");
      return;
    }
    if (!bitForm.campId) {
      setModalError("Please select an assigned camp.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createBit({
        bitNumber: bitForm.bitNumber.trim().toUpperCase(),
        bitType: bitForm.bitType,
        size: bitForm.size,
        manufacturer: bitForm.manufacturer,
        campId: parseInt(bitForm.campId),
        assignedMachineNumber: bitForm.assignedMachineNumber || '',
        status: bitForm.status,
        totalMetersDrilled: parseFloat(bitForm.totalMetersDrilled) || 0,
        issueDate: bitForm.issueDate,
        remarks: bitForm.remarks
      });
      setShowAddModal(false);
      showToast(`Drill bit "${bitForm.bitNumber.toUpperCase()}" added successfully.`);
      await fetchBits();
    } catch (err) {
      setModalError(err.message || "Failed to create drill bit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBit = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!bitForm.bitNumber.trim()) {
      setModalError("Bit Serial Number is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.updateBit(selectedBit.id, {
        bitNumber: bitForm.bitNumber.trim().toUpperCase(),
        bitType: bitForm.bitType,
        size: bitForm.size,
        manufacturer: bitForm.manufacturer,
        campId: parseInt(bitForm.campId),
        assignedMachineNumber: bitForm.assignedMachineNumber || '',
        status: bitForm.status,
        totalMetersDrilled: parseFloat(bitForm.totalMetersDrilled) || 0,
        issueDate: bitForm.issueDate,
        remarks: bitForm.remarks
      });
      setShowEditModal(false);
      showToast(`Drill bit "${bitForm.bitNumber.toUpperCase()}" updated successfully.`);
      await fetchBits();
    } catch (err) {
      setModalError(err.message || "Failed to update drill bit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBit = async () => {
    if (!selectedBit) return;
    setIsSubmitting(true);
    try {
      await apiService.deleteBit(selectedBit.id);
      setShowDeleteModal(false);
      showToast(`Drill bit "${selectedBit.bitNumber}" deleted successfully.`);
      await fetchBits();
    } catch (err) {
      showToast(err.message || "Failed to delete drill bit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${opt.bg}`}>
        {opt.label.split(' ')[0]}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg border border-emerald-500 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Drill Bit Inventory &amp; Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage CMPDI drill bit fleet, serial numbers, specifications, rig assignments &amp; meterage lifecycle
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cmpdi-navy dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white text-sm font-semibold shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New Drill Bit
          </button>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Bits</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Disc className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalBitsCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Across all camps</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">In Active Use</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700 dark:text-sky-300 mt-2">{inUseCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Assigned on rigs</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Available Stock</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{availableCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Ready for drilling</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Maintenance / Retip</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">{maintenanceCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Under reconditioning</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Total Metrage</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-2">{totalMetersSum.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs font-normal">m</span></p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Cumulative drilled</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search serial no, make, rig, size..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          {/* Camp Filter */}
          <div>
            <select
              value={selectedCampId}
              onChange={e => setSelectedCampId(e.target.value)}
              disabled={isCampExec && !!user?.campId}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="">All Drilling Camps</option>
              {camps.map(c => (
                <option key={c.id} value={c.id}>{c.campName}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available (In Stock)</option>
              <option value="IN_USE">In Use (On Rig)</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="WORN_OUT">Worn Out (Retired)</option>
              <option value="SCRAPPED">Scrapped</option>
            </select>
          </div>

          {/* Bit Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="ALL">All Bit Types</option>
              {BIT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || selectedCampId || selectedStatus !== 'ALL' || selectedType !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500">
            <span>Showing <b>{filteredBits.length}</b> of <b>{bits.length}</b> drill bits</span>
            <button
              onClick={() => {
                setSearchQuery('');
                if (!isCampExec) setSelectedCampId('');
                setSelectedStatus('ALL');
                setSelectedType('ALL');
              }}
              className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Drill Bits Inventory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Drill Bits Roster
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {filteredBits.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Disc className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
            <p className="text-xs">Loading drill bits inventory...</p>
          </div>
        ) : filteredBits.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Disc className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3 opacity-60" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No drill bits match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing search terms or adding a new bit to the inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Bit Serial No.</th>
                  <th className="py-3 px-4">Type &amp; Size</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Camp Assignment</th>
                  <th className="py-3 px-4">Assigned Rig</th>
                  <th className="py-3 px-4 text-right">Meters Drilled</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Issue Date</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredBits.map(bit => {
                  return (
                    <tr key={bit.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                      {/* Bit Number */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                            <Disc className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block font-mono text-[13px]">
                              {bit.bitNumber}
                            </span>
                            {bit.remarks && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 max-w-xs">
                                {bit.remarks}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type & Size */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {bit.bitType}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {bit.size || 'Standard'}
                        </span>
                      </td>

                      {/* Manufacturer */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {bit.manufacturer || '—'}
                      </td>

                      {/* Camp */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {bit.campName || `Camp #${bit.campId}`}
                        </span>
                      </td>

                      {/* Assigned Rig */}
                      <td className="py-3 px-4">
                        {bit.assignedMachineNumber ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                            <Cpu className="w-3 h-3" />
                            {bit.assignedMachineNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned (In Store)</span>
                        )}
                      </td>

                      {/* Meters Drilled */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-[13px]">
                          {(parseFloat(bit.totalMetersDrilled) || 0).toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">m</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(bit.status)}
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {bit.issueDate || '—'}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(bit)}
                              title="Edit Drill Bit Details"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(bit)}
                              title="Delete Drill Bit"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Bit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Drill Bit"
      >
        <form onSubmit={handleCreateBit} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bit Serial No. / ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BIT-NX-98480"
                value={bitForm.bitNumber}
                onChange={e => setBitForm({ ...bitForm, bitNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bit Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={bitForm.bitType}
                onChange={e => setBitForm({ ...bitForm, bitType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {BIT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Size / Gauge <span className="text-rose-500">*</span>
              </label>
              <select
                value={bitForm.size}
                onChange={e => setBitForm({ ...bitForm, size: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {BIT_SIZES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manufacturer / Make
              </label>
              <select
                value={bitForm.manufacturer}
                onChange={e => setBitForm({ ...bitForm, manufacturer: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {MANUFACTURERS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Camp <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={bitForm.campId}
                onChange={e => setBitForm({ ...bitForm, campId: e.target.value, assignedMachineNumber: '' })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {camps.map(c => (
                  <option key={c.id} value={c.id}>{c.campName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Rig / Machine
              </label>
              <select
                value={bitForm.assignedMachineNumber}
                onChange={e => setBitForm({ ...bitForm, assignedMachineNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">None (Unassigned / In Storage)</option>
                {campMachines.map(m => (
                  <option key={m.id} value={m.machineNumber}>{m.machineNumber} — {m.machineName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operational Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={bitForm.status}
                onChange={e => setBitForm({ ...bitForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Meters Drilled (m)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bitForm.totalMetersDrilled}
                onChange={e => setBitForm({ ...bitForm, totalMetersDrilled: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Issue / Commission Date
              </label>
              <input
                type="date"
                value={bitForm.issueDate}
                onChange={e => setBitForm({ ...bitForm, issueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks &amp; Technical Notes
              </label>
              <textarea
                rows={2}
                placeholder="Crown matrix wear, lithological formation feedback, or storage notes..."
                value={bitForm.remarks}
                onChange={e => setBitForm({ ...bitForm, remarks: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Register Bit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Bit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Drill Bit: ${selectedBit?.bitNumber}`}
      >
        <form onSubmit={handleUpdateBit} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bit Serial No. / ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bitForm.bitNumber}
                onChange={e => setBitForm({ ...bitForm, bitNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bit Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={bitForm.bitType}
                onChange={e => setBitForm({ ...bitForm, bitType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {BIT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Size / Gauge <span className="text-rose-500">*</span>
              </label>
              <select
                value={bitForm.size}
                onChange={e => setBitForm({ ...bitForm, size: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {BIT_SIZES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manufacturer / Make
              </label>
              <select
                value={bitForm.manufacturer}
                onChange={e => setBitForm({ ...bitForm, manufacturer: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {MANUFACTURERS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Camp <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={bitForm.campId}
                onChange={e => setBitForm({ ...bitForm, campId: e.target.value, assignedMachineNumber: '' })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {camps.map(c => (
                  <option key={c.id} value={c.id}>{c.campName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Rig / Machine
              </label>
              <select
                value={bitForm.assignedMachineNumber}
                onChange={e => setBitForm({ ...bitForm, assignedMachineNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">None (Unassigned / In Storage)</option>
                {campMachines.map(m => (
                  <option key={m.id} value={m.machineNumber}>{m.machineNumber} — {m.machineName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Operational Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={bitForm.status}
                onChange={e => setBitForm({ ...bitForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Meters Drilled (m)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bitForm.totalMetersDrilled}
                onChange={e => setBitForm({ ...bitForm, totalMetersDrilled: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Issue / Commission Date
              </label>
              <input
                type="date"
                value={bitForm.issueDate}
                onChange={e => setBitForm({ ...bitForm, issueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks &amp; Technical Notes
              </label>
              <textarea
                rows={2}
                value={bitForm.remarks}
                onChange={e => setBitForm({ ...bitForm, remarks: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                Delete Drill Bit {selectedBit?.bitNumber}?
              </p>
              <p className="text-rose-700 dark:text-rose-300 mt-1">
                Are you sure you want to remove this drill bit from the inventory? This will soft-delete the record and preserve historical report links.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteBit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
