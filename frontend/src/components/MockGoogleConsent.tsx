import React, { useState } from 'react'
import { authApi } from '../api/auth'

export const MockGoogleConsent: React.FC = () => {
  const [email, setEmail] = useState('jasim@acme.com')
  const [fullName, setFullName] = useState('Muhamed Jasim')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleProfileSelect = (pEmail: string, pName: string) => {
    setEmail(pEmail)
    setFullName(pName)
  }

  const handleApprove = async () => {
    setLoading(true)
    setError('')
    try {
      const mockToken = `mock-google-sub-${email.replace(/[^a-zA-Z0-9]/g, '')}`
      const res = await authApi.googleSsoCallback(mockToken, email, fullName)
      
      const { access_token, user } = res.data.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Redirect to dashboard
      window.location.href = '/'
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Simulated SSO Authorization failed.')
    } finally {
      setLoading(false)
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
        maxWidth: '480px',
        background: 'rgba(22, 27, 34, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* Google Mock Brand */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.75-.63-1.34-1.44-1.85-2.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px', color: '#e2e8f0' }}>Google Sign In</span>
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#f7fafc', marginBottom: '8px', marginTop: 0 }}>
          Select a Mock Developer Profile
        </h3>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px', marginTop: 0 }}>
          Simulating official Google OAuth Consent Gateway locally.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#f87171',
            padding: '10px 14px',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {/* Profiles Carousel / List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {[
            { email: 'jasim@acme.com', name: 'Muhamed Jasim', role: 'Org Admin' },
            { email: 'developer@acme.com', name: 'Dev User', role: 'Developer' },
            { email: 'guest@acme.com', name: 'Guest User', role: 'Guest' },
          ].map((profile) => (
            <button
              key={profile.email}
              onClick={() => handleProfileSelect(profile.email, profile.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '10px',
                background: email === profile.email ? 'rgba(66, 133, 244, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: email === profile.email ? '1px solid #4285f4' : '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (email !== profile.email) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
              onMouseLeave={(e) => {
                if (email !== profile.email) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: '#f3f4f6', fontSize: '14px' }}>{profile.name}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{profile.email}</div>
              </div>
              <span style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1'
              }}>{profile.role}</span>
            </button>
          ))}
        </div>

        {/* Custom Identity Inputs */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', marginBottom: '24px', textAlign: 'left' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Or enter custom identity</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                background: '#161b22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
                color: '#f3f4f6',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: '#161b22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
                color: '#f3f4f6',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Consent Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => window.location.href = '/auth'}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontWeight: 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              background: '#4285f4',
              border: 'none',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#357ae8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#4285f4'}
          >
            {loading ? 'Authorizing...' : 'Approve & Sign In'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center', marginTop: '24px', fontSize: '11px', color: '#4b5563' }}>
          <span>Secure Sandbox</span>
          <span>•</span>
          <span>Offline Identity Portal</span>
        </div>
      </div>
    </div>
  )
}
