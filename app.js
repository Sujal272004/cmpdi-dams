const { useState, useEffect, useRef } = React;

// ----------------------------------------------------
// PRESET USERS & DATA STORE
// ----------------------------------------------------
const PRESET_USERS = {
  admin: {
    id: 1, employeeId: 'EMP001', name: 'Rajesh Kumar Sharma', designation: 'Chief Mining Engineer / Admin',
    email: 'admin@cmpdi.co.in', role: 'ROLE_ADMIN', campId: null, campName: 'HQ System Administrator'
  }
};

const INITIAL_CAMPS = [
  { id: 1, campCode: 'CMPDI-AND-01', campName: 'Anandwan Camp', location: 'Chandrapur District, Maharashtra', latitude: 19.9615, longitude: 79.2961, status: 'ACTIVE' },
  { id: 2, campCode: 'CMPDI-MRP-02', campName: 'Murpar Camp', location: 'Nagpur District, Maharashtra', latitude: 20.8524, longitude: 78.9856, status: 'ACTIVE' },
  { id: 3, campCode: 'CMPDI-DGP-03', campName: 'Durgapur Camp', location: 'Paschim Bardhaman, West Bengal', latitude: 23.5204, longitude: 87.3119, status: 'ACTIVE' }
];

const INITIAL_REPORTS = [
  {
    reportId: 101, reportDate: '2026-07-28', campId: 1, campName: 'Anandwan Camp', machineNumber: 'RIG-AND-101',
    drillHole: 'DH-AND-04', shift: 'SHIFT_A', plannedDepth: 350.00, openingDepth: 120.00, closingDepth: 134.50,
    dailyProgress: 14.50, cumulativeDepth: 134.50, drillingStartTime: '06:00', drillingEndTime: '14:00',
    latitude: 19.9735, longitude: 79.3111,
    formation: 'Sandstone with minor Shale', coreRecovery: 92.5, waterLevel: 14.2,
    remarks: 'Normal drilling operation, good core recovery.', reportStatus: 'APPROVED',
    createdBy: 'Amitabh Verma', approvedBy: 'Dr. Sunita Deshmukh', approvedDate: '2026-07-28T16:30:00',
    version: 1, correctionHistory: []
  },
  {
    reportId: 102, reportDate: '2026-07-29', campId: 1, campName: 'Anandwan Camp', machineNumber: 'RIG-AND-101',
    drillHole: 'DH-AND-04', shift: 'SHIFT_B', plannedDepth: 350.00, openingDepth: 134.50, closingDepth: 148.00,
    dailyProgress: 13.50, cumulativeDepth: 148.00, drillingStartTime: '14:00', drillingEndTime: '22:00',
    latitude: 19.9735, longitude: 79.3111,
    formation: 'Barakar Formation Coal Seam', coreRecovery: 95.0, waterLevel: 13.8,
    remarks: 'Coal seam encountered at 141.2m depth.', reportStatus: 'SUBMITTED',
    createdBy: 'Amitabh Verma', version: 0, correctionHistory: []
  },
  {
    reportId: 103, reportDate: '2026-07-30', campId: 1, campName: 'Anandwan Camp', machineNumber: 'RIG-AND-102',
    drillHole: 'DH-AND-05', shift: 'SHIFT_A', plannedDepth: 400.00, openingDepth: 45.00, closingDepth: 58.20,
    dailyProgress: 13.20, cumulativeDepth: 58.20, drillingStartTime: '06:00', drillingEndTime: '14:00',
    latitude: 19.9535, longitude: 79.2841,
    formation: 'Coarse Sandstone', coreRecovery: 88.0, waterLevel: 18.5,
    remarks: 'Bits changed during mid shift.', reportStatus: 'DRAFT',
    createdBy: 'Amitabh Verma', version: 0, correctionHistory: []
  },
  {
    reportId: 104, reportDate: '2026-07-29', campId: 2, campName: 'Murpar Camp', machineNumber: 'RIG-MRP-201',
    drillHole: 'DH-MRP-12', shift: 'SHIFT_A', plannedDepth: 500.00, openingDepth: 210.00, closingDepth: 222.00,
    dailyProgress: 12.00, cumulativeDepth: 222.00, drillingStartTime: '06:00', drillingEndTime: '14:00',
    latitude: 20.8444, longitude: 78.9736,
    formation: 'Shale & Mudstone', coreRecovery: 85.0, waterLevel: 22.0,
    remarks: 'Water loss observed at 218m.', reportStatus: 'RETURNED',
    createdBy: 'Ramesh Patel', version: 1,
    correctionHistory: [
      { id: 1, reportId: 104, remarks: 'Please re-verify core recovery percentage and water loss depth readings for shift A.', createdBy: 'Dr. Sunita Deshmukh', createdAt: '2026-07-29T18:00:00' }
    ]
  },
  {
    reportId: 105, reportDate: '2026-07-27', campId: 3, campName: 'Durgapur Camp', machineNumber: 'RIG-DGP-301',
    drillHole: 'DH-DGP-08', shift: 'SHIFT_C', plannedDepth: 300.00, openingDepth: 180.00, closingDepth: 195.80,
    dailyProgress: 15.80, cumulativeDepth: 195.80, drillingStartTime: '22:00', drillingEndTime: '06:00',
    formation: 'Raniganj Coal Formation', coreRecovery: 94.2, waterLevel: 11.5,
    remarks: 'Smooth progress, coal core retrieved intact.', reportStatus: 'APPROVED',
    createdBy: 'Subhashish Roy', approvedBy: 'Dr. Sunita Deshmukh', approvedDate: '2026-07-27T11:00:00',
    version: 0, correctionHistory: []
  }
];

const INITIAL_AUDIT_LOGS = [
  { id: 1, entityName: 'DailyDrillingReport', entityId: '101', action: 'APPROVE', oldValue: 'Status: SUBMITTED', newValue: 'Status: APPROVED', changedBy: 'Dr. Sunita Deshmukh', ipAddress: '192.168.1.45', timestamp: '2026-07-28T16:30:00' },
  { id: 2, entityName: 'DailyDrillingReport', entityId: '104', action: 'RETURN', oldValue: 'Status: SUBMITTED', newValue: 'Status: RETURNED (Remark: Please re-verify core recovery...)', changedBy: 'Dr. Sunita Deshmukh', ipAddress: '192.168.1.45', timestamp: '2026-07-29T18:00:00' },
  { id: 3, entityName: 'DailyDrillingReport', entityId: '102', action: 'SUBMIT', oldValue: 'Status: DRAFT', newValue: 'Status: SUBMITTED', changedBy: 'Amitabh Verma', ipAddress: '192.168.2.11', timestamp: '2026-07-29T22:15:00' }
];

// ----------------------------------------------------
// MAIN APP COMPONENT
// ----------------------------------------------------
function App() {
  const [currentUser, setCurrentUser] = useState(PRESET_USERS.admin);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Mutable State Store
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [camps, setCamps] = useState(INITIAL_CAMPS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Dark Mode Toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Helper for adding Audit Log
  const logAudit = (entityName, entityId, action, oldValue, newValue) => {
    const newLog = {
      id: auditLogs.length + 1,
      entityName,
      entityId: entityId.toString(),
      action,
      oldValue: oldValue || '-',
      newValue,
      changedBy: currentUser.name,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // ----------------------------------------------------
  // RENDER APP STRUCTURE
  // ----------------------------------------------------
  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">

      {/* 1. ROLE SIMULATOR TOPBAR */}
      <div className="bg-gradient-to-r from-cmpdi-navy via-slate-900 to-cmpdi-dark text-white px-4 py-1.5 text-xs font-medium border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            🛡️ ROLE SIMULATOR
          </span>
          <span className="hidden md:inline text-slate-300">Click to switch operational role view:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setCurrentUser(PRESET_USERS.admin)}
            className={`px-2.5 py-1 rounded text-xs transition ${currentUser.role === 'ROLE_ADMIN' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
          >
            ⚙️ System Administrator
          </button>
        </div>
      </div>

      {/* 2. NAVBAR */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden">
              ☰
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cmpdi-navy text-amber-400 flex items-center justify-center font-bold text-xl shadow-xs border border-amber-400/30">
                ⛏
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cmpdi-navy dark:text-sky-400 tracking-tight text-base">CMPDI</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-600">
                    Exploration Dept.
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Drilling Activity Management System (DAMS)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser.campName && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                📍 {currentUser.campName}
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-cmpdi-navy text-white flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser.designation}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. SIDEBAR & MAIN BODY */}
      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR NAVIGATION */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 border-b border-slate-800 lg:hidden flex justify-between">
            <span className="font-bold text-white">Navigation</span>
            <button onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Operational Modules</p>
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                  { id: 'entry', label: 'Daily Report Entry', icon: '📝' },
                  { id: 'my-reports', label: 'My Camp Reports', icon: '📄' },
                  { id: 'pending', label: 'Pending Approvals Queue', icon: '⏳' },
                  { id: 'returned', label: 'Returned Corrections', icon: '🔄' },
                  { id: 'approved', label: 'Approved Records', icon: '✅' },
                  { id: 'history', label: 'Search & History', icon: '📜' },
                  { id: 'analytics', label: 'Analytics & Trends', icon: '📈' },
                  { id: 'export', label: 'Official Export Center', icon: '📥' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSelectedReportId(null); setSidebarOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === item.id ? 'bg-cmpdi-navy text-white border-l-4 border-l-amber-400 shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Administration & Audit</p>
              <nav className="space-y-1">
                {[
                  { id: 'camps', label: 'Camp Management', icon: '🏢' },
                  { id: 'users', label: 'User Directory', icon: '👥' },
                  { id: 'audit-logs', label: 'System Audit Logs', icon: '🛡️' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSelectedReportId(null); setSidebarOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${activeTab === item.id ? 'bg-cmpdi-navy text-white border-l-4 border-l-amber-400 shadow-xs' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-200">CMPDI Ranchi HQ</p>
            <p>Exploration Division v1.0</p>
          </div>
        </aside>

        {/* PAGE CONTENT SWITCHER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardView reports={reports} camps={camps} setActiveTab={setActiveTab} setSelectedReportId={setSelectedReportId} />}
          {activeTab === 'entry' && <DailyReportEntryView currentUser={currentUser} camps={camps} reports={reports} setReports={setReports} logAudit={logAudit} setActiveTab={setActiveTab} />}
          {activeTab === 'my-reports' && <ReportsTableView title="My Camp Drilling Reports" reports={reports} currentUser={currentUser} setSelectedReportId={setSelectedReportId} setActiveTab={setActiveTab} />}
          {activeTab === 'pending' && <PendingApprovalsView reports={reports} setReports={setReports} currentUser={currentUser} logAudit={logAudit} setSelectedReportId={setSelectedReportId} setActiveTab={setActiveTab} />}
          {activeTab === 'returned' && <ReturnedReportsView reports={reports} setSelectedReportId={setSelectedReportId} setActiveTab={setActiveTab} />}
          {activeTab === 'approved' && <ApprovedReportsView reports={reports} setSelectedReportId={setSelectedReportId} setActiveTab={setActiveTab} />}
          {activeTab === 'report-details' && <ReportDetailsView reportId={selectedReportId} reports={reports} setReports={setReports} currentUser={currentUser} logAudit={logAudit} setActiveTab={setActiveTab} />}
          {activeTab === 'history' && <SearchHistoryView reports={reports} camps={camps} setSelectedReportId={setSelectedReportId} setActiveTab={setActiveTab} />}
          {activeTab === 'analytics' && <AnalyticsView reports={reports} camps={camps} />}
          {activeTab === 'export' && <ExportCenterView reports={reports} camps={camps} />}
          {activeTab === 'camps' && <CampManagementView camps={camps} setCamps={setCamps} logAudit={logAudit} />}
          {activeTab === 'users' && <UserManagementView camps={camps} />}
          {activeTab === 'audit-logs' && <AuditLogsView auditLogs={auditLogs} />}
        </main>
      </div>

      {/* 4. FOOTER */}
      <footer className="mt-auto bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-2.5 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <p>© 2026 Central Mine Planning & Design Institute Limited (CMPDI) - Subsidiary of Coal India Limited.</p>
          <p className="font-semibold text-cmpdi-navy dark:text-sky-400">Drilling Activity Management System (DAMS)</p>
        </div>
      </footer>
    </div>
  );
}

// ----------------------------------------------------
// HELPER STATUS BADGE
// ----------------------------------------------------
function StatusChip({ status }) {
  switch (status) {
    case 'APPROVED':
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">✅ Approved</span>;
    case 'SUBMITTED':
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">⏳ Pending Review</span>;
    case 'RETURNED':
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">🔄 Returned for Correction</span>;
    default:
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">📝 Draft</span>;
  }
}

// ----------------------------------------------------
// 1. DASHBOARD VIEW
// ----------------------------------------------------
function DashboardView({ reports, camps, setActiveTab, setSelectedReportId }) {
  const chartRef = useRef(null);

  const totalDrilled = reports.filter(r => r.reportStatus === 'APPROVED').reduce((sum, r) => sum + r.dailyProgress, 0) + 1540.5;
  const pendingCount = reports.filter(r => r.reportStatus === 'SUBMITTED').length;
  const approvedCount = reports.filter(r => r.reportStatus === 'APPROVED').length;
  const returnedCount = reports.filter(r => r.reportStatus === 'RETURNED').length;

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (window.myDashboardChart) window.myDashboardChart.destroy();

      window.myDashboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Anandwan Camp', 'Murpar Camp', 'Durgapur Camp'],
          datasets: [{
            label: 'Total Meters Drilled',
            data: [620.5, 480.0, 440.0],
            backgroundColor: ['#003366', '#0284C7', '#D4AF37'],
            borderRadius: 6
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }, [reports]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Exploration Operations Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time daily drilling progress monitoring across CMPDI camps</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border-l-4 border-l-blue-600 shadow-xs border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 uppercase">Active Camps</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{camps.length}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Anandwan, Murpar, Durgapur</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border-l-4 border-l-amber-500 shadow-xs border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 uppercase">Pending Review</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pendingCount}</h3>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Awaiting HQ Approval</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border-l-4 border-l-emerald-600 shadow-xs border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 uppercase">Approved Records</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{approvedCount}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Verified & Locked</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border-l-4 border-l-cyan-600 shadow-xs border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Meter Drilled</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalDrilled.toFixed(2)} m</h3>
          <p className="text-[11px] text-slate-500 mt-1">Cumulative depth</p>
        </div>
      </div>

      {/* Chart & Returned Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Camp Progress Comparison</h3>
          <div className="h-64">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-rose-600 mb-3 flex items-center gap-1">⚠️ Action Items & Returned Reports</h3>
          <div className="space-y-3">
            {reports.filter(r => r.reportStatus === 'RETURNED').map(r => (
              <div key={r.reportId} className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Report #{r.reportId} - {r.campName}</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1">"Remark: {r.correctionHistory[0]?.remarks}"</p>
                <button
                  onClick={() => { setSelectedReportId(r.reportId); setActiveTab('report-details'); }}
                  className="mt-2 px-2.5 py-1 bg-rose-600 text-white rounded font-bold text-[11px]"
                >
                  Edit & Resubmit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. DAILY REPORT ENTRY VIEW (WITH AUTO-CALCULATION)
// ----------------------------------------------------
function DailyReportEntryView({ currentUser, camps, reports, setReports, logAudit, setActiveTab }) {
  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    campId: currentUser.campId || 1,
    machineNumber: 'RIG-AND-101',
    drillHole: 'DH-AND-04',
    shift: 'SHIFT_A',
    plannedDepth: '350.00',
    openingDepth: '148.00',
    closingDepth: '162.50',
    formation: 'Barakar Formation Coal Seam & Sandstone',
    coreRecovery: '94.5',
    waterLevel: '15.0',
    remarks: 'Normal drilling operations during shift.'
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const opening = parseFloat(formData.openingDepth) || 0;
  const closing = parseFloat(formData.closingDepth) || 0;
  const dailyProgress = Math.max(0, closing - opening).toFixed(2);

  const handleSubmit = (e, status = 'DRAFT') => {
    e.preventDefault();
    if (closing < opening) {
      setError("Closing depth cannot be less than opening depth.");
      return;
    }

    const camp = camps.find(c => c.id === parseInt(formData.campId)) || camps[0];
    const newReport = {
      reportId: Math.floor(1000 + Math.random() * 9000),
      reportDate: formData.reportDate,
      campId: camp.id,
      campName: camp.campName,
      machineNumber: formData.machineNumber,
      drillHole: formData.drillHole,
      shift: formData.shift,
      plannedDepth: parseFloat(formData.plannedDepth),
      openingDepth: opening,
      closingDepth: closing,
      dailyProgress: parseFloat(dailyProgress),
      cumulativeDepth: closing,
      formation: formData.formation,
      coreRecovery: parseFloat(formData.coreRecovery),
      waterLevel: parseFloat(formData.waterLevel),
      remarks: formData.remarks,
      reportStatus: status,
      createdBy: currentUser.name,
      correctionHistory: []
    };

    setReports([newReport, ...reports]);
    logAudit('DailyDrillingReport', newReport.reportId, 'CREATE', null, `Created report with status ${status}`);
    setSuccess(`Daily report ${status === 'SUBMITTED' ? 'submitted to HQ' : 'saved as draft'} successfully!`);
    setTimeout(() => setActiveTab('my-reports'), 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Daily Drilling Progress Entry Form</h1>
        <p className="text-xs text-slate-500">Record daily shift progress for CMPDI exploration department</p>
      </div>

      {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">{error}</div>}
      {success && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">{success}</div>}

      <form className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase text-cmpdi-navy dark:text-sky-400 pb-2 border-b mb-4">1. Identification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Date</label>
              <input type="date" value={formData.reportDate} onChange={e => setFormData({ ...formData, reportDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Camp</label>
              <select value={formData.campId} onChange={e => setFormData({ ...formData, campId: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900">
                {camps.map(c => <option key={c.id} value={c.id}>{c.campName}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Machine No.</label>
              <input type="text" value={formData.machineNumber} onChange={e => setFormData({ ...formData, machineNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Drill Hole ID</label>
              <input type="text" value={formData.drillHole} onChange={e => setFormData({ ...formData, drillHole: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase text-cmpdi-navy dark:text-sky-400 pb-2 border-b mb-4">2. Depths & Auto Calculated Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Shift</label>
              <select value={formData.shift} onChange={e => setFormData({ ...formData, shift: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900">
                <option value="SHIFT_A">Shift A (06:00 - 14:00)</option>
                <option value="SHIFT_B">Shift B (14:00 - 22:00)</option>
                <option value="SHIFT_C">Shift C (22:00 - 06:00)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Opening Depth (m)</label>
              <input type="number" step="0.01" value={formData.openingDepth} onChange={e => setFormData({ ...formData, openingDepth: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Closing Depth (m)</label>
              <input type="number" step="0.01" value={formData.closingDepth} onChange={e => setFormData({ ...formData, closingDepth: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-900" />
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200">
              <span className="text-[10px] font-bold text-blue-900 uppercase">Calculated Daily Progress</span>
              <p className="text-lg font-black text-blue-900 dark:text-sky-300">{dailyProgress} meters</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={e => handleSubmit(e, 'DRAFT')} className="px-4 py-2 text-xs font-semibold rounded-lg border">Save Draft</button>
          <button type="button" onClick={e => handleSubmit(e, 'SUBMITTED')} className="px-5 py-2 text-xs font-bold rounded-lg bg-cmpdi-navy text-white">Submit Report to HQ</button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------
// 3. REPORTS TABLE VIEW
// ----------------------------------------------------
function ReportsTableView({ title, reports, setSelectedReportId, setActiveTab }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">{title}</h1>
        <p className="text-xs text-slate-500">View and manage drilling progress logs</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-700/60 uppercase font-bold text-slate-600 dark:text-slate-300 border-b">
              <tr>
                <th className="p-3">Report ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Camp</th>
                <th className="p-3">Machine</th>
                <th className="p-3">Drill Hole</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {reports.map(r => (
                <tr key={r.reportId} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">#{r.reportId}</td>
                  <td className="p-3 whitespace-nowrap">{r.reportDate}</td>
                  <td className="p-3 font-semibold">{r.campName}</td>
                  <td className="p-3">{r.machineNumber}</td>
                  <td className="p-3 font-bold">{r.drillHole}</td>
                  <td className="p-3 font-bold text-blue-700 dark:text-sky-300">{r.dailyProgress} m</td>
                  <td className="p-3"><StatusChip status={r.reportStatus} /></td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => { setSelectedReportId(r.reportId); setActiveTab('report-details'); }}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. PENDING APPROVALS QUEUE VIEW
// ----------------------------------------------------
function PendingApprovalsView({ reports, setReports, currentUser, logAudit, setSelectedReportId, setActiveTab }) {
  const [remarkModalId, setRemarkModalId] = useState(null);
  const [remarksText, setRemarksText] = useState('');

  const pendingList = reports.filter(r => r.reportStatus === 'SUBMITTED');

  const handleApprove = (id) => {
    setReports(prev => prev.map(r => r.reportId === id ? { ...r, reportStatus: 'APPROVED', approvedBy: currentUser.name, approvedDate: new Date().toISOString() } : r));
    logAudit('DailyDrillingReport', id, 'APPROVE', 'Status: SUBMITTED', 'Status: APPROVED');
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    setReports(prev => prev.map(r => r.reportId === remarkModalId ? {
      ...r, reportStatus: 'RETURNED',
      correctionHistory: [{ id: Date.now(), remarks: remarksText, createdBy: currentUser.name, createdAt: new Date().toISOString() }, ...r.correctionHistory]
    } : r));
    logAudit('DailyDrillingReport', remarkModalId, 'RETURN', 'Status: SUBMITTED', `Status: RETURNED (${remarksText})`);
    setRemarkModalId(null);
    setRemarksText('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Department HQ Pending Approvals Queue</h1>
          <p className="text-xs text-slate-500">Review, approve, or return submitted daily reports</p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">{pendingList.length} Pending Review</span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-700 font-bold border-b">
            <tr>
              <th className="p-3">Report ID</th>
              <th className="p-3">Camp</th>
              <th className="p-3">Machine & Hole</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Submitted By</th>
              <th className="p-3 text-right">Approval Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pendingList.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">No pending reports for review!</td></tr>
            ) : (
              pendingList.map(r => (
                <tr key={r.reportId}>
                  <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">#{r.reportId}</td>
                  <td className="p-3 font-semibold">{r.campName}</td>
                  <td className="p-3">{r.machineNumber} ({r.drillHole})</td>
                  <td className="p-3 font-bold text-blue-600">{r.dailyProgress} m</td>
                  <td className="p-3">{r.createdBy}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => { setSelectedReportId(r.reportId); setActiveTab('report-details'); }} className="px-2.5 py-1 bg-slate-100 rounded">Inspect</button>
                    <button onClick={() => handleApprove(r.reportId)} className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold">Approve</button>
                    <button onClick={() => setRemarkModalId(r.reportId)} className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold">Return</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Return Correction Remarks Modal */}
      {remarkModalId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-rose-600">Return Report #{remarkModalId} for Correction</h3>
            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <textarea required rows="4" value={remarksText} onChange={e => setRemarksText(e.target.value)} placeholder="Enter mandatory correction remarks..." className="w-full p-3 border rounded dark:bg-slate-900" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRemarkModalId(null)} className="px-3 py-1.5 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded">Confirm Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 5. RETURNED REPORTS VIEW
// ----------------------------------------------------
function ReturnedReportsView({ reports, setSelectedReportId, setActiveTab }) {
  const returnedList = reports.filter(r => r.reportStatus === 'RETURNED');
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
        <h1 className="text-xl font-bold text-rose-600">Returned Reports for Field Correction</h1>
        <p className="text-xs text-slate-500">Reports sent back by HQ requiring re-verification</p>
      </div>

      <div className="space-y-4">
        {returnedList.map(r => (
          <div key={r.reportId} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-rose-200 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-bold text-sm">Report #{r.reportId} - {r.campName} ({r.drillHole})</span>
              <button onClick={() => { setSelectedReportId(r.reportId); setActiveTab('report-details'); }} className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded">Edit & Resubmit</button>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 text-xs">
              <p className="font-bold text-rose-900 dark:text-rose-300">HQ Remark: "{r.correctionHistory[0]?.remarks}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 6. APPROVED REPORTS VIEW
// ----------------------------------------------------
function ApprovedReportsView({ reports, setSelectedReportId, setActiveTab }) {
  const approvedList = reports.filter(r => r.reportStatus === 'APPROVED');
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
        <h1 className="text-xl font-bold text-emerald-600">Approved & Permanently Locked Records</h1>
        <p className="text-xs text-slate-500">Archived official records</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-700 font-bold border-b">
            <tr>
              <th className="p-3">Report ID</th>
              <th className="p-3">Date</th>
              <th className="p-3">Camp</th>
              <th className="p-3">Machine & Hole</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Approved By</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {approvedList.map(r => (
              <tr key={r.reportId}>
                <td className="p-3 font-bold text-cmpdi-navy dark:text-sky-400">#{r.reportId}</td>
                <td className="p-3">{r.reportDate}</td>
                <td className="p-3 font-semibold">{r.campName}</td>
                <td className="p-3">{r.machineNumber} ({r.drillHole})</td>
                <td className="p-3 font-bold text-emerald-600">{r.dailyProgress} m</td>
                <td className="p-3">{r.approvedBy}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setSelectedReportId(r.reportId); setActiveTab('report-details'); }} className="px-2.5 py-1 bg-slate-100 rounded">Inspect</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 7. REPORT DETAILS VIEW (IMMUTABLE LOCK + EDIT MODES)
// ----------------------------------------------------
function ReportDetailsView({ reportId, reports, setReports, currentUser, logAudit, setActiveTab }) {
  const report = reports.find(r => r.reportId === reportId) || reports[0];
  const [isEditing, setIsEditing] = useState(false);
  const [editClosing, setEditClosing] = useState(report.closingDepth);

  const isApproved = report.reportStatus === 'APPROVED';

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const newClosing = parseFloat(editClosing);
    const newProgress = Math.max(0, newClosing - report.openingDepth);

    setReports(prev => prev.map(r => r.reportId === report.reportId ? {
      ...r, closingDepth: newClosing, dailyProgress: newProgress, reportStatus: r.reportStatus === 'RETURNED' ? 'SUBMITTED' : r.reportStatus
    } : r));

    logAudit('DailyDrillingReport', report.reportId, 'UPDATE', `Closing: ${report.closingDepth}`, `Closing: ${newClosing}`);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Report Details #{report.reportId}</h1>
          <p className="text-xs text-slate-500">{report.campName} • Date: {report.reportDate}</p>
        </div>
        <StatusChip status={report.reportStatus} />
      </div>

      {isApproved && (
        <div className="p-4 bg-slate-900 text-amber-400 text-xs font-bold rounded-xl border border-amber-400/30">
          🔒 PERMANENTLY LOCKED: Approved by {report.approvedBy}. Data is immutable.
        </div>
      )}

      {!isEditing ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border space-y-6 text-xs">
          <div className="grid grid-cols-4 gap-4">
            <div><span className="text-slate-500">Opening Depth:</span><p className="font-bold">{report.openingDepth} m</p></div>
            <div><span className="text-slate-500">Closing Depth:</span><p className="font-bold">{report.closingDepth} m</p></div>
            <div><span className="text-slate-500">Daily Progress:</span><p className="font-extrabold text-blue-600 text-sm">{report.dailyProgress} m</p></div>
            <div><span className="text-slate-500">Core Recovery:</span><p className="font-bold">{report.coreRecovery}%</p></div>
          </div>

          <div>
            <span className="text-slate-500">Lithology / Formation:</span>
            <p className="font-bold text-sm mt-1">{report.formation}</p>
          </div>

          {report.correctionHistory.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200">
              <h4 className="font-bold text-rose-700 mb-2">Correction Remarks History</h4>
              {report.correctionHistory.map(c => (
                <p key={c.id} className="text-slate-700 dark:text-slate-300">"{c.remarks}" - by {c.createdBy}</p>
              ))}
            </div>
          )}

          {!isApproved && (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-amber-500 font-bold rounded text-slate-950">Edit Fields</button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSaveEdit} className="bg-white dark:bg-slate-800 p-6 rounded-xl border space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Closing Depth (m)</label>
            <input type="number" step="0.01" value={editClosing} onChange={e => setEditClosing(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-900" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-cmpdi-navy text-white font-bold rounded">Save & Resubmit</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 8. SEARCH & HISTORY VIEW
// ----------------------------------------------------
function SearchHistoryView({ reports, camps, setSelectedReportId, setActiveTab }) {
  const [filterCamp, setFilterCamp] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = reports.filter(r => {
    if (filterCamp && r.campId !== parseInt(filterCamp)) return false;
    if (filterStatus && r.reportStatus !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Historical Activity Search</h1>
        <p className="text-xs text-slate-500">Multi-faceted search across archived drilling records</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs bg-white dark:bg-slate-800 p-4 rounded-xl border">
        <div>
          <label className="block font-semibold mb-1">Filter Camp</label>
          <select value={filterCamp} onChange={e => setFilterCamp(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-900">
            <option value="">All Camps</option>
            {camps.map(c => <option key={c.id} value={c.id}>{c.campName}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Filter Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-900">
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      <ReportsTableView title="Matching Historical Records" reports={filtered} setSelectedReportId={setSelectedReportId} setActiveTab={setActiveTab} />
    </div>
  );
}

// ----------------------------------------------------
// 9. ANALYTICS & TRENDS VIEW
// ----------------------------------------------------
function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Analytics & Exploration Trends</h1>
        <p className="text-xs text-slate-500">Core recovery efficiency and machine performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
          <h3 className="font-bold text-xs mb-2">Core Recovery Ratio</h3>
          <p className="text-2xl font-black text-emerald-600">93.8%</p>
          <p className="text-xs text-slate-500 mt-1">Average core recovery across all camps</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
          <h3 className="font-bold text-xs mb-2">Rig Efficiency</h3>
          <p className="text-2xl font-black text-blue-600">14.2 m/shift</p>
          <p className="text-xs text-slate-500 mt-1">Mean daily drilling speed</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 10. EXPORT CENTER VIEW
// ----------------------------------------------------
function ExportCenterView() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Official Report Export Center</h1>
        <p className="text-xs text-slate-500">Export formatted Excel and PDF documents</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => alert("Downloading Excel Report...")} className="p-6 bg-emerald-600 text-white font-bold rounded-xl text-center shadow-xs">
          📊 Export Excel Spreadsheet (.xlsx)
        </button>
        <button onClick={() => alert("Downloading PDF Report...")} className="p-6 bg-rose-600 text-white font-bold rounded-xl text-center shadow-xs">
          📄 Export Official PDF (.pdf)
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 11. CAMP MANAGEMENT VIEW (ADMIN)
// ----------------------------------------------------
function CampManagementView({ camps, setCamps, logAudit }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loc, setLoc] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const newCamp = { id: camps.length + 1, campCode: code, campName: name, location: loc, status: 'ACTIVE' };
    setCamps([...camps, newCamp]);
    logAudit('Camp', newCamp.id, 'CREATE', null, `Created camp ${name}`);
    setCode(''); setName(''); setLoc('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">Camp Master Management</h1>
        <p className="text-xs text-slate-500">Add and configure exploration camps</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 p-4 rounded-xl border grid grid-cols-3 gap-3 text-xs">
        <input required placeholder="Camp Code" value={code} onChange={e => setCode(e.target.value)} className="p-2 border rounded" />
        <input required placeholder="Camp Name" value={name} onChange={e => setName(e.target.value)} className="p-2 border rounded" />
        <input placeholder="Location" value={loc} onChange={e => setLoc(e.target.value)} className="p-2 border rounded" />
        <button type="submit" className="col-span-3 py-2 bg-cmpdi-navy text-white font-bold rounded">Add Drilling Camp</button>
      </form>

      <div className="grid grid-cols-3 gap-4">
        {camps.map(c => (
          <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border space-y-2">
            <span className="px-2 py-0.5 bg-cmpdi-navy text-amber-400 text-xs font-bold rounded">{c.campCode}</span>
            <h3 className="font-bold">{c.campName}</h3>
            <p className="text-xs text-slate-500">{c.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 12. USER MANAGEMENT VIEW (ADMIN)
// ----------------------------------------------------
function UserManagementView() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">User Directory</h1>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border p-4 text-xs">
        <p className="font-bold">Registered Users:</p>
        <ul className="mt-2 space-y-2">
          <li>• Dr. Sunita Deshmukh - General Manager (ROLE_DEPT_EXEC)</li>
          <li>• Amitabh Verma - Senior Drilling Engineer (ROLE_CAMP_EXEC - Anandwan)</li>
          <li>• Ramesh Patel - Camp In-Charge (ROLE_CAMP_EXEC - Murpar)</li>
          <li>• Rajesh Kumar Sharma - Chief Mining Engineer (ROLE_ADMIN)</li>
        </ul>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 13. AUDIT LOGS VIEW (SYSTEM AUDIT TRAIL)
// ----------------------------------------------------
function AuditLogsView({ auditLogs }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border">
        <h1 className="text-xl font-bold text-cmpdi-navy dark:text-sky-400">System Audit Trail</h1>
        <p className="text-xs text-slate-500">Immutable record of modifications</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 dark:bg-slate-700 font-bold border-b">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Action</th>
              <th className="p-3">Details</th>
              <th className="p-3">Changed By</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td className="p-3">#{log.id}</td>
                <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3">{log.entityName} (#{log.entityId})</td>
                <td className="p-3 font-bold">{log.action}</td>
                <td className="p-3">{log.newValue}</td>
                <td className="p-3 font-bold">{log.changedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Render React App to Root
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
