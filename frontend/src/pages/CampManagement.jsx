import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, PlusCircle, Edit3, Trash2, MapPin } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const CampManagement = () => {
  const { user } = useAuth();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCamp, setNewCamp] = useState({ campCode: '', campName: '', location: '', latitude: '', longitude: '' });

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    setLoading(true);
    const data = await apiService.getCamps();
    setCamps(data);
    setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Exploration Drilling Camps Master
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage field exploration camps and site codes</p>
        </div>

        {user?.role === 'ROLE_ADMIN' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cmpdi-navy text-white hover:bg-cmpdi-light transition flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" /> Create New Camp
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-slate-400">Loading camps master data...</div>
        ) : (
          camps.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-xs font-bold rounded bg-cmpdi-navy text-amber-400">{c.campCode}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {c.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.campName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> {c.location}
              </p>
              {c.latitude && c.longitude && (
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border text-[10px] font-mono text-slate-600 dark:text-slate-400">
                  📍 GPS: {c.latitude}°N, {c.longitude}°E
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Exploration Drilling Camp">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Camp Code *</label>
            <input
              required
              type="text"
              placeholder="e.g. CMPDI-KOR-04"
              value={newCamp.campCode}
              onChange={(e) => setNewCamp({ ...newCamp, campCode: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Camp Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Korba Camp"
              value={newCamp.campName}
              onChange={(e) => setNewCamp({ ...newCamp, campName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Location Details</label>
            <input
              type="text"
              placeholder="e.g. Korba District, Chhattisgarh"
              value={newCamp.location}
              onChange={(e) => setNewCamp({ ...newCamp, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Latitude (°N)</label>
              <input
                type="number"
                step="0.000001"
                placeholder="e.g. 22.3595"
                value={newCamp.latitude}
                onChange={(e) => setNewCamp({ ...newCamp, latitude: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Longitude (°E)</label>
              <input
                type="number"
                step="0.000001"
                placeholder="e.g. 82.7501"
                value={newCamp.longitude}
                onChange={(e) => setNewCamp({ ...newCamp, longitude: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 font-bold bg-cmpdi-navy text-white rounded-lg">Save Camp</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
