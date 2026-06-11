import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resonance_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('resonance_token');
      localStorage.removeItem('resonance_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.patch(`/auth/reset-password/${token}`, { password }),
  updatePassword: (data) => api.patch('/auth/update-password', data),
};

// ── Events ────────────────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getMap: () => api.get('/events/map'),
  getBySlug: (slug) => api.get(`/events/${slug}`),
  getMy: () => api.get('/events/my'),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.patch(`/events/${id}`, data),
  publish: (id) => api.patch(`/events/${id}/publish`),
  delete: (id) => api.delete(`/events/${id}`),
  uploadCover: (id, formData) => api.post(`/events/${id}/cover`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Waitlist
  joinWaitlist: (id, data) => api.post(`/events/${id}/waitlist`, data),
  leaveWaitlist: (id) => api.delete(`/events/${id}/waitlist`),
  getWaitlist: (id) => api.get(`/events/${id}/waitlist`),
  notifyWaitlist: (id, data) => api.post(`/events/${id}/waitlist/notify`, data),
  // Kickback/referral
  generateKickbackCode: (id) => api.post(`/events/${id}/kickback/codes`),
  getKickbackCodes: (id) => api.get(`/events/${id}/kickback/codes`),
  updateKickback: (id, data) => api.put(`/events/${id}/kickback`, data),
  getMyKickbackEarnings: () => api.get('/events/kickback/earnings'),
};

// ── External (aggregated) Events ─────────────────────────────────────────────
export const externalEventsAPI = {
  getAll:   (params) => api.get('/events/external', { params }),
  getMap:   (params) => api.get('/events/external/map', { params }),
  getById:  (id)     => api.get(`/events/external/${id}`),
  trackClick:(id)    => api.post(`/events/external/${id}/click`),
  // Admin only
  create:   (data)   => api.post('/events/external', data),
  update:   (id, data) => api.patch(`/events/external/${id}`, data),
  delete:   (id)     => api.delete(`/events/external/${id}`),
  analytics:()       => api.get('/admin/external-events/analytics'),
};

// Re-export getExternal on eventsAPI for backward compat with Discover.js
eventsAPI.getExternal = (params) => externalEventsAPI.getAll(params);

// ── DJs ───────────────────────────────────────────────────────────────────────
export const djsAPI = {
  getAll: (params) => api.get('/djs', { params }),
  getBySlug: (slug) => api.get(`/djs/${slug}`),
  getMe: () => api.get('/djs/me'),
  create: (data) => api.post('/djs', data),
  update: (data) => api.patch('/djs/me', data),
  updateTheme: (data) => api.patch('/djs/me/theme', data),
  addWidget: (data) => api.post('/djs/me/widgets', data),
  removeWidget: (id) => api.delete(`/djs/me/widgets/${id}`),
  uploadPhoto: (formData) => api.post('/djs/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadBanner: (formData) => api.post('/djs/me/banner', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadLogo: (formData) => api.post('/djs/me/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadGallery: (formData) => api.post('/djs/me/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ── Tickets ───────────────────────────────────────────────────────────────────
export const ticketsAPI = {
  checkout: (data) => api.post('/tickets/checkout', data),
  getMy: () => api.get('/tickets/my'),
  getOne: (ticketNumber) => api.get(`/tickets/${ticketNumber}`),
  checkIn: (ticketNumber) => api.post(`/tickets/${ticketNumber}/check-in`),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  getDJ: () => api.get('/bookings/dj'),
  respond: (ref, data) => api.patch(`/bookings/${ref}/respond`, data),
  sendMessage: (ref, content) => api.post(`/bookings/${ref}/message`, { content }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  organizer: (params) => api.get('/analytics/organizer', { params }),
  event: (eventId) => api.get(`/analytics/event/${eventId}`),
};

export default api;
