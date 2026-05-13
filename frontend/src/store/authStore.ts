import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, fullName: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await authApi.login(email, password)
          const { data: payload } = res.data
          const token = payload.access_token
          localStorage.setItem('access_token', token)
          set({ user: payload.user, token, isAuthenticated: true, isLoading: false })
        } catch (e: unknown) {
          const msg = (e as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message || 'Login failed'
          set({ error: msg, isLoading: false })
          throw e
        }
      },

      register: async (email, fullName, password) => {
        set({ isLoading: true, error: null })
        try {
          await authApi.register(email, fullName, password)
          set({ isLoading: false })
        } catch (e: unknown) {
          const msg = (e as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message || 'Registration failed'
          set({ error: msg, isLoading: false })
          throw e
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
