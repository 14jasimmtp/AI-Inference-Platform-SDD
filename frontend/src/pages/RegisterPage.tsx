import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await register(email, fullName, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (_) { /* error handled in store */ }
  }

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
        maxWidth: '440px',
        background: 'var(--color-bg-card)',
        border: `1px solid var(--color-border-subtle)`,
        borderRadius: 'var(--border-radius-card)',
        padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
        transition: 'var(--transition-smooth)'
      }}>
        {/* Logo and Headings */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 className="claude-serif-title" style={{ fontSize: '28px', color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>
            Create Account
          </h1>
          <p className="claude-sans-control" style={{ color: 'var(--color-text-secondary)', margin: 0, fontWeight: 400 }}>
            Join the AI Inference Platform
          </p>
        </div>

        {error && (
          <div className="claude-sans-control" style={{
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
            <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        )}

        {success && (
          <div className="claude-sans-control" style={{
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
            Account created! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="claude-sans-control" htmlFor="full-name" style={{ color: 'var(--color-text-primary)' }}>Full Name</label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="claude-sans-control claude-focus-ring"
              required
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                color: 'var(--color-text-primary)',
                boxSizing: 'border-box',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="claude-sans-control" htmlFor="reg-email" style={{ color: 'var(--color-text-primary)' }}>Email address</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="claude-sans-control claude-focus-ring"
              required
              autoComplete="email"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                color: 'var(--color-text-primary)',
                boxSizing: 'border-box',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="claude-sans-control" htmlFor="reg-password" style={{ color: 'var(--color-text-primary)' }}>Password</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="claude-sans-control claude-focus-ring"
              required
              minLength={8}
              autoComplete="new-password"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                color: 'var(--color-text-primary)',
                boxSizing: 'border-box',
                width: '100%',
              }}
            />
          </div>

          <button
            id="register-btn"
            type="submit"
            disabled={isLoading || success}
            className="claude-sans-control"
            style={{
              width: '100%',
              marginTop: '10px',
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
              opacity: (isLoading || success) ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !success) {
                e.currentTarget.style.transform = 'scale(1.01)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && !success) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p className="claude-sans-control" style={{ color: 'var(--color-text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent-amber)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
