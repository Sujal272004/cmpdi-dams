import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, PlusCircle, MapPin, Cpu, Activity, ChevronRight, Target } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const CampManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [camps, setCamps] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCamp, setNewCamp] = useState({ campCode: '', campName: '', location: '', latitude: '', longitude: '' });

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const [campsData, machinesData] = await Promise.all([
        apiService.getCamps(),
        apiService.getMachines()
      ]);
      setCamps(campsData || []);
      setMachines(machinesData || []);
    } catch (err) {
      console.error("Error fetching camps and machines:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await apiService.createCamp({
      ...newCamp,
      latitude: newCamp.latitude ? parseFloat(newCamp.latitude) : null,
      longitude: newCamp.longitude ? parseFloat(newCamp.longitude) : null
    });
    setShowAddModal(false);
    setNewCamp({ campCode: '', campName: '', location: '', latitude: '', longitude: '' });
    fetchCamps();
  };

  const handleManageMachines = (camp) => {
    // Navigate to Machine Management pre-filtered by this camp
    navigate(`/machines?campId=${camp.id}`);
  };

  const statusColors = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    STANDBY: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-cmpdi-navy to-slate-900 p-6 rounded-2xl shadow-md border border-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Exploration Drilling Camps</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage field camps — add machines and set drilling targets per camp
            </p>
          </div>
        </div>

        {user?.role === 'ROLE_ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Camp
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Camps</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{camps.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Camps</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {camps.filter(c => c.status === 'ACTIVE').length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-800">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Yearly Target</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {machines.reduce((sum, m) => sum + (parseFloat(m.yearlyTarget) || 0), 0).toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1">m</span>
            </p>
          </div>
        </div>
      </div>

      {/* Camp Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600 animate-pulse" />
            <p className="text-sm font-medium">Loading camps master data...</p>
          </div>
        ) : camps.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Camps Found</p>
            <p className="text-xs mt-1">Create the first exploration drilling camp to get started.</p>
          </div>
        ) : (
          camps.map((c) => {
            const campMachines = machines.filter(m => m.campId === c.id);
            const totalMachineTarget = campMachines.reduce((sum, m) => sum + (parseFloat(m.yearlyTarget) || 0), 0);
            const machineCount = campMachines.length;

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Camp Header */}
                <div className="bg-gradient-to-br from-cmpdi-navy to-slate-800 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono">
                      {c.campCode}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[c.status] || statusColors.ACTIVE}`}>
                      {c.status || 'ACTIVE'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mt-1">{c.campName}</h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                    {c.location || 'Location not specified'}
                  </p>
                </div>

                {/* Camp Details */}
                <div className="p-4 space-y-3">
                  {c.latitude && c.longitude && (
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      📍 GPS: {c.latitude}°N, {c.longitude}°E
                    </div>
                  )}

                  {/* Single Target Parameter: Yearly Target (sum of assigned machines) */}
                  <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60 text-center">
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                      Yearly Target
                    </p>
                    <p className="text-lg font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
                      {Math.round(totalMachineTarget).toLocaleString()} <span className="text-xs font-semibold text-slate-400">m</span>
                    </p>
                  </div>

                  {/* Manage Machines Button — the key action */}
                  <button
                    onClick={() => handleManageMachines(c)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-cmpdi-navy hover:bg-cmpdi-dark text-white font-bold rounded-xl text-xs transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span>Manage Machines ({machineCount})</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Camp Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Exploration Drilling Camp">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Camp Code <span className="text-rose-500">*</span></label>
            <input
              required
              type="text"
              placeholder="e.g. CMPDI-KOR-04"
              value={newCamp.campCode}
              onChange={(e) => setNewCamp({ ...newCamp, campCode: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 font-mono uppercase focus:ring-2 focus:ring-cmpdi-navy outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Camp Name <span className="text-rose-500">*</span></label>
            <input
              required
              type="text"
              placeholder="e.g. Korba Camp"
              value={newCamp.campName}
              onChange={(e) => setNewCamp({ ...newCamp, campName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 focus:ring-2 focus:ring-cmpdi-navy outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Location Details</label>
            <input
              type="text"
              placeholder="e.g. Korba District, Chhattisgarh"
              value={newCamp.location}
              onChange={(e) => setNewCamp({ ...newCamp, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 focus:ring-2 focus:ring-cmpdi-navy outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Latitude (°N)</label>
              <input
                type="number"
                step="0.000001"
                placeholder="e.g. 22.3595"
                value={newCamp.latitude}
                onChange={(e) => setNewCamp({ ...newCamp, latitude: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 focus:ring-2 focus:ring-cmpdi-navy outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Longitude (°E)</label>
              <input
                type="number"
                step="0.000001"
                placeholder="e.g. 82.7501"
                value={newCamp.longitude}
                onChange={(e) => setNewCamp({ ...newCamp, longitude: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 focus:ring-2 focus:ring-cmpdi-navy outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-cmpdi-navy hover:bg-cmpdi-dark text-white rounded-lg transition-colors shadow-sm"
            >
              Save Camp
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
