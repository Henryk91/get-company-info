import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// In production (Docker), use relative URLs since FastAPI serves both frontend and API
// In development, use the full URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:8000');

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email?: string;
  username: string;
  password: string;
}

export interface Place {
  id: number;
  place_id: string;
  name: string;
  address?: string;
  city?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  user_ratings_total?: number;
  phone_number?: string;
  website?: string;
  business_status?: string;
  types?: string;
  formatted_address?: string;
  international_phone_number?: string;
  opening_hours?: string;
  price_level?: number;
  description?: string;
  photo_reference?: string;
  photo_url?: string;
  email?: string;
  owner?: string;
  postal_code?: string;
  province?: string;
  suburb?: string;
  service_type?: string;
  has_details: boolean;
  search_query_id: number;
  created_at: string;
  updated_at?: string;
}

export interface SearchQuery {
  id: number;
  city: string;
  category: string;
  user_id: number;
  created_at: string;
  updated_at?: string;
  places: Place[];
}

export interface SearchRequest {
  city: string;
  category: string;
  max_details?: number | null;
}

export interface RefreshRequest {
  search_query_id: number;
  refresh_text_search: boolean;
  refresh_details: boolean;
  max_details?: number | null;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
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
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: UserCreate) => api.post<User>('/api/auth/register', data),
  login: (data: LoginData) => {
    const formData = new FormData();
    formData.append('email', data.username);
    formData.append('username', data.username);
    formData.append('password', data.password);
    return api.post<Token>('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMe: () => api.get<User>('/api/auth/me'),
};

export const placesAPI = {
  search: (data: SearchRequest) => api.post<SearchQuery>('/api/places/search', data),
  getQueries: () => api.get<SearchQuery[]>('/api/places/queries'),
  getQuery: (id: number) => api.get<SearchQuery>(`/api/places/queries/${id}`),
  getPlaces: (queryId: number) => api.get<Place[]>(`/api/places/queries/${queryId}/places`),
  refresh: (data: RefreshRequest) => api.post<SearchQuery>('/api/places/refresh', data),
};

export default api;
