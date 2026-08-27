import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Users, UserPlus, KeyRound, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Reset Password State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetMsg, setResetMsg] = useState(null);
  const [resetError, setResetError] = useState(null);

  const [newUser, setNewUser] = useState({
    employeeId: '',
    name: '',
    designation: '',
    email: '',
    password: '',
    role: 'ROLE_CAMP_EXEC',
    campId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchCamps();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCamps = async () => {
    try {
      const data = await apiService.getCamps();
      if (Array.isArray(data) && data.length > 0) {
        setCamps(data);
        setNewUser(prev => ({ ...prev, campId: data[0].id.toString() }));
      }
    } catch (err) {
      console.error("Failed to load camps:", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!newUser.password || newUser.password.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createUser({
        ...newUser,
        campId: newUser.role === 'ROLE_CAMP_EXEC' && newUser.campId ? parseInt(newUser.campId) : null
      });

      setSuccessMsg(`User ${newUser.name} (${newUser.employeeId}) created successfully!`);
      setShowModal(false);
      setNewUser({
        employeeId: '',
        name: '',
        designation: '',
        email: '',
        password: '',
        role: 'ROLE_CAMP_EXEC',
        campId: camps.length > 0 ? camps[0].id.toString() : ''
      });
      fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to create user account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordVal || resetPasswordVal.trim().length < 6) {
      setResetError("New password must be at least 6 characters long.");
      return;
    }
    setSubmitting(true);
    setResetError(null);
    setResetMsg(null);

    try {
      await apiService.resetUserPassword(resetModalUser.id, resetPasswordVal);
      setResetMsg(`Password reset successfully for ${resetModalUser.name}`);
      setTimeout(() => {
        setResetModalUser(null);
        setResetPasswordVal('');
        setResetMsg(null);
      }, 1500);
    } catch (err) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400 flex items-center gap-2">
            <Users className="w-5 h-5" /> User & Role Management Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage employee accounts, assign drilling camps, and set security credentials</p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowModal(true);
          }}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-cmpdi-navy text-white hover:bg-cmpdi-light transition flex items-center gap-1.5 shadow-xs"
        >
          <UserPlus className="w-4 h-4 text-amber-400" /> Provision New User
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-700/60 uppercase font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Employee ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Camp</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">Loading user directory...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">No user accounts found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">{u.employeeId}</td>
                    <td className="p-3 font-semibold">{u.name}</td>
                    <td className="p-3">{u.designation || 'N/A'}</td>
                    <td className="p-3 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        u.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        u.role === 'ROLE_DEPT_EXEC' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                      }`}>
                        {u.role?.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="p-3">{u.campName || 'HQ / All Camps'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-[10px] font-bold">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setResetModalUser(u);
                          setResetPasswordVal('');
                          setResetError(null);
                          setResetMsg(null);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-cmpdi-navy hover:bg-slate-100 dark:text-sky-400 dark:hover:bg-slate-700 rounded-md transition flex items-center gap-1 ml-auto"
                        title="Reset User Password"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Reset Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Provision New User */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Provision New User Account">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Employee ID *</label>
              <input required type="text" placeholder="e.g. EMP006" value={newUser.employeeId} onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Full Name *</label>
              <input required type="text" placeholder="e.g. Vikram Singh" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Designation</label>
              <input type="text" placeholder="e.g. Senior Geologist" value={newUser.designation} onChange={(e) => setNewUser({...newUser, designation: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email Address *</label>
              <input required type="email" placeholder="user@cmpdi.co.in" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Account Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                required
                type="password"
                placeholder="Set initial account password (min 6 characters)"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">System Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700">
                <option value="ROLE_CAMP_EXEC">Camp Executive</option>
                <option value="ROLE_DEPT_EXEC">Department Executive (HQ)</option>
                <option value="ROLE_ADMIN">Administrator</option>
              </select>
            </div>

            {newUser.role === 'ROLE_CAMP_EXEC' && (
              <div>
                <label className="block font-semibold mb-1">Assigned Camp</label>
                <select value={newUser.campId} onChange={(e) => setNewUser({...newUser, campId: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700">
                  {camps.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.campName} ({c.campCode})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-1.5 font-bold bg-cmpdi-navy hover:bg-cmpdi-light text-white rounded-lg transition">
              {submitting ? 'Creating...' : 'Provision User Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset User Password */}
      {resetModalUser && (
        <Modal isOpen={!!resetModalUser} onClose={() => setResetModalUser(null)} title={`Reset Password for ${resetModalUser.name}`}>
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
            {resetError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> {resetError}
              </div>
            )}
            {resetMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {resetMsg}
              </div>
            )}

            <div>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Employee: <strong className="text-slate-800 dark:text-white">{resetModalUser.name} ({resetModalUser.employeeId})</strong>
              </p>
              <label className="block font-semibold mb-1">New Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  required
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setResetModalUser(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-1.5 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition">
                {submitting ? 'Updating...' : 'Set New Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
