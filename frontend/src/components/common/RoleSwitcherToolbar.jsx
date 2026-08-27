import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, UserCheck, MapPin } from 'lucide-react';

export const RoleSwitcherToolbar = () => {
  const { user, switchRole } = useAuth();

  return (
    <div className="bg-gradient-to-r from-cmpdi-navy via-slate-900 to-cmpdi-dark text-white px-4 py-1.5 text-xs font-medium border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-inner">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
          <ShieldAlert className="w-3.5 h-3.5" /> ROLE SIMULATOR
        </span>
        <span className="hidden md:inline text-slate-300">Evaluate application permissions:</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <button
          onClick={() => switchRole('admin')}
          className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1 ${
            user?.role === 'ROLE_ADMIN'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> System Admin (Active Account)
        </button>
      </div>
    </div>
  );
};
