import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { GoogleSsoButton } from '../components/GoogleSsoButton'

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
        localStorage.setItem('user', JSON.stringify(user))
        
        // Update Zustand auth store state
        useAuthStore.setState({ user, token: access_token, isAuthenticated: true })
        navigate('/chat')
      } else {
        // Registration unverified flow triggered
        setSuccessMsg('Account created! A secure verification link has been sent to your email. Check your inbox (Mailpit sandbox) to activate your account.')
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
      setSuccessMsg('If the email is registered, a password recovery link has been sent to your inbox (Mailpit sandbox).')
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

              // Store session keys
              localStorage.setItem('access_token', access_token)
              localStorage.setItem('user', JSON.stringify(user))

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
      // Fallback to our gorgeous offline Mock SSO Page
      window.location.href = '/mock-google-login'
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1a202c, #0d1117)',
      fontFamily: 'Inter, sans-serif',
      color: '#f7fafc',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(22, 27, 34, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
        boxSizing: 'border-box'
      }}>
        {/* Logo and Headings */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '12px',
            display: 'inline-block'
          }}>⚡</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f7fafc', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            AI Inference Platform
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Unified authentication portal
          </p>
        </div>

        {/* Message Alerts */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#f87171',
            padding: '12px 16px',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box'
          }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            color: '#34d399',
            padding: '14px 18px',
            fontSize: '13px',
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
          {step === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@acme.com"
                style={{
                  background: '#161b22',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  color: '#f3f4f6',
                  outline: 'none',
                  boxSizing: 'border-box',
                  width: '100%',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          )}

          {step === 'password-signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: '#60a5fa', background: 'rgba(96, 165, 250, 0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(96, 165, 250, 0.15)', boxSizing: 'border-box' }}>
                Email not registered. Proceed to set up a new account.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Muhamed Jasim"
                  style={{
                    background: '#161b22',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '14px',
                    color: '#f3f4f6',
                    outline: 'none',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>Choose Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  style={{
                    background: '#161b22',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '14px',
                    color: '#f3f4f6',
                    outline: 'none',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          )}

          {step === 'password-login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: '#34d399', background: 'rgba(52, 211, 153, 0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.15)', boxSizing: 'border-box' }}>
                Welcome back! Please enter your password.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>Password</label>
                  <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    background: '#161b22',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '14px',
                    color: '#f3f4f6',
                    outline: 'none',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            {step !== 'email' && (
              <button
                type="button"
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
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  fontWeight: 500,
                  fontSize: '14px',
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
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: '#3b82f6',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              {loading ? 'Processing...' : step === 'email' ? 'Continue' : step === 'password-login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Divider */}
        {step === 'email' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
            </div>

            {/* Google SSO Brand Button */}
            <GoogleSsoButton onClick={handleGoogleSso} disabled={loading} />
          </>
        )}
      </div>
    </div>
  )
}
