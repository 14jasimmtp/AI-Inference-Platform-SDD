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

// Automatically handle expired tokens / 401 errors by logging the user out instantly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

// Auth endpoints
export const authApi = {
  register: (email: string, full_name: string, password: string) =>
    api.post('/api/v1/auth/register', { email, full_name, password }),
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  me: () => api.get('/api/v1/auth/me'),
  rateLimit: (testRpm?: number) => {
    const headers = testRpm ? { 'x-test-rate-limit-rpm': String(testRpm) } : undefined
    return api.get('/api/v1/auth/rate-limit', { headers })
  },
  
  // Feature Phase 3 Extensions
  checkAccess: (email: string) =>
    api.post('/api/v1/auth/access', { email }),
  registerLoginUnified: (email: string, password: string, full_name?: string) =>
    api.post('/api/v1/auth/register-login', { email, password, full_name }),
  verifyEmail: (token: string) =>
    api.get(`/api/v1/auth/verify?token=${token}`),
  forgotPassword: (email: string) =>
    api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post('/api/v1/auth/reset-password', { token, new_password }),
  googleSsoCallback: (mock_google_token?: string, credential_token?: string, email?: string, full_name?: string) =>
    api.post('/api/v1/auth/sso/google/callback', { mock_google_token, credential_token, email, full_name }),
}

// API Keys endpoints
export const apiKeysApi = {
  list: () => api.get('/api/v1/api-keys'),
  create: (name: string, rate_limit_rpm = 60) =>
    api.post('/api/v1/api-keys', { name, rate_limit_rpm }),
  revoke: (keyId: string) => api.delete(`/api/v1/api-keys/${keyId}`),
}
