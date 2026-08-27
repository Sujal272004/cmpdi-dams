import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-auto bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-3 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>© 2026 Central Mine Planning & Design Institute Limited (CMPDI) - A Mini Ratna Subsidiary of Coal India Limited.</p>
        <p className="font-semibold text-cmpdi-navy dark:text-sky-400">Drilling Activity Management System (DAMS)</p>
      </div>
    </footer>
  );
};
