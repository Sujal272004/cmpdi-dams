import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { GisMap } from './pages/GisMap';
import { DailyReportEntry } from './pages/DailyReportEntry';
import { MyReports } from './pages/MyReports';
import { PendingReports } from './pages/PendingReports';
import { ReturnedReports } from './pages/ReturnedReports';
import { ApprovedReports } from './pages/ApprovedReports';
import { ReportDetails } from './pages/ReportDetails';
import { ReportHistory } from './pages/ReportHistory';
import { Analytics } from './pages/Analytics';
import { ExportCenter } from './pages/ExportCenter';
import { CampManagement } from './pages/CampManagement';
import { TargetManagement } from './pages/TargetManagement';
import { UserManagement } from './pages/UserManagement';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

const ProtectedLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gis-map" element={<GisMap />} />
            <Route path="/entry" element={<DailyReportEntry />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/pending" element={<PendingReports />} />
            <Route path="/returned" element={<ReturnedReports />} />
            <Route path="/approved" element={<ApprovedReports />} />
            <Route path="/reports/:id" element={<ReportDetails />} />
            <Route path="/history" element={<ReportHistory />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/export" element={<ExportCenter />} />
            <Route path="/camps" element={<CampManagement />} />
            <Route path="/targets" element={<TargetManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
