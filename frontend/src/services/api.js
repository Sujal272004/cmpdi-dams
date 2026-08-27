import axios from 'axios';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Session expired or unauthorized. Clearing stored auth.");
      localStorage.removeItem('dams_token');
      localStorage.removeItem('dams_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
let mockReports = [];
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
      
      // Offline / Live Vercel demo mode login fallback
      const identifier = (credentials?.username || credentials?.email || '').toLowerCase().trim();
      const matchedUser = mockUsers.find(
        u => u.email.toLowerCase() === identifier || u.employeeId.toLowerCase() === identifier
      ) || mockUsers[0];

      return {
        token: 'demo-jwt-token-' + Date.now(),
        id: matchedUser.id,
        employeeId: matchedUser.employeeId,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        designation: matchedUser.designation,
        campId: matchedUser.campId || null,
        campName: matchedUser.campName || null
      };
    }
  },

  // Daily Reports
  getReports: async (filters = {}) => {
    try {
      const response = await apiClient.get('/reports', { params: filters });
      if (Array.isArray(response.data?.data) && Object.keys(filters).length === 0) {
        mockReports = response.data.data;
      }
      return response.data.data;
    } catch {
      let filtered = [...mockReports];
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
      return mockReports.find(r => r.reportId === parseInt(id)) || mockReports[0];
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
      remarks: reportData.remarks || null,
    };

    try {
      const response = await apiClient.post('/reports', sanitizedData);
      return response.data.data;
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

      // Offline fallback
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
      mockReports.unshift(newReport);
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
      remarks: reportData.remarks || null,
    };

    try {
      const response = await apiClient.put(`/reports/${id}`, sanitizedData);
      return response.data.data;
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      const index = mockReports.findIndex(r => r.reportId === parseInt(id));
      if (index !== -1) {
        const old = mockReports[index];
        const dailyProg = parseFloat((reportData.closingDepth - reportData.openingDepth).toFixed(2));
        const updated = {
          ...old,
          ...sanitizedData,
          dailyProgress: dailyProg,
          version: (old.version || 0) + 1,
          updatedAt: new Date().toISOString()
        };
        mockReports[index] = updated;
        return updated;
      }
      throw new Error(err.message || 'Report not found');
    }
  },

  approveReport: async (id, approver) => {
    try {
      const response = await apiClient.post(`/reports/${id}/approve`);
      return response.data.data;
    } catch {
      const report = mockReports.find(r => r.reportId === parseInt(id));
      if (report) {
        report.reportStatus = 'APPROVED';
        report.approvedBy = approver?.name || 'Dr. Sunita Deshmukh';
        report.approvedDate = new Date().toISOString();
        mockAuditLogs.unshift({
          id: mockAuditLogs.length + 1,
          entityName: 'DailyDrillingReport',
          entityId: id.toString(),
          action: 'APPROVE',
          oldValue: 'Status: SUBMITTED',
          newValue: 'Status: APPROVED',
          changedBy: report.approvedBy,
          ipAddress: '127.0.0.1',
          timestamp: new Date().toISOString()
        });
        return report;
      }
    }
  },

  returnReport: async (id, remarks, reviewer) => {
    try {
      const response = await apiClient.post(`/reports/${id}/return`, { remarks });
      return response.data.data;
    } catch {
      const report = mockReports.find(r => r.reportId === parseInt(id));
      if (report) {
        report.reportStatus = 'RETURNED';
        const remarkObj = {
          id: report.correctionHistory.length + 1,
          reportId: parseInt(id),
          remarks,
          createdBy: reviewer?.name || 'Dr. Sunita Deshmukh',
          createdAt: new Date().toISOString()
        };
        report.correctionHistory.unshift(remarkObj);
        mockAuditLogs.unshift({
          id: mockAuditLogs.length + 1,
          entityName: 'DailyDrillingReport',
          entityId: id.toString(),
          action: 'RETURN',
          oldValue: 'Status: SUBMITTED',
          newValue: `Status: RETURNED (Remark: ${remarks})`,
          changedBy: remarkObj.createdBy,
          ipAddress: '127.0.0.1',
          timestamp: new Date().toISOString()
        });
        return report;
      }
    }
  },

  deleteReport: async (id, user) => {
    try {
      const response = await apiClient.delete(`/reports/${id}`);
      return response.data.data;
    } catch {
      const index = mockReports.findIndex(r => r.reportId === parseInt(id));
      if (index !== -1) {
        const deleted = mockReports.splice(index, 1)[0];
        mockAuditLogs.unshift({
          id: mockAuditLogs.length + 1,
          entityName: 'DailyDrillingReport',
          entityId: id.toString(),
          action: 'DELETE',
          oldValue: `Status: ${deleted.reportStatus}, DrillHole: ${deleted.drillHole}`,
          newValue: 'Deleted Draft Report',
          changedBy: user?.name || 'Camp Executive',
          ipAddress: '127.0.0.1',
          timestamp: new Date().toISOString()
        });
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
      const todayStr = new Date().toISOString().split('T')[0];
      const approvedReports = mockReports.filter(r => r.reportStatus === 'APPROVED');
      const totalMeters = mockReports.reduce((sum, r) => sum + (parseFloat(r.dailyProgress) || 0), 0);

      return {
        totalCamps: mockCamps.length,
        todayReports: mockReports.filter(r => r.reportDate === todayStr).length,
        pendingReports: mockReports.filter(r => r.reportStatus === 'SUBMITTED').length,
        approvedReports: approvedReports.length,
        returnedReports: mockReports.filter(r => r.reportStatus === 'RETURNED').length,
        draftReports: mockReports.filter(r => r.reportStatus === 'DRAFT').length,
        totalMeterDrilled: parseFloat(totalMeters.toFixed(2)),
        monthlyProgress: parseFloat(totalMeters.toFixed(2)),
        yearlyProgress: parseFloat(totalMeters.toFixed(2)),
        campComparison: mockCamps.map(c => {
          const campMeters = mockReports
            .filter(r => r.campId === c.id)
            .reduce((sum, r) => sum + (parseFloat(r.dailyProgress) || 0), 0);
          return {
            campName: c.campName,
            totalMeters: parseFloat(campMeters.toFixed(2))
          };
        }),
        recentActivities: [...mockReports],
        pendingCorrections: mockReports.filter(r => r.reportStatus === 'RETURNED')
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
  }
};
