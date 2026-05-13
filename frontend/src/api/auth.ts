import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth endpoints
export const authApi = {
  register: (email: string, full_name: string, password: string) =>
    api.post('/api/v1/auth/register', { email, full_name, password }),
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  me: () => api.get('/api/v1/auth/me'),
}

// API Keys endpoints
export const apiKeysApi = {
  list: () => api.get('/api/v1/api-keys'),
  create: (name: string, rate_limit_rpm = 60) =>
    api.post('/api/v1/api-keys', { name, rate_limit_rpm }),
  revoke: (keyId: string) => api.delete(`/api/v1/api-keys/${keyId}`),
}
