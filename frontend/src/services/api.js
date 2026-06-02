import axios from 'axios';

const api = axios.create({
  // In development the Vite proxy forwards /api → http://localhost:5000/api,
  // so a relative URL works and avoids any CORS preflight.
  // In production set VITE_API_URL to the deployed backend base URL.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Attach access token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      queue.forEach((p) => p.resolve(data.access_token));
      queue = [];

      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original);
    } catch (refreshErr) {
      queue.forEach((p) => p.reject(refreshErr));
      queue = [];
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export const authApi = {
  register:       (data) => api.post('/auth/register', data),
  verifyEmail:    (data) => api.post('/auth/verify-email', data),
  resendCode:     (data) => api.post('/auth/resend-code', data),
  login:          (data) => api.post('/auth/login', data),
  adminLogin:     (data) => api.post('/auth/admin/login', data),
  logout:         (data) => api.post('/auth/logout', data),
  refresh:        (data) => api.post('/auth/refresh', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
  me:             ()     => api.get('/auth/me'),
};

export default api;
