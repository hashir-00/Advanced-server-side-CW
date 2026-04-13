import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  resendVerification: (email) => api.post('/auth/resend-verification', { email })
};

export const profileService = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  addEducation: (data) => api.post('/profile/education', data),
  updateEducation: (id, data) => api.put(`/profile/education/${id}`, data),
  deleteEducation: (id) => api.delete(`/profile/education/${id}`),
  addExperience: (data) => api.post('/profile/experience', data),
  updateExperience: (id, data) => api.put(`/profile/experience/${id}`, data),
  deleteExperience: (id) => api.delete(`/profile/experience/${id}`)
};

export const biddingService = {
  placeBid: (amount, targetDate) => api.post('/bidding/place', { amount, targetDate }),
  increaseBid: (bidId, newAmount) => api.put(`/bidding/increase/${bidId}`, { newAmount }),
  getMyBids: () => api.get('/bidding/my-bids'),
  checkEligibility: (targetDate) => api.get('/bidding/eligibility', { params: { targetDate } })
};

export const analyticsService = {
  getStats: () => api.get('/analytics/stats'),
  getCharts: () => api.get('/analytics/charts')
};

export const alumniService = {
  getDirectory: (params) => api.get('/alumni/directory', { params }),
  getFilters: () => api.get('/alumni/filters')
};

export const securityService = {
  getMyKeys: () => api.get('/security/keys'),
  createKey: (name, scopes) => api.post('/security/keys', { name, scopes }),
  revokeKey: (keyId) => api.delete(`/security/keys/${keyId}`),
  getUsageLogs: (keyId) => api.get('/security/usage', { params: keyId ? { keyId } : {} }),
  getAllUsageLogs: () => api.get('/security/usage/all')
};

export default api;
