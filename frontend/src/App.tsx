import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './features/auth/pages/LoginPage'
import { ChatPage } from './features/chat/pages/ChatPage'
import { AdminPage } from './features/admin/pages/AdminPage'
import { MockGoogleConsent } from './features/auth/components/MockGoogleConsent'
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage'
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const App: React.FC = () => {
  const { isAuthenticated, refreshUser } = useAuthStore()

  React.useEffect(() => {
    if (isAuthenticated) {
      refreshUser()
    }
  }, [isAuthenticated, refreshUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        {import.meta.env.DEV && (
          <Route path="/mock-google-login" element={<MockGoogleConsent />} />
        )}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
