import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Clock,
  RotateCcw,
  CheckCircle2,
  History,
  BarChart3,
  Download,
  Building2,
  Users,
  ShieldCheck,
  Target,
  Bell,
  User,
  Compass,
  KeyRound,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isDeptExec = user?.role === 'ROLE_DEPT_EXEC';
  const isCampExec = user?.role === 'ROLE_CAMP_EXEC';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC', 'ROLE_CAMP_EXEC'] },
    { label: 'GIS Exploration Map', path: '/gis-map', icon: Compass, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC', 'ROLE_CAMP_EXEC'] },
    { label: 'Daily Report Entry', path: '/entry', icon: FilePlus2, roles: ['ROLE_CAMP_EXEC', 'ROLE_ADMIN'] },
    { label: 'My Camp Reports', path: '/my-reports', icon: FileText, roles: ['ROLE_CAMP_EXEC'] },
    { label: 'Pending Approvals', path: '/pending', icon: Clock, roles: ['ROLE_DEPT_EXEC', 'ROLE_ADMIN'] },
    { label: 'Returned Reports', path: '/returned', icon: RotateCcw, roles: ['ROLE_CAMP_EXEC', 'ROLE_DEPT_EXEC', 'ROLE_ADMIN'] },
    { label: 'Approved Reports', path: '/approved', icon: CheckCircle2, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC', 'ROLE_CAMP_EXEC'] },
    { label: 'Search & History', path: '/history', icon: History, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC', 'ROLE_CAMP_EXEC'] },
    { label: 'Analytics & Trends', path: '/analytics', icon: BarChart3, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC', 'ROLE_CAMP_EXEC'] },
    { label: 'Export Center', path: '/export', icon: Download, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC', 'ROLE_CAMP_EXEC'] },
    { label: 'User Settings', path: '/settings', icon: KeyRound, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC', 'ROLE_CAMP_EXEC'] },
  ];

  const adminItems = [
    { label: 'Target Management', path: '/targets', icon: Target, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC', 'ROLE_CAMP_EXEC'] },
    { label: 'Camp Management', path: '/camps', icon: Building2, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC'] },
    { label: 'User Management', path: '/users', icon: Users, roles: ['ROLE_ADMIN'] },
    { label: 'System Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['ROLE_ADMIN', 'ROLE_DEPT_EXEC'] },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-white text-sm">Navigation Menu</span>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Operational Modules</p>
            <nav className="space-y-1">
              {navItems
                .filter(item => item.roles.includes(user?.role))
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-cmpdi-navy text-white shadow-xs border-l-4 border-l-amber-400'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-amber-400" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
            </nav>
          </div>

          {/* Master & Administration */}
          {(isAdmin || isDeptExec) && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Administration & Audit</p>
              <nav className="space-y-1">
                {adminItems
                  .filter(item => item.roles.includes(user?.role))
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-cmpdi-navy text-white shadow-xs border-l-4 border-l-amber-400'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 text-sky-400" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
              </nav>
            </div>
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-200">CMPDI Ranchi HQ</p>
          <p>Exploration Division v1.0</p>
        </div>
      </aside>
    </>
  );
};
