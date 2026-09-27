import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const session = localStorage.getItem('ims_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.access_token) {
          config.headers.Authorization = `Bearer ${parsed.access_token}`;
        }
      } catch { /* invalid session */ }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ims_session');
      localStorage.removeItem('ims_user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
