import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Password recovery token is missing.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Password update failed. The token may be expired or already used.')
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
        textAlign: success ? 'center' : 'left',
        transition: 'var(--transition-smooth)'
      }}>
        {success ? (
          <div>
            <div style={{
              fontSize: '48px',
              color: '#10b981',
              marginBottom: '20px',
              textAlign: 'center'
            }}>✓</div>
            <h3 className="claude-serif-title" style={{ fontSize: '24px', color: 'var(--color-text-primary)', margin: '0 0 12px 0', textAlign: 'center' }}>
              Password Reset Complete
            </h3>
            <p className="claude-sans-control" style={{ color: '#10b981', margin: '0 0 24px 0', textAlign: 'center' }}>
              Your credentials have been updated successfully.
            </p>
            <p className="claude-sans-control" style={{ color: 'var(--color-text-secondary)', margin: 0, textAlign: 'center' }}>
              Redirecting you to the login screen...
            </p>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div style={{
                fontSize: '32px',
                marginBottom: '12px',
                display: 'inline-block'
              }}>🔒</div>
              <h1 className="claude-serif-title" style={{ fontSize: '28px', color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>
                Reset Your Password
              </h1>
              <p className="claude-sans-control" style={{ color: 'var(--color-text-secondary)', margin: 0, fontWeight: 400 }}>
                Please specify a new secure password
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
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="claude-sans-control" style={{ color: 'var(--color-text-primary)' }}>New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="claude-sans-control claude-focus-ring"
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
                <label className="claude-sans-control" style={{ color: 'var(--color-text-primary)' }}>Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="claude-sans-control claude-focus-ring"
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
                type="submit"
                disabled={loading}
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
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
