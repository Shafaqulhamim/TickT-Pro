import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  getProfile: () =>
    api.get('/auth/profile'),
};

// Tickets API
export const ticketsAPI = {
  getAll: () =>
    api.get('/tickets'),
  
  create: (ticketData: any) =>
    api.post('/tickets', ticketData),
  
  assign: (ticketId: number, engineerId: number, managerNotes?: string) =>
    api.patch(`/tickets/${ticketId}/assign`, { 
      engineer_id: engineerId, 
      manager_notes: managerNotes 
    }),
  
  respond: (ticketId: number, action: 'accept' | 'reject', rejectionReason?: string) =>
    api.patch(`/tickets/${ticketId}/respond`, { 
      action, 
      rejection_reason: rejectionReason 
    }),
  
  updateStatus: (ticketId: number, status: string, notes?: string) =>
    api.patch(`/tickets/${ticketId}/status`, { status, notes }),
  
  getHistory: (ticketId: number) =>
    api.get(`/tickets/${ticketId}/history`),
};

// Equipment API
export const equipmentAPI = {
  getAll: () =>
    api.get('/equipment'),
  
  getByCustomer: (customerId: number) =>
    api.get(`/equipment/customer/${customerId}`),
  
  create: (equipmentData: any) =>
    api.post('/equipment', equipmentData),
  
  update: (equipmentId: number, equipmentData: any) =>
    api.put(`/equipment/${equipmentId}`, equipmentData),
};

// Users API
export const usersAPI = {
  getAll: () =>
    api.get('/users'),
  
  getByRole: (role: string) =>
    api.get(`/users/role/${role}`),
  
  create: (userData: any) =>
    api.post('/users', userData),
  
  update: (userId: number, userData: any) =>
    api.put(`/users/${userId}`, userData),
  
  delete: (userId: number) =>
    api.delete(`/users/${userId}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () =>
    api.get('/notifications'),
  
  markAsRead: (notificationId: number) =>
    api.patch(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
};

export default api;