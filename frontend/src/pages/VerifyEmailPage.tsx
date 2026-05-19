import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const verificationStarted = React.useRef(false)

  useEffect(() => {
    if (verificationStarted.current) return
    verificationStarted.current = true

    const executeVerification = async () => {
      if (!token) {
        setStatus('error')
        setErrorMsg('Verification token is missing.')
        return
      }

      try {
        const res = await authApi.verifyEmail(token)
        const { access_token, user } = res.data.data

        // Store session keys
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        // Set Zustand store session
        useAuthStore.setState({ user, token: access_token, isAuthenticated: true })

        setStatus('success')
        
        // Auto-redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/chat')
        }, 2000)
      } catch (err: any) {
        setStatus('error')
        setErrorMsg(err.response?.data?.error?.message || 'Verification failed. The token may be expired or already used.')
      }
    }

    executeVerification()
  }, [token, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-canvas)',
      color: 'var(--color-text-primary)',
      padding: '20px',
      boxSizing: 'border-box',
      transition: 'var(--transition-smooth)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'var(--color-bg-card)',
        border: `1px solid var(--color-border-subtle)`,
        borderRadius: 'var(--border-radius-card)',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
        textAlign: 'center',
        boxSizing: 'border-box',
        transition: 'var(--transition-smooth)'
      }}>
        {status === 'verifying' && (
          <div>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid var(--color-border-subtle)',
              borderTop: '3px solid var(--color-accent-amber)',
              borderRadius: '50%',
              margin: '0 auto 24px auto',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h3 className="claude-serif-title" style={{ fontSize: '24px', color: 'var(--color-text-primary)', margin: '0 0 10px 0' }}>
              Verifying Your Account
            </h3>
            <p className="claude-sans-control" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Checking secure token credentials. Please hold...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              fontSize: '48px',
              color: '#10b981',
              marginBottom: '20px'
            }}>✓</div>
            <h3 className="claude-serif-title" style={{ fontSize: '24px', color: 'var(--color-text-primary)', margin: '0 0 10px 0' }}>
              Account Verified!
            </h3>
            <p className="claude-sans-control" style={{ color: '#10b981', margin: '0 0 24px 0' }}>
              Log in session established successfully.
            </p>
            <p className="claude-sans-control" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Redirecting you to your chat workspace...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              fontSize: '48px',
              color: '#ef4444',
              marginBottom: '20px'
            }}>⚠</div>
            <h3 className="claude-serif-title" style={{ fontSize: '24px', color: 'var(--color-text-primary)', margin: '0 0 12px 0' }}>
              Activation Failed
            </h3>
            <div className="claude-sans-control" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#ef4444',
              padding: '12px 16px',
              lineHeight: '1.5',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              {errorMsg}
            </div>
            <button
              className="claude-sans-control"
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--color-text-primary)',
                border: 'none',
                color: 'var(--color-bg-canvas)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.01)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
