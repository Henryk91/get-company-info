import axios from 'axios';

// In production (Docker), use relative URLs since FastAPI serves both frontend and API
// In development, use the full URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMe: () => api.get('/api/auth/me'),
};

export const placesAPI = {
  search: (data) => api.post('/api/places/search', data),
  getQueries: () => api.get('/api/places/queries'),
  getQuery: (id) => api.get(`/api/places/queries/${id}`),
  getPlaces: (queryId) => api.get(`/api/places/queries/${queryId}/places`),
  refresh: (data) => api.post('/api/places/refresh', data),
};

export default api;

