import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { useTheme } from '../../../hooks/useTheme'
import { ArrowLeft } from 'lucide-react'
import { OrgsTab } from '../components/OrgsTab'
import { UsersTab } from '../components/UsersTab'
import { ApiKeysTab } from '../components/ApiKeysTab'
import { LimitsTab } from '../components/LimitsTab'

export const AdminPage: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'orgs' | 'users' | 'keys' | 'limits'>('limits')
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  const roleHierarchy = {
    super_admin: 4,
    org_admin: 3,
    team_lead: 2,
    user: 1
  }

  const userLevel = roleHierarchy[(user?.role as keyof typeof roleHierarchy)] || 1



  return (
    <div className="claude-sans-control" style={{
      minHeight: '100vh',
      background: 'var(--color-bg-canvas)',
      color: 'var(--color-text-primary)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'var(--transition-smooth)'
    }}>
      {/* Header */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--color-bg-card)',
        transition: 'var(--transition-smooth)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/chat')}
            className="claude-focus-ring"
            style={{
              padding: '8px', background: 'transparent', border: '1px solid transparent', borderRadius: '50%',
              cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'var(--transition-smooth)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-accent-amber-glow)'
              e.currentTarget.style.color = 'var(--color-accent-amber)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="claude-serif-title" style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
            {userLevel >= 4 ? 'Admin Console' : 'Workspace Settings'}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace', marginLeft: '8px' }}>v1.1-secure</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.full_name}</span> ({user?.role})
          </div>

          <button
            onClick={toggleTheme}
            className="claude-focus-ring"
            style={{
              padding: '8px', border: '1px solid var(--color-border-subtle)', background: 'transparent', cursor: 'pointer',
              color: 'var(--color-text-secondary)', borderRadius: '8px', transition: 'var(--transition-smooth)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-text-primary)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <button
            onClick={logout}
            className="claude-focus-ring"
            style={{
              padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500,
              cursor: 'pointer', transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '260px', borderRight: '1px solid var(--color-border-subtle)', padding: '24px 16px',
          display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--color-bg-canvas)'
        }}>
          <button
            onClick={() => setActiveTab('orgs')}
            className="claude-focus-ring"
            style={{
              width: '100%', textAlign: 'left', padding: '10px 16px', borderRadius: '8px',
              fontSize: '0.9rem', fontWeight: activeTab === 'orgs' ? 600 : 500,
              background: activeTab === 'orgs' ? 'var(--color-accent-amber-glow)' : 'transparent',
              color: activeTab === 'orgs' ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'orgs') {
                e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'orgs') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }
            }}
          >
            {userLevel >= 4 ? 'Organizations' : 'My Organization'}
          </button>
          {userLevel >= 2 && (
            <button
              onClick={() => setActiveTab('users')}
              className="claude-focus-ring"
              style={{
                width: '100%', textAlign: 'left', padding: '10px 16px', borderRadius: '8px',
                fontSize: '0.9rem', fontWeight: activeTab === 'users' ? 600 : 500,
                background: activeTab === 'users' ? 'var(--color-accent-amber-glow)' : 'transparent',
                color: activeTab === 'users' ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
                border: 'none', cursor: 'pointer', transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'users') {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
                  e.currentTarget.style.color = 'var(--color-text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'users') {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
                }
              }}
            >
              Users & Roles
            </button>
          )}
          <button
            onClick={() => setActiveTab('keys')}
            className="claude-focus-ring"
            style={{
              width: '100%', textAlign: 'left', padding: '10px 16px', borderRadius: '8px',
              fontSize: '0.9rem', fontWeight: activeTab === 'keys' ? 600 : 500,
              background: activeTab === 'keys' ? 'var(--color-accent-amber-glow)' : 'transparent',
              color: activeTab === 'keys' ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'keys') {
                e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'keys') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }
            }}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className="claude-focus-ring"
            style={{
              width: '100%', textAlign: 'left', padding: '10px 16px', borderRadius: '8px',
              fontSize: '0.9rem', fontWeight: activeTab === 'limits' ? 600 : 500,
              background: activeTab === 'limits' ? 'var(--color-accent-amber-glow)' : 'transparent',
              color: activeTab === 'limits' ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'limits') {
                e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'limits') {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }
            }}
          >
            Usage & Rate Limits
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {activeTab === 'orgs' && <OrgsTab userLevel={userLevel} setActiveTab={setActiveTab} onSelect={(id) => { setSelectedOrgId(id); setActiveTab('users'); }} />}
            {activeTab === 'users' && userLevel >= 2 && <UsersTab userOrgId={selectedOrgId || user?.org_id || ''} userLevel={userLevel} />}
            {activeTab === 'keys' && <ApiKeysTab />}
            {activeTab === 'limits' && <LimitsTab userOrgId={selectedOrgId || user?.org_id || ''} userLevel={userLevel} />}
          </div>
        </div>
      </div>
    </div>
  )
}
