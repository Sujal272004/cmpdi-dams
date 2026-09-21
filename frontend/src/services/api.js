import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080/api';
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout to handle Render Free Tier container cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dams_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Session expired or unauthorized. Clearing stored auth.");
      localStorage.removeItem('dams_token');
      localStorage.removeItem('dams_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Auto-retry once or twice on cold-start timeout / gateway errors while Render wakes up
    if (config && (!config._retryCount || config._retryCount < 2)) {
      config._retryCount = (config._retryCount || 0) + 1;
      if (error.code === 'ECONNABORTED' || !error.response || error.response.status >= 500) {
        console.warn(`Render cloud backend waking up... Auto-retrying request (${config._retryCount}/2)`);
        await new Promise(resolve => setTimeout(resolve, 2500));
        return apiClient(config);
      }
    }

    return Promise.reject(error);
  }
);

// Helpers for persistent client storage cache
const getPersistentReports = () => {
  try {
    const cached = localStorage.getItem('dams_persistent_reports');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const setPersistentReports = (reports) => {
  try {
    if (Array.isArray(reports)) {
      localStorage.setItem('dams_persistent_reports', JSON.stringify(reports));
    }
  } catch (e) {}
};

const initialMockMachines = [
  {
    id: 6,
    machineNumber: 'DM-1000-13',
    machineName: 'DM-1000-13',
    machineType: 'Diamond Core Rig',
    campId: 1,
    campName: 'Anandwan Camp',
    campCode: 'CMPDI-AND-01',
    status: 'ACTIVE',
    operatorName: '',
    monthlyTarget: 360,
    yearlyTarget: 6450,
    targetYear: 2026,
    monthwiseTargets: { Apr: 444, May: 444, Jun: 445, Jul: 340, Aug: 350, Sep: 360, Oct: 389, Nov: 445, Dec: 567, Jan: 778, Feb: 888, Mar: 1000 }
  },
  {
    id: 7,
    machineNumber: 'DM-1000-15',
    machineName: 'DM-1000-15',
    machineType: 'Diamond Core Rig',
    campId: 1,
    campName: 'Anandwan Camp',
    campCode: 'CMPDI-AND-01',
    status: 'ACTIVE',
    operatorName: '',
    monthlyTarget: 0,
    yearlyTarget: 6445,
    targetYear: 2026,
    monthwiseTargets: { Apr: 444, May: 445, Jun: 444, Jul: 340, Aug: 345, Sep: 360, Oct: 389, Nov: 445, Dec: 567, Jan: 778, Feb: 888, Mar: 1000 }
  },
  {
    id: 8,
    machineNumber: 'DM-1000-22',
    machineName: 'DM-1000-22',
    machineType: 'Diamond Core Rig',
    campId: 1,
    campName: 'Anandwan Camp',
    campCode: 'CMPDI-AND-01',
    status: 'ACTIVE',
    operatorName: '',
    monthlyTarget: 0,
    yearlyTarget: 6445,
    targetYear: 2026,
    monthwiseTargets: { Apr: 445, May: 444, Jun: 445, Jul: 340, Aug: 345, Sep: 360, Oct: 389, Nov: 444, Dec: 566, Jan: 777, Feb: 890, Mar: 1000 }
  },
  {
    id: 9,
    machineNumber: 'KME-1000-06',
    machineName: 'KME-1000-06',
    machineType: 'Diamond Core Rig',
    campId: 3,
    campName: 'Durgapur Camp',
    campCode: 'CMPDI-DGP-03',
    status: 'ACTIVE',
    operatorName: '',
    monthlyTarget: 250,
    yearlyTarget: 6441,
    targetYear: 2026,
    monthwiseTargets: { Apr: 445, May: 445, Jun: 445, Jul: 340, Aug: 340, Sep: 360, Oct: 388, Nov: 444, Dec: 567, Jan: 778, Feb: 889, Mar: 1000 }
  }
];

const getPersistentMachines = () => {
  try {
    const cached = localStorage.getItem('dams_persistent_machines');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return initialMockMachines;
};

const setPersistentMachines = (machines) => {
  try {
    if (Array.isArray(machines)) {
      localStorage.setItem('dams_persistent_machines', JSON.stringify(machines));
    }
  } catch (e) {}
};

const initialMockBits = [
  { id: 1, bitNumber: 'BIT-NX-98472', bitType: 'Diamond Core Bit', size: 'NX (75.7mm)', manufacturer: 'Boart Longyear', campId: 1, campName: 'Anandwan Camp', campCode: 'CMPDI-AND-01', assignedMachineNumber: 'DM-1000-13', status: 'IN_USE', totalMetersDrilled: 412.5, issueDate: '2026-01-10', remarks: 'Primary core bit for Block A coal exploration' },
  { id: 2, bitNumber: 'BIT-NX-98473', bitType: 'Surface Set Diamond', size: 'NX (75.7mm)', manufacturer: 'Christensen', campId: 1, campName: 'Anandwan Camp', campCode: 'CMPDI-AND-01', assignedMachineNumber: 'DM-1000-15', status: 'IN_USE', totalMetersDrilled: 285.0, issueDate: '2026-02-01', remarks: 'Operational in Block B' },
  { id: 3, bitNumber: 'BIT-HQ-55102', bitType: 'Impregnated Diamond', size: 'HQ (96mm)', manufacturer: 'Boart Longyear', campId: 1, campName: 'Anandwan Camp', campCode: 'CMPDI-AND-01', assignedMachineNumber: 'DM-1000-22', status: 'AVAILABLE', totalMetersDrilled: 0.0, issueDate: '2026-03-01', remarks: 'New stock reserved for deep overburden coring' },
  { id: 4, bitNumber: 'BIT-BX-44120', bitType: 'TC Carbide Bit', size: 'BX (60mm)', manufacturer: 'Sandvik', campId: 2, campName: 'Murpar Camp', campCode: 'CMPDI-MRP-02', assignedMachineNumber: '', status: 'AVAILABLE', totalMetersDrilled: 360.2, issueDate: '2026-01-18', remarks: 'Used in Murpar central sector' },
  { id: 5, bitNumber: 'BIT-TRC-7701', bitType: 'Tricone Roller Bit', size: '150mm', manufacturer: 'Atlas Copco', campId: 2, campName: 'Murpar Camp', campCode: 'CMPDI-MRP-02', assignedMachineNumber: '', status: 'MAINTENANCE', totalMetersDrilled: 198.4, issueDate: '2026-02-14', remarks: 'Sent for gauge retipping' },
  { id: 6, bitNumber: 'BIT-PDC-3011', bitType: 'PDC Core Bit', size: 'NQ (75.7mm)', manufacturer: 'DCI Drilling', campId: 3, campName: 'Durgapur Camp', campCode: 'CMPDI-DGP-03', assignedMachineNumber: 'KME-1000-06', status: 'IN_USE', totalMetersDrilled: 520.8, issueDate: '2026-01-05', remarks: 'High penetration bit in Raniganj sandstone' },
  { id: 7, bitNumber: 'BIT-NX-88210', bitType: 'Diamond Core Bit', size: 'NX (75.7mm)', manufacturer: 'Christensen', campId: 3, campName: 'Durgapur Camp', campCode: 'CMPDI-DGP-03', assignedMachineNumber: '', status: 'WORN_OUT', totalMetersDrilled: 680.5, issueDate: '2025-11-20', remarks: 'Completed 680m drilling run; retired' }
];

const getPersistentBits = () => {
  try {
    const cached = localStorage.getItem('dams_persistent_bits');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return initialMockBits;
};

const setPersistentBits = (bits) => {
  try {
    if (Array.isArray(bits)) {
      localStorage.setItem('dams_persistent_bits', JSON.stringify(bits));
    }
  } catch (e) {}
};

// Initial data collections fallback
let mockCamps = [
  { id: 1, campCode: 'CMPDI-AND-01', campName: 'Anandwan Camp', location: 'Chandrapur District, Maharashtra', latitude: 19.9615, longitude: 79.2961, status: 'ACTIVE', dailyTarget: 25.0, weeklyTarget: 150.0, monthlyTarget: 600.0, yearlyTarget: 4800.0 },
  { id: 2, campCode: 'CMPDI-MRP-02', campName: 'Murpar Camp', location: 'Nagpur District, Maharashtra', latitude: 20.8524, longitude: 78.9856, status: 'ACTIVE', dailyTarget: 20.0, weeklyTarget: 120.0, monthlyTarget: 450.0, yearlyTarget: 3600.0 },
  { id: 3, campCode: 'CMPDI-DGP-03', campName: 'Durgapur Camp', location: 'Paschim Bardhaman, West Bengal', latitude: 23.5204, longitude: 87.3119, status: 'ACTIVE', dailyTarget: 30.0, weeklyTarget: 180.0, monthlyTarget: 700.0, yearlyTarget: 5000.0 }
];

let mockUsers = [
  { id: 1, employeeId: 'EMP001', name: 'System Administrator', designation: 'Chief Mining Engineer / Admin', email: 'admin@cmpdi.co.in', role: 'ROLE_ADMIN', status: 'ACTIVE' },
  { id: 2, employeeId: 'EMP002', name: 'Rajesh Sharma', designation: 'Camp Executive - Anandwan', email: 'exec.anandwan@cmpdi.co.in', role: 'ROLE_CAMP_EXEC', campId: 1, campName: 'Anandwan Camp', status: 'ACTIVE' },
  { id: 3, employeeId: 'EMP003', name: 'Amit Patel', designation: 'Camp Executive - Murpar', email: 'exec.murpar@cmpdi.co.in', role: 'ROLE_CAMP_EXEC', campId: 2, campName: 'Murpar Camp', status: 'ACTIVE' },
  { id: 4, employeeId: 'EMP004', name: 'Dr. Sunita Deshmukh', designation: 'General Manager (Exploration)', email: 'dept.head@cmpdi.co.in', role: 'ROLE_DEPT_EXEC', status: 'ACTIVE' }
];
let mockReports = getPersistentReports();
let mockAuditLogs = [];
let mockNotifications = [];

export const apiService = {
  // Authentication
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data.data;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(err.message || 'Invalid username or password. Please try again.');
    }
  },

  // Daily Reports
  getReports: async (filters = {}) => {
    try {
      const response = await apiClient.get('/reports', { params: filters });
      if (Array.isArray(response.data?.data)) {
        mockReports = response.data.data;
        if (Object.keys(filters).length === 0) {
          setPersistentReports(response.data.data);
        }
        return response.data.data;
      }
      return getPersistentReports();
    } catch {
      let filtered = getPersistentReports();
      if (filters.campId) {
        filtered = filtered.filter(r => r.campId === parseInt(filters.campId));
      }
      if (filters.status) {
        filtered = filtered.filter(r => r.reportStatus === filters.status);
      }
      if (filters.blockName) {
        filtered = filtered.filter(r => r.blockName?.toLowerCase().includes(filters.blockName.toLowerCase()));
      }
      if (filters.fromDate) {
        filtered = filtered.filter(r => r.reportDate >= filters.fromDate);
      }
      if (filters.toDate) {
        filtered = filtered.filter(r => r.reportDate <= filters.toDate);
      }
      return filtered;
    }
  },

  getReportById: async (id) => {
    try {
      const response = await apiClient.get(`/reports/${id}`);
      return response.data.data;
    } catch {
      const reports = getPersistentReports();
      return reports.find(r => r.reportId === parseInt(id)) || reports[0];
    }
  },

  createReport: async (reportData, user) => {
    const sanitizedData = {
      ...reportData,
      boreholeStartDate: reportData.boreholeStartDate || null,
      drillingStartTime: reportData.drillingStartTime || null,
      drillingEndTime: reportData.drillingEndTime || null,
      blockName: reportData.blockName || null,
      boreholeId: reportData.boreholeId || null,
      bitNo: reportData.bitNo || null,
      remarks: reportData.remarks || null,
    };

    try {
      const response = await apiClient.post('/reports', sanitizedData);
      const created = response.data.data;
      if (created) {
        const currentCache = getPersistentReports();
        currentCache.unshift(created);
        setPersistentReports(currentCache);
      }
      return created;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      if (err.response?.data?.data && typeof err.response.data.data === 'string') {
        throw new Error(err.response.data.data);
      }
      if (err.message && err.message !== 'Network Error') {
        throw new Error(err.message);
      }

      // Offline persistent fallback
      const camp = mockCamps.find(c => c.id === parseInt(reportData.campId)) || mockCamps[0] || { campName: 'Drilling Camp' };
      const dailyProg = parseFloat((reportData.closingDepth - reportData.openingDepth).toFixed(2));
      const newReport = {
        reportId: Math.floor(1000 + Math.random() * 9000),
        ...sanitizedData,
        campName: camp.campName,
        dailyProgress: dailyProg,
        reportStatus: reportData.reportStatus || 'DRAFT',
        createdBy: user?.name || 'Camp Executive',
        version: 0,
        correctionHistory: [],
        createdAt: new Date().toISOString()
      };
      
      const currentCache = getPersistentReports();
      currentCache.unshift(newReport);
      setPersistentReports(currentCache);
      return newReport;
    }
  },

  updateReport: async (id, reportData, user) => {
    const sanitizedData = {
      ...reportData,
      boreholeStartDate: reportData.boreholeStartDate || null,
      drillingStartTime: reportData.drillingStartTime || null,
      drillingEndTime: reportData.drillingEndTime || null,
      blockName: reportData.blockName || null,
      boreholeId: reportData.boreholeId || null,
      bitNo: reportData.bitNo || null,
      remarks: reportData.remarks || null,
    };

    try {
      const response = await apiClient.put(`/reports/${id}`, sanitizedData);
      const updated = response.data.data;
      if (updated) {
        const currentCache = getPersistentReports();
        const idx = currentCache.findIndex(r => r.reportId === parseInt(id));
        if (idx !== -1) {
          currentCache[idx] = updated;
          setPersistentReports(currentCache);
        }
      }
      return updated;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      const currentCache = getPersistentReports();
      const index = currentCache.findIndex(r => r.reportId === parseInt(id));
      if (index !== -1) {
        const old = currentCache[index];
        const dailyProg = parseFloat((reportData.closingDepth - reportData.openingDepth).toFixed(2));
        const updated = {
          ...old,
          ...sanitizedData,
          dailyProgress: dailyProg,
          version: (old.version || 0) + 1,
          updatedAt: new Date().toISOString()
        };
        currentCache[index] = updated;
        setPersistentReports(currentCache);
        return updated;
      }
      throw new Error(err.message || 'Report not found');
    }
  },

  approveReport: async (id, approver) => {
    try {
      const response = await apiClient.post(`/reports/${id}/approve`);
      const approved = response.data.data;
      if (approved) {
        const currentCache = getPersistentReports();
        const idx = currentCache.findIndex(r => r.reportId === parseInt(id));
        if (idx !== -1) {
          currentCache[idx] = approved;
          setPersistentReports(currentCache);
        }
      }
      return approved;
    } catch {
      const currentCache = getPersistentReports();
      const report = currentCache.find(r => r.reportId === parseInt(id));
      if (report) {
        report.reportStatus = 'APPROVED';
        report.approvedBy = approver?.name || 'Dr. Sunita Deshmukh';
        report.approvedDate = new Date().toISOString();
        setPersistentReports(currentCache);
        return report;
      }
    }
  },

  returnReport: async (id, remarks, reviewer) => {
    try {
      const response = await apiClient.post(`/reports/${id}/return`, { remarks });
      const returned = response.data.data;
      if (returned) {
        const currentCache = getPersistentReports();
        const idx = currentCache.findIndex(r => r.reportId === parseInt(id));
        if (idx !== -1) {
          currentCache[idx] = returned;
          setPersistentReports(currentCache);
        }
      }
      return returned;
    } catch {
      const currentCache = getPersistentReports();
      const report = currentCache.find(r => r.reportId === parseInt(id));
      if (report) {
        report.reportStatus = 'RETURNED';
        const remarkObj = {
          id: (report.correctionHistory?.length || 0) + 1,
          reportId: parseInt(id),
          remarks,
          createdBy: reviewer?.name || 'Dr. Sunita Deshmukh',
          createdAt: new Date().toISOString()
        };
        if (!report.correctionHistory) report.correctionHistory = [];
        report.correctionHistory.unshift(remarkObj);
        setPersistentReports(currentCache);
        return report;
      }
    }
  },

  deleteReport: async (id, user) => {
    try {
      const response = await apiClient.delete(`/reports/${id}`);
      const currentCache = getPersistentReports();
      const filtered = currentCache.filter(r => r.reportId !== parseInt(id));
      setPersistentReports(filtered);
      return response.data.data;
    } catch {
      const currentCache = getPersistentReports();
      const index = currentCache.findIndex(r => r.reportId === parseInt(id));
      if (index !== -1) {
        currentCache.splice(index, 1);
        setPersistentReports(currentCache);
        return true;
      }
      return false;
    }
  },

  getDashboardSummary: async () => {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data.data;
    } catch {
      const reports = getPersistentReports();
      const todayObj = new Date();
      const todayStr = todayObj.toISOString().split('T')[0];
      
      const currentYear = todayObj.getFullYear();
      const currentMonth = todayObj.getMonth() + 1; // 1-12
      const currentFyStartYear = (currentMonth >= 4) ? currentYear : currentYear - 1;
      
      const currentFyLabel = `FY ${currentFyStartYear}-${((currentFyStartYear + 1) % 100).toString().padStart(2, '0')}`;
      const previousFyLabel = `FY ${currentFyStartYear - 1}-${(currentFyStartYear % 100).toString().padStart(2, '0')}`;

      const approvedReports = reports.filter(r => r.reportStatus === 'APPROVED');
      const totalMeters = reports.reduce((sum, r) => sum + (parseFloat(r.dailyProgress) || 0), 0);
      const firstDayOfMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const monthlyReports = reports.filter(r => r.reportDate && r.reportDate >= firstDayOfMonthStr && r.reportDate <= todayStr);
      const monthlyMeters = monthlyReports.reduce((sum, r) => sum + (parseFloat(r.dailyProgress) || 0), 0);

      const prevYearAchieve = 80000;
      const growthPct = prevYearAchieve > 0 
        ? parseFloat((((totalMeters - prevYearAchieve) / prevYearAchieve) * 100).toFixed(1))
        : 0;


      const currentMachines = getPersistentMachines();
      const combinedTarget = currentMachines.reduce((sum, m) => sum + (parseFloat(m.yearlyTarget) || 0), 0);

      return {
        totalCamps: mockCamps.length,
        todayReports: reports.filter(r => r.reportDate === todayStr).length,
        pendingReports: reports.filter(r => r.reportStatus === 'SUBMITTED').length,
        approvedReports: approvedReports.length,
        returnedReports: reports.filter(r => r.reportStatus === 'RETURNED').length,
        draftReports: reports.filter(r => r.reportStatus === 'DRAFT').length,
        totalMeterDrilled: parseFloat(totalMeters.toFixed(2)),
        monthlyProgress: parseFloat(monthlyMeters.toFixed(2)),
        yearlyProgress: parseFloat(totalMeters.toFixed(2)),
        currentFyTarget: combinedTarget,
        riIvCurrentFyTarget: combinedTarget,
        previousYearAchievement: prevYearAchieve,
        currentFyLabel,
        previousFyLabel,
        fyGrowthPercentage: growthPct,
        campComparison: mockCamps.map(c => {
          const campMeters = reports
            .filter(r => r.campId === c.id)
            .reduce((sum, r) => sum + (parseFloat(r.dailyProgress) || 0), 0);
          return {
            campName: c.campName,
            totalMeters: parseFloat(campMeters.toFixed(2))
          };
        }),
        recentActivities: [...reports],
        pendingCorrections: reports.filter(r => r.reportStatus === 'RETURNED')
      };
    }
  },



  // Camps CRUD
  getCamps: async () => {
    try {
      const response = await apiClient.get('/camps');
      if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
        mockCamps = response.data.data;
        return response.data.data;
      }
      return response.data?.data || mockCamps;
    } catch {
      return mockCamps;
    }
  },

  createCamp: async (campData) => {
    try {
      const response = await apiClient.post('/camps', campData);
      const created = response.data.data;
      if (created) mockCamps.push(created);
      return created;
    } catch {
      const newCamp = { id: mockCamps.length + 1, ...campData, status: 'ACTIVE', dailyTarget: 20.0, weeklyTarget: 120.0, monthlyTarget: 450.0, yearlyTarget: 3600.0 };
      mockCamps.push(newCamp);
      return newCamp;
    }
  },

  updateCampTargets: async (campId, targetsData) => {
    try {
      const response = await apiClient.put(`/camps/${campId}/targets`, targetsData);
      return response.data.data;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      const camp = mockCamps.find(c => c.id === parseInt(campId));
      if (camp) {
        camp.dailyTarget = parseFloat(targetsData.dailyTarget) || 0;
        camp.weeklyTarget = parseFloat(targetsData.weeklyTarget) || 0;
        camp.monthlyTarget = parseFloat(targetsData.monthlyTarget) || 0;
        camp.yearlyTarget = parseFloat(targetsData.yearlyTarget) || 0;
        return camp;
      }
      throw new Error(err.message || 'Failed to update camp targets');
    }
  },

  // Machines & Monthwise Targets CRUD
  getMachines: async (campId, year = 2026) => {
    try {
      const params = { year };
      if (campId) params.campId = campId;
      const response = await apiClient.get('/machines', { params });
      if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
        setPersistentMachines(response.data.data);
        return response.data.data;
      }
      return response.data?.data || getPersistentMachines();
    } catch {
      let machines = getPersistentMachines();
      if (campId) {
        machines = machines.filter(m => m.campId === parseInt(campId));
      }
      return machines;
    }
  },

  getMachineById: async (id, year = 2026) => {
    try {
      const response = await apiClient.get(`/machines/${id}`, { params: { year } });
      return response.data.data;
    } catch {
      const machines = getPersistentMachines();
      return machines.find(m => m.id === parseInt(id));
    }
  },

  createMachine: async (machineData) => {
    try {
      const response = await apiClient.post('/machines', machineData);
      const created = response.data.data;
      if (created) {
        const cache = getPersistentMachines();
        cache.push(created);
        setPersistentMachines(cache);
      }
      return created;
    } catch (err) {
      if (err.response?.data?.message) throw new Error(err.response.data.message);
      // Fallback local create
      const cache = getPersistentMachines();
      const camps = mockCamps;
      const camp = camps.find(c => c.id === parseInt(machineData.campId)) || camps[0];
      const newId = cache.length > 0 ? Math.max(...cache.map(m => m.id || 0)) + 1 : 1;
      const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      const monthwise = {};
      months.forEach(m => { monthwise[m] = parseFloat(machineData.monthlyTarget) || 250; });

      const newMachine = {
        id: newId,
        machineNumber: machineData.machineNumber,
        machineName: machineData.machineName || machineData.machineNumber,
        machineType: machineData.machineType || 'Diamond Core Rig',
        campId: parseInt(machineData.campId),
        campName: camp.campName,
        campCode: camp.campCode,
        status: machineData.status || 'ACTIVE',
        operatorName: machineData.operatorName || '',
        monthlyTarget: parseFloat(machineData.monthlyTarget) || 0,
        yearlyTarget: parseFloat(machineData.yearlyTarget) || 0,
        targetYear: machineData.targetYear || 2026,
        monthwiseTargets: monthwise
      };
      cache.push(newMachine);
      setPersistentMachines(cache);
      return newMachine;
    }
  },

  updateMachine: async (id, machineData) => {
    try {
      const response = await apiClient.put(`/machines/${id}`, machineData);
      const updated = response.data.data;
      if (updated) {
        const cache = getPersistentMachines();
        const idx = cache.findIndex(m => m.id === parseInt(id));
        if (idx !== -1) {
          cache[idx] = updated;
          setPersistentMachines(cache);
        }
      }
      return updated;
    } catch (err) {
      if (err.response?.data?.message) throw new Error(err.response.data.message);
      const cache = getPersistentMachines();
      const idx = cache.findIndex(m => m.id === parseInt(id));
      if (idx !== -1) {
        const current = cache[idx];
        const updated = { ...current, ...machineData };
        cache[idx] = updated;
        setPersistentMachines(cache);
        return updated;
      }
      throw new Error(err.message || 'Machine not found');
    }
  },

  deleteMachine: async (id) => {
    try {
      const response = await apiClient.delete(`/machines/${id}`);
      const cache = getPersistentMachines();
      const filtered = cache.filter(m => m.id !== parseInt(id));
      setPersistentMachines(filtered);
      return response.data.data;
    } catch (err) {
      const cache = getPersistentMachines();
      const filtered = cache.filter(m => m.id !== parseInt(id));
      setPersistentMachines(filtered);
      return true;
    }
  },

  getMachineTargets: async (machineId, year = 2026) => {
    try {
      const response = await apiClient.get(`/machines/${machineId}/targets`, { params: { year } });
      return response.data.data;
    } catch {
      const machines = getPersistentMachines();
      const m = machines.find(x => x.id === parseInt(machineId));
      return m?.monthwiseTargets || {};
    }
  },

  updateMachineTargets: async (machineId, payload) => {
    try {
      const response = await apiClient.post(`/machines/${machineId}/targets`, payload);
      const updated = response.data.data;
      if (updated) {
        const cache = getPersistentMachines();
        const idx = cache.findIndex(m => m.id === parseInt(machineId));
        if (idx !== -1) {
          cache[idx] = updated;
          setPersistentMachines(cache);
        }
      }
      return updated;
    } catch (err) {
      if (err.response?.data?.message) throw new Error(err.response.data.message);
      const cache = getPersistentMachines();
      const idx = cache.findIndex(m => m.id === parseInt(machineId));
      if (idx !== -1) {
        const machine = cache[idx];
        machine.monthwiseTargets = { ...payload.targets };
        const total = Object.values(payload.targets).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
        machine.yearlyTarget = total;
        setPersistentMachines(cache);
        return machine;
      }
      throw new Error(err.message || 'Failed to update machine targets');
    }
  },

  // Users CRUD
  getUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
        mockUsers = response.data.data;
        return response.data.data;
      }
      return response.data?.data || mockUsers;
    } catch (err) {
      console.error("Error fetching users:", err);
      return mockUsers;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      const created = response.data.data;
      if (created) mockUsers.push(created);
      return created;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(err.message || "Failed to create user account.");
    }
  },

  resetUserPassword: async (userId, newPassword) => {
    try {
      const response = await apiClient.post(`/users/${userId}/reset-password`, { password: newPassword });
      return response.data;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(err.message || "Failed to reset password.");
    }
  },

  changePassword: async (currentPassword, newPassword, user) => {
    try {
      const response = await apiClient.post('/users/change-password', {
        email: user?.email || user?.employeeId,
        currentPassword,
        newPassword
      });

      // Update local storage cache on success
      let storedPasswords = {};
      try {
        storedPasswords = JSON.parse(localStorage.getItem('dams_user_passwords') || '{}');
      } catch (e) {}
      if (user?.email) storedPasswords[user.email] = newPassword;
      if (user?.employeeId) storedPasswords[user.employeeId] = newPassword;
      localStorage.setItem('dams_user_passwords', JSON.stringify(storedPasswords));

      return response.data;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      
      // Fallback for offline/local mode
      let storedPasswords = {};
      try {
        storedPasswords = JSON.parse(localStorage.getItem('dams_user_passwords') || '{}');
      } catch (e) {}

      const expectedCurrent = (user?.email && storedPasswords[user.email]) || 
                              (user?.employeeId && storedPasswords[user.employeeId]) || 
                              'password123';

      if (currentPassword !== expectedCurrent) {
        throw new Error("Current password provided is incorrect.");
      }

      if (user?.email) storedPasswords[user.email] = newPassword;
      if (user?.employeeId) storedPasswords[user.employeeId] = newPassword;
      localStorage.setItem('dams_user_passwords', JSON.stringify(storedPasswords));
      return true;
    }
  },

  // Audit Logs
  getAuditLogs: async () => {
    try {
      const response = await apiClient.get('/audit-logs');
      return response.data.data;
    } catch {
      return mockAuditLogs;
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data.data;
    } catch {
      return [...mockNotifications];
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await apiClient.post('/notifications/mark-all-read');
      mockNotifications = mockNotifications.map(n => ({ ...n, isRead: true, read: true }));
      return mockNotifications;
    } catch {
      mockNotifications = mockNotifications.map(n => ({ ...n, isRead: true, read: true }));
      return [...mockNotifications];
    }
  },

  markNotificationRead: async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      const found = mockNotifications.find(n => n.id === id);
      if (found) {
        found.isRead = true;
        found.read = true;
      }
      return mockNotifications;
    } catch {
      const found = mockNotifications.find(n => n.id === id);
      if (found) {
        found.isRead = true;
        found.read = true;
      }
      return [...mockNotifications];
    }
  },

  // GIS Exploration Map
  getGisMapData: async () => {
    try {
      const response = await apiClient.get('/gis/map-data');
      return response.data.data;
    } catch (err) {
      console.warn("Falling back to local GIS data:", err);
      return {
        camps: [
          { id: 1, campCode: 'CMPDI-AND-01', campName: 'Anandwan Camp', location: 'Chandrapur, MH', latitude: 19.9615, longitude: 79.2961, status: 'ACTIVE' },
          { id: 2, campCode: 'CMPDI-MRP-02', campName: 'Murpar Camp', location: 'Nagpur, MH', latitude: 20.8524, longitude: 78.9856, status: 'ACTIVE' },
          { id: 3, campCode: 'CMPDI-DGP-03', campName: 'Durgapur Camp', location: 'Paschim Bardhaman, WB', latitude: 23.5204, longitude: 87.3119, status: 'ACTIVE' }
        ],
        rigs: [
          { id: 'RIG-1', machineNumber: 'CMPDI-RIG-01', drillHole: 'BH-AND-101', campId: 1, campName: 'Anandwan Camp', blockName: 'Anandwan Deep Coal Block', latitude: 19.9735, longitude: 79.3111, currentDepth: 184.5, plannedDepth: 500, dailyProgress: 24.5, status: 'ACTIVE', lastUpdated: 'Today' },
          { id: 'RIG-2', machineNumber: 'CMPDI-RIG-02', drillHole: 'BH-AND-102', campId: 1, campName: 'Anandwan Camp', blockName: 'Anandwan South Sector', latitude: 19.9535, longitude: 79.2841, currentDepth: 95.0, plannedDepth: 400, dailyProgress: 19.0, status: 'ACTIVE', lastUpdated: 'Today' },
          { id: 'RIG-3', machineNumber: 'CMPDI-RIG-03', drillHole: 'BH-MRP-201', campId: 2, campName: 'Murpar Camp', blockName: 'Murpar Extension Block', latitude: 20.8444, longitude: 78.9736, currentDepth: 230.0, plannedDepth: 600, dailyProgress: 15.0, status: 'MAINTENANCE', lastUpdated: 'Yesterday' },
          { id: 'RIG-4', machineNumber: 'CMPDI-RIG-04', drillHole: 'BH-DGP-301', campId: 3, campName: 'Durgapur Camp', blockName: 'Raniganj Coalfield Sector 4', latitude: 23.5414, longitude: 87.2969, currentDepth: 310.2, plannedDepth: 550, dailyProgress: 28.0, status: 'ACTIVE', lastUpdated: 'Today' }
        ],
        summary: {
          totalCamps: 3,
          totalActiveRigs: 4,
          totalMappedMeters: 819.7,
          activeBlocksCount: 4
        }
      };
    }
  },

  // Drill Bit Management CRUD
  getBits: async (campId, status) => {
    try {
      const params = {};
      if (campId) params.campId = campId;
      if (status && status !== 'ALL') params.status = status;
      const response = await apiClient.get('/bits', { params });
      if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
        setPersistentBits(response.data.data);
        return response.data.data;
      }
      return response.data?.data || getPersistentBits();
    } catch {
      let bits = getPersistentBits();
      if (campId) {
        bits = bits.filter(b => b.campId === parseInt(campId));
      }
      if (status && status !== 'ALL') {
        bits = bits.filter(b => b.status === status);
      }
      return bits;
    }
  },

  getBitById: async (id) => {
    try {
      const response = await apiClient.get(`/bits/${id}`);
      return response.data.data;
    } catch {
      const bits = getPersistentBits();
      return bits.find(b => b.id === parseInt(id));
    }
  },

  createBit: async (bitData) => {
    try {
      const response = await apiClient.post('/bits', bitData);
      const created = response.data.data;
      if (created) {
        const cache = getPersistentBits();
        cache.unshift(created);
        setPersistentBits(cache);
      }
      return created;
    } catch (err) {
      if (err.response?.data?.message) throw new Error(err.response.data.message);
      const cache = getPersistentBits();
      const camps = mockCamps;
      const camp = camps.find(c => c.id === parseInt(bitData.campId)) || camps[0];
      const newId = cache.length > 0 ? Math.max(...cache.map(b => b.id || 0)) + 1 : 1;
      const newBit = {
        id: newId,
        bitNumber: bitData.bitNumber,
        bitType: bitData.bitType || 'Diamond Core Bit',
        size: bitData.size || 'NX (75.7mm)',
        manufacturer: bitData.manufacturer || '',
        campId: parseInt(bitData.campId),
        campName: camp.campName,
        campCode: camp.campCode,
        assignedMachineNumber: bitData.assignedMachineNumber || '',
        status: bitData.status || 'AVAILABLE',
        totalMetersDrilled: parseFloat(bitData.totalMetersDrilled) || 0,
        issueDate: bitData.issueDate || new Date().toISOString().split('T')[0],
        remarks: bitData.remarks || ''
      };
      cache.unshift(newBit);
      setPersistentBits(cache);
      return newBit;
    }
  },

  updateBit: async (id, bitData) => {
    try {
      const response = await apiClient.put(`/bits/${id}`, bitData);
      const updated = response.data.data;
      if (updated) {
        const cache = getPersistentBits();
        const idx = cache.findIndex(b => b.id === parseInt(id));
        if (idx !== -1) {
          cache[idx] = updated;
          setPersistentBits(cache);
        }
      }
      return updated;
    } catch (err) {
      if (err.response?.data?.message) throw new Error(err.response.data.message);
      const cache = getPersistentBits();
      const idx = cache.findIndex(b => b.id === parseInt(id));
      if (idx !== -1) {
        const camps = mockCamps;
        const camp = camps.find(c => c.id === parseInt(bitData.campId)) || camps.find(c => c.id === cache[idx].campId);
        cache[idx] = {
          ...cache[idx],
          ...bitData,
          campName: camp ? camp.campName : cache[idx].campName,
          campCode: camp ? camp.campCode : cache[idx].campCode,
          totalMetersDrilled: parseFloat(bitData.totalMetersDrilled) || cache[idx].totalMetersDrilled
        };
        setPersistentBits(cache);
        return cache[idx];
      }
      throw new Error("Bit not found");
    }
  },

  deleteBit: async (id) => {
    try {
      await apiClient.delete(`/bits/${id}`);
      const cache = getPersistentBits().filter(b => b.id !== parseInt(id));
      setPersistentBits(cache);
      return true;
    } catch {
      const cache = getPersistentBits().filter(b => b.id !== parseInt(id));
      setPersistentBits(cache);
      return true;
    }
  }
};
