import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../api/auth'
import { useAuthStore } from '../../../store/authStore'
import { GoogleSsoButton } from '../components/GoogleSsoButton'
import { EmailStep } from '../components/EmailStep'
import { PasswordLoginStep } from '../components/PasswordLoginStep'
import { PasswordSignupStep } from '../components/PasswordSignupStep'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()

  // Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  // UI Flow States
  const [step, setStep] = useState<'email' | 'password-login' | 'password-signup'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await authApi.checkAccess(email)
      const { exists } = res.data.data
      if (exists) {
        setStep('password-login')
      } else {
        setStep('password-signup')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Access lookup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await authApi.registerLoginUnified(email, password, fullName || undefined)
      const payload = res.data.data

      if (payload.action === 'login') {
        const { access_token, user } = payload
        localStorage.setItem('access_token', access_token)

        // Update Zustand auth store state
        useAuthStore.setState({ user, token: access_token, isAuthenticated: true })
        navigate('/chat')
      } else {
        // Registration unverified flow triggered
        setSuccessMsg('Account created! A secure verification link has been sent to your email. Check your inbox to activate your account.')
        setStep('email')
        setEmail('')
        setPassword('')
        setFullName('')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please input your email address first.')
      return
    }
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await authApi.forgotPassword(email)
      setSuccessMsg('If the email is registered, a password recovery link has been sent to your inbox.')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to request recovery.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSso = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const gWindow = window as any

    if (clientId && gWindow.google) {
      setError('')
      setSuccessMsg('')
      try {
        gWindow.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            setLoading(true)
            setError('')
            setSuccessMsg('')
            try {
              const res = await authApi.googleSsoCallback(undefined, response.credential)
              const { access_token, user } = res.data.data
              localStorage.setItem('access_token', access_token)

              // Set Zustand store session
              useAuthStore.setState({ user, token: access_token, isAuthenticated: true })

              setSuccessMsg('Signed in successfully!')
              setTimeout(() => {
                navigate('/chat')
              }, 1500)
            } catch (err: any) {
              setError(err.response?.data?.error?.message || 'Google authentication failed.')
            } finally {
              setLoading(false)
            }
          }
        })
        gWindow.google.accounts.id.prompt()
      } catch (err: any) {
        setError('Failed to initialize Google Sign-In prompt.')
      }
    } else {
      // Fallback to our offline Mock SSO Page
      window.location.href = '/mock-google-login'
    }
  }

  return (
    <div className="warm-app-shell" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="warm-surface-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px 36px',
        boxSizing: 'border-box'
      }}>
        {/* Logo and Headings */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 className="claude-serif-title" style={{ fontSize: '28px', color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>
            AI Inference Platform
          </h1>
          <p className="claude-sans-control" style={{ color: 'var(--color-text-secondary)', margin: 0, fontWeight: 400 }}>
            Sign in or create an account
          </p>
        </div>

        {/* Message Alerts */}
        {error && (
          <div className="claude-sans-control warm-status-note error" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#ef4444',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box'
          }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>x</button>
          </div>
        )}

        {successMsg && (
          <div className="claude-sans-control warm-status-note success" style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            color: '#10b981',
            padding: '14px 18px',
            lineHeight: '1.5',
            marginBottom: '24px',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}>
            {successMsg}
          </div>
        )}

        {/* Dynamic Form Wizard */}
        <form onSubmit={step === 'email' ? handleEmailSubmit : handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {step === 'email' && <EmailStep email={email} setEmail={setEmail} />}
          {step === 'password-signup' && <PasswordSignupStep fullName={fullName} setFullName={setFullName} password={password} setPassword={setPassword} />}
          {step === 'password-login' && <PasswordLoginStep password={password} setPassword={setPassword} handleForgotPassword={handleForgotPassword} />}

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            {step !== 'email' && (
              <button
                type="button"
                className="claude-sans-control warm-secondary-button"
                onClick={() => {
                  setStep('email')
                  setPassword('')
                  setFullName('')
                  setError('')
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="claude-sans-control warm-primary-button"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--color-text-primary)',
                border: 'none',
                color: 'var(--color-bg-canvas)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {loading ? 'Processing...' : step === 'email' ? 'Continue' : 'Continue'}
            </button>
          </div>
        </form>

        {/* Divider */}
        {step === 'email' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border-subtle)' }}></div>
              <span className="claude-sans-control" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border-subtle)' }}></div>
            </div>

            {/* Google SSO Brand Button */}
            <GoogleSsoButton onClick={handleGoogleSso} disabled={loading} />
          </>
        )}
      </div>
    </div>
  )
}
