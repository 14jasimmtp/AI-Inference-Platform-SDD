import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import { orgsApi, usersApi, apiKeysAdminApi } from '../api/admin'
import { authApi } from '../api/auth'
import { ArrowLeft, Plus, Trash2, RefreshCw, Shield, Zap, Info, Sliders, Database, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

// Basic layout for Admin
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

  useEffect(() => {
    if (userLevel < 4 && activeTab === 'keys') setActiveTab('limits')
  }, [userLevel])

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
            {activeTab === 'limits' && <LimitsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable styling components for admin sections
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="claude-serif-title" style={{ fontSize: '1.75rem', color: 'var(--color-text-primary)', marginBottom: '24px' }}>
    {children}
  </h2>
)

const Card = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ 
    background: 'var(--color-bg-card)', 
    border: '1px solid var(--color-border-subtle)', 
    borderRadius: '16px', 
    padding: '24px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
    transition: 'var(--transition-smooth)',
    ...style 
  }}>
    {children}
  </div>
)

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`claude-focus-ring ${props.className || ''}`}
    style={{ 
      width: '100%', 
      background: 'var(--color-bg-canvas)', 
      border: '1px solid var(--color-border-subtle)', 
      borderRadius: '8px', 
      padding: '10px 14px', 
      color: 'var(--color-text-primary)', 
      fontSize: '0.9rem',
      transition: 'var(--transition-smooth)',
      ...props.style
    }} 
  />
)

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select 
    {...props} 
    className={`claude-focus-ring ${props.className || ''}`}
    style={{ 
      background: 'var(--color-bg-canvas)', 
      border: '1px solid var(--color-border-subtle)', 
      borderRadius: '8px', 
      padding: '10px 14px', 
      color: 'var(--color-text-primary)', 
      fontSize: '0.9rem',
      transition: 'var(--transition-smooth)',
      ...props.style
    }} 
  />
)

const PrimaryButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    {...props} 
    className={`claude-focus-ring ${props.className || ''}`}
    style={{ 
      background: 'var(--color-accent-amber)', 
      color: '#fff', 
      border: 'none', 
      borderRadius: '8px', 
      padding: '10px 20px', 
      fontWeight: 600, 
      fontSize: '0.9rem',
      cursor: 'pointer', 
      transition: 'var(--transition-smooth)',
      display: 'flex', alignItems: 'center', gap: '8px',
      ...props.style
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = '#B45309'
      e.currentTarget.style.transform = 'translateY(-1px)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'var(--color-accent-amber)'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
  >
    {children}
  </button>
)

// Organizations Tab
const OrgsTab = ({ onSelect, userLevel, setActiveTab }: { onSelect: (id: string) => void, userLevel: number, setActiveTab: (tab: any) => void }) => {
  const { user, refreshUser } = useAuthStore()
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')

  const fetchOrgs = async () => {
    try {
      const res = await orgsApi.list()
      setOrgs(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgs()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await orgsApi.create(newOrgName, newOrgSlug)
      setNewOrgName('')
      setNewOrgSlug('')
      
      // Backend now handles auto-joining for new org creators
      await refreshUser()
      fetchOrgs()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error creating org"
      alert(msg)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <div style={{ width: '30px', height: '30px', border: '3px solid var(--color-border-subtle)', borderTopColor: 'var(--color-accent-amber)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const myOrg = orgs.find(o => o.org_id === user?.org_id)

  if (userLevel < 4 && !user?.org_id) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 className="claude-serif-title" style={{ fontSize: '2rem', marginBottom: '12px' }}>Get Started</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>You are not currently in an organization. Create your own to start working with others and managing API keys.</p>
        </div>
        
        <Card style={{ padding: '40px' }}>
          <h3 className="claude-serif-title" style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Create Your Organization</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Organization Name</label>
              <Input
                type="text"
                placeholder="e.g. My Awesome Team"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>URL Slug</label>
              <Input
                type="text"
                placeholder="e.g. my-team"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                required
                pattern="[a-z0-9-]+"
              />
            </div>
            <PrimaryButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '14px' }}>
              <Plus size={20} /> Create Organization
            </PrimaryButton>
          </form>
        </Card>
      </div>
    )
  }

  if (userLevel < 4 && myOrg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <SectionTitle>My Organization</SectionTitle>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '-16px' }}>Manage your workspace and team members.</p>
          </div>
          <div style={{ background: 'var(--color-accent-amber-glow)', border: '1px solid var(--color-accent-amber-glow)', padding: '6px 12px', borderRadius: '8px', color: 'var(--color-accent-amber)', fontSize: '0.85rem', fontWeight: 600 }}>
            Role: <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <Card>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Name</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{myOrg.name}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Slug</span>
                <span style={{ fontSize: '1rem', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{myOrg.slug}</span>
              </div>
            </div>
          </Card>
          
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--color-accent-amber-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-amber)', marginBottom: '16px' }}>
              <RefreshCw size={32} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Team Management</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Go to the Users & Roles tab to invite teammates to {myOrg.name}.</p>
            <PrimaryButton onClick={() => setActiveTab('users')}>
              Manage Users
            </PrimaryButton>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <SectionTitle>Organizations</SectionTitle>
      
      <Card>
        <h3 className="claude-serif-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Create New Organization</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Input
            type="text"
            placeholder="Name (e.g. Acme Corp)"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <Input
            type="text"
            placeholder="Slug (e.g. acme-corp)"
            value={newOrgSlug}
            onChange={(e) => setNewOrgSlug(e.target.value)}
            required
            pattern="[a-z0-9-]+"
            style={{ flex: 1 }}
          />
          <PrimaryButton type="submit">
            <Plus size={18} /> Create
          </PrimaryButton>
        </form>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Name</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Slug</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Created</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map(org => (
              <tr key={org.org_id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{org.name}</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{org.slug}</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{new Date(org.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button 
                      onClick={() => onSelect(org.org_id)}
                      className="claude-focus-ring"
                      style={{ padding: '6px 12px', background: 'var(--color-accent-amber-glow)', color: 'var(--color-accent-amber)', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(217, 119, 6, 0.25)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-accent-amber-glow)'}
                    >
                      Manage
                    </button>
                    {userLevel < 4 && (
                      <button 
                        onClick={async () => {
                          if (confirm(`Join ${org.name}?`)) {
                            try {
                              await usersApi.invite(org.org_id, user?.email || '', 'org_admin')
                              await refreshUser()
                              alert("Joined organization successfully!")
                            } catch (e) {
                              alert('Failed to join org')
                            }
                          }
                        }}
                        className="claude-focus-ring"
                        style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                      >
                        Join
                      </button>
                    )}
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure?')) {
                          try {
                            await orgsApi.delete(org.org_id)
                            fetchOrgs()
                          } catch (e) {
                            alert('Failed to delete org (does it have users?)')
                          }
                        }
                      }}
                      className="claude-focus-ring"
                      style={{ padding: '6px 10px', background: 'transparent', color: '#ef4444', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// Users Tab
const UsersTab = ({ userOrgId, userLevel }: { userOrgId: string, userLevel: number }) => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')

  const fetchUsers = async () => {
    if (!userOrgId) {
      setLoading(false)
      return
    }
    try {
      const res = await usersApi.list(userOrgId)
      setUsers(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [userOrgId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await usersApi.invite(userOrgId, email, role)
      setEmail('')
      fetchUsers()
    } catch (e) {
      alert("Error inviting user")
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <div style={{ width: '30px', height: '30px', border: '3px solid var(--color-border-subtle)', borderTopColor: 'var(--color-accent-amber)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!userOrgId) return (
    <div style={{ background: 'var(--color-accent-amber-glow)', border: '1px solid rgba(217,119,6,0.3)', padding: '24px', borderRadius: '16px', color: 'var(--color-accent-amber)' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Organization Selected</h2>
      <p style={{ color: 'var(--color-text-primary)', opacity: 0.8 }}>Please create or join an organization to manage users and roles.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <SectionTitle>Users & Roles</SectionTitle>
      
      {userLevel >= 3 && (
        <Card>
          <h3 className="claude-serif-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Invite User</h3>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="team_lead">Team Lead</option>
              <option value="org_admin">Org Admin</option>
            </Select>
            <PrimaryButton type="submit">
              <Plus size={18} /> Invite
            </PrimaryButton>
          </form>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Name</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Role</th>
              {userLevel >= 3 && <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{u.full_name}</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                    background: u.role === 'org_admin' ? 'rgba(139, 92, 246, 0.1)' : u.role === 'team_lead' ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-border-subtle)',
                    color: u.role === 'org_admin' ? '#8b5cf6' : u.role === 'team_lead' ? '#3b82f6' : 'var(--color-text-secondary)'
                  }}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                {userLevel >= 3 && (
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button 
                      onClick={async () => {
                        if (confirm('Remove user?')) {
                          try {
                            await usersApi.remove(userOrgId, u.user_id)
                            fetchUsers()
                          } catch (e) {
                            alert('Failed to remove user')
                          }
                        }
                      }}
                      className="claude-focus-ring"
                      style={{ padding: '8px', background: 'transparent', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      title="Remove User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// API Keys Tab
const ApiKeysTab = () => {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [newKeyData, setNewKeyData] = useState<{api_key: string, name: string} | null>(null)

  const fetchKeys = async () => {
    try {
      const res = await apiKeysAdminApi.list()
      setKeys(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await apiKeysAdminApi.create(name)
      setNewKeyData(res.data.data)
      setName('')
      fetchKeys()
    } catch (e) {
      alert("Error creating key")
    }
  }

  const handleRotate = async (keyId: string) => {
    if (!confirm('Rotate key? Old key will be invalidated instantly.')) return
    try {
      const res = await apiKeysAdminApi.rotate(keyId)
      setNewKeyData(res.data.data)
      fetchKeys()
    } catch (e) {
      alert("Error rotating key")
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <div style={{ width: '30px', height: '30px', border: '3px solid var(--color-border-subtle)', borderTopColor: 'var(--color-accent-amber)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <SectionTitle>API Keys</SectionTitle>
      
      {newKeyData && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ color: '#10b981', fontWeight: 600, marginBottom: '12px' }}>Save this key now! It will never be shown again.</h3>
          <div style={{ background: 'var(--color-bg-canvas)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all', userSelect: 'all', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-subtle)' }}>
            {newKeyData.api_key}
          </div>
          <button 
            onClick={() => setNewKeyData(null)} 
            className="claude-focus-ring"
            style={{ marginTop: '16px', background: 'transparent', border: 'none', fontSize: '0.85rem', color: '#10b981', cursor: 'pointer', fontWeight: 600 }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            I have saved it
          </button>
        </div>
      )}

      <Card>
        <h3 className="claude-serif-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Create New API Key</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Input
            type="text"
            placeholder="Key Name (e.g. Production Web)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <PrimaryButton type="submit">
            <Plus size={18} /> Generate Key
          </PrimaryButton>
        </form>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Name</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Prefix</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Created</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Last Used</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.key_id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{k.name}</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{k.prefix}...</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {new Date(k.created_at || new Date()).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <button 
                      onClick={() => handleRotate(k.key_id)}
                      className="claude-focus-ring"
                      style={{ padding: '8px', background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-canvas)'
                        e.currentTarget.style.color = 'var(--color-accent-amber)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--color-text-secondary)'
                      }}
                      title="Rotate Key"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('Revoke key?')) {
                          try {
                            await apiKeysAdminApi.revoke(k.key_id)
                            fetchKeys()
                          } catch (e) {
                            alert('Failed to revoke key')
                          }
                        }
                      }}
                      className="claude-focus-ring"
                      style={{ padding: '8px', background: 'transparent', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                      title="Revoke Key"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// Limits Tab showing visual remaining/total limit and Token Bucket simulator sandbox
const LimitsTab: React.FC = () => {
  const [limit, setLimit] = useState<number>(60)
  const [remaining, setRemaining] = useState<number>(60)
  const [reset, setReset] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [testRpm, setTestRpm] = useState<string>(() => {
    return localStorage.getItem('test_rate_limit_rpm') || 'default'
  })
  const [logs, setLogs] = useState<{ time: string; type: 'success' | 'error' | 'info'; message: string }[]>([])
  const [isTriggering, setIsTriggering] = useState<boolean>(false)

  const addLog = (type: 'success' | 'error' | 'info', message: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { time, type, message }])
  }

  const fetchRateLimit = async (rpmStr = testRpm, skipLoading = false) => {
    if (!skipLoading) setIsLoading(true)
    try {
      const rpmVal = rpmStr === 'default' ? undefined : Number(rpmStr)
      const res = await authApi.rateLimit(rpmVal)
      const data = res.data.data
      setLimit(data.limit)
      setRemaining(data.remaining)
      setReset(data.reset)
    } catch (err: any) {
      console.error("Error fetching rate limit status:", err)
      if (err.response && err.response.status === 429) {
        const retryAfter = err.response.data?.details?.retry_after || err.response.headers?.['retry-after'] || 10
        setRemaining(0)
        setReset(Number(retryAfter) || 10)
      }
    } finally {
      if (!skipLoading) setIsLoading(false)
    }
  }

  // Handle active simulation changes
  const handleTestRpmChange = (val: string) => {
    setTestRpm(val)
    localStorage.setItem('test_rate_limit_rpm', val)
    addLog('info', `Simulation changed to: ${val === 'default' ? 'Default (60 RPM)' : `${val} RPM`}`)
    fetchRateLimit(val)
  }

  // Trigger rapid consecutive calls to exhaust limit
  const triggerSimulation = async () => {
    if (isTriggering || reset > 0) return
    setIsTriggering(true)
    const rpmVal = testRpm === 'default' ? undefined : Number(testRpm)
    // Send enough requests to exhaust the bucket based on the active limit
    const numPings = testRpm === 'default' ? 12 : testRpm === '5' ? 8 : 4
    
    addLog('info', `Initiating ping flood (${numPings} sequential requests) to test limits...`)
    
    for (let i = 1; i <= numPings; i++) {
      try {
        const res = await authApi.rateLimit(rpmVal)
        const data = res.data.data
        setLimit(data.limit)
        setRemaining(data.remaining)
        setReset(data.reset)
        addLog('success', `Ping ${i}/${numPings}: 200 OK — Remaining capacity: ${data.remaining}/${data.limit}`)
      } catch (err: any) {
        if (err.response && err.response.status === 429) {
          const retryAfter = err.response.data?.details?.retry_after || err.response.headers?.['retry-after'] || '10'
          addLog('error', `Ping ${i}/${numPings}: 429 Too Many Requests — BLOCKED! Retry after ${retryAfter}s`)
          setRemaining(0)
          setReset(Number(retryAfter) || 10)
        } else {
          addLog('error', `Ping ${i}/${numPings} Failed: ${err.message || 'Unknown network error'}`)
        }
      }
      // Small 200ms visual delay between pings so the user can watch the bucket drain!
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    setIsTriggering(false)
  }

  // Initial load
  useEffect(() => {
    fetchRateLimit()
    addLog('info', `System initialized. Active rate-limit simulation set to: ${testRpm === 'default' ? 'Default (60 RPM)' : `${testRpm} RPM`}`)
  }, [])

  // Poll for live refilling status every 5 seconds (only when tab is active)
  useEffect(() => {
    const timer = setInterval(() => {
      // Don't poll while triggering ping flood
      if (!isTriggering) {
        fetchRateLimit(testRpm, true)
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [testRpm, isTriggering])

  // Count down local reset timer if blocked
  useEffect(() => {
    if (reset <= 0) return
    const timer = setInterval(() => {
      setReset(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          addLog('info', `Rate limiting block cleared. Bucket has begun refilling.`)
          fetchRateLimit(testRpm)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [reset])

  const percentage = Math.max(0, Math.min(100, (remaining / limit) * 100))
  const ratio = remaining / limit
  
  // Decide gauge color
  let progressColor = '#10b981' // Green
  let progressGlow = 'rgba(16, 185, 129, 0.15)'
  if (ratio < 0.2) {
    progressColor = '#ef4444' // Red
    progressGlow = 'rgba(239, 68, 68, 0.15)'
  } else if (ratio < 0.5) {
    progressColor = 'var(--color-accent-amber)' // Amber
    progressGlow = 'var(--color-accent-amber-glow)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeSlideUp 0.3s ease' }}>
      <div>
        <h2 className="claude-serif-title" style={{ fontSize: '1.75rem', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Usage &amp; Rate Limits
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Monitor, understand, and simulate API capacity throttling in real time using high-performance Redis Token Buckets.
        </p>
      </div>

      {/* Main Stats Card */}
      <Card style={{ position: 'relative', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
            <div style={{ width: '30px', height: '30px', border: '3px solid var(--color-border-subtle)', borderTopColor: 'var(--color-accent-amber)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header / Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} style={{ color: progressColor }} />
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Active Capacity Bucket</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: reset > 0 ? '#ef4444' : '#10b981', 
                  animation: reset > 0 ? 'pulse-red 1.5s infinite' : 'pulse-green 1.5s infinite' 
                }}></span>
                {reset > 0 ? `Rate Limited (Locked)` : `Active & Refilling`}
              </div>
            </div>

            {/* Huge Visual Progress Bar */}
            <div>
              <div style={{ 
                height: '24px', 
                background: 'var(--color-bg-canvas)', 
                borderRadius: '12px', 
                border: '1px solid var(--color-border-subtle)', 
                overflow: 'hidden', 
                position: 'relative',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.03)' 
              }}>
                <div style={{ 
                  width: `${percentage}%`, 
                  height: '100%', 
                  background: progressColor, 
                  boxShadow: `0 0 12px ${progressGlow}`,
                  transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                  borderRadius: '12px' 
                }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: progressColor }}>
                  {remaining} / {limit} tokens remaining
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Total Capacity: {limit} RPM
                </span>
              </div>
            </div>

            {/* Under-the-hood Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '8px' }}>
              
              <div style={{ background: 'var(--color-bg-canvas)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Clock size={14} /> Refill Mechanism
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  1 token every {(60 / limit).toFixed(1)}s
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Refills continuously in Redis on every incoming request. No discrete resets.
                </div>
              </div>

              <div style={{ background: 'var(--color-bg-canvas)', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Sliders size={14} /> Key Expiry TTL
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  120s inactivity
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Redis deletes the tracking key automatically after 2 minutes of idle time.
                </div>
              </div>

              <div style={{ 
                background: reset > 0 ? 'rgba(239, 68, 68, 0.04)' : 'rgba(16, 185, 129, 0.04)', 
                border: `1px solid ${reset > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, 
                borderRadius: '12px', 
                padding: '16px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: reset > 0 ? '#ef4444' : '#10b981', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {reset > 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />} 
                  System Status
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: reset > 0 ? '#ef4444' : '#10b981' }}>
                  {reset > 0 ? `Blocked for ${reset}s` : `Active (No Block)`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {reset > 0 ? `Fast API calls are temporarily blocked until bucket refilling resumes.` : `API requests are executing under simulated quota levels.`}
                </div>
              </div>

            </div>

          </div>
        )}
        <style>{`
          @keyframes pulse-green {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.3); opacity: 1; }
          }
          @keyframes pulse-red {
            0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 4px #ef4444; }
            50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 10px #ef4444; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Card>

      {/* Simulator Sandbox Card */}
      <Card style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Zap size={22} style={{ color: 'var(--color-accent-amber)' }} />
              <h3 className="claude-serif-title" style={{ fontSize: '1.4rem', color: 'var(--color-text-primary)' }}>
                Rate Limiting Simulation Sandbox
              </h3>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Select a sandboxed rate limit. These settings are applied dynamically via the secure header <code style={{ background: 'var(--color-bg-canvas)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border-subtle)', fontFamily: 'monospace' }}>x-test-rate-limit-rpm</code>. It isolates simulation calls into a test namespace so you don't block your regular chat history session!
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Selection Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              
              <div 
                onClick={() => handleTestRpmChange('default')}
                style={{ 
                  border: `2px solid ${testRpm === 'default' ? 'var(--color-accent-amber)' : 'var(--color-border-subtle)'}`,
                  background: testRpm === 'default' ? 'var(--color-accent-amber-glow)' : 'transparent',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { if (testRpm !== 'default') e.currentTarget.style.borderColor = 'var(--color-text-secondary)' }}
                onMouseLeave={(e) => { if (testRpm !== 'default') e.currentTarget.style.borderColor = 'var(--color-border-subtle)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Default (60 RPM)</span>
                  <input type="radio" checked={testRpm === 'default'} onChange={() => {}} style={{ accentColor: 'var(--color-accent-amber)' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Standard workspace rate limit. Good for heavy development and regular chat streams.
                </p>
              </div>

              <div 
                onClick={() => handleTestRpmChange('5')}
                style={{ 
                  border: `2px solid ${testRpm === '5' ? 'var(--color-accent-amber)' : 'var(--color-border-subtle)'}`,
                  background: testRpm === '5' ? 'var(--color-accent-amber-glow)' : 'transparent',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { if (testRpm !== '5') e.currentTarget.style.borderColor = 'var(--color-text-secondary)' }}
                onMouseLeave={(e) => { if (testRpm !== '5') e.currentTarget.style.borderColor = 'var(--color-border-subtle)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Simulated Low (5 RPM)</span>
                  <input type="radio" checked={testRpm === '5'} onChange={() => {}} style={{ accentColor: 'var(--color-accent-amber)' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Restricted plan simulation. Refills 1 token every 12 seconds. Easy to test rate locks!
                </p>
              </div>

              <div 
                onClick={() => handleTestRpmChange('1')}
                style={{ 
                  border: `2px solid ${testRpm === '1' ? 'var(--color-accent-amber)' : 'var(--color-border-subtle)'}`,
                  background: testRpm === '1' ? 'var(--color-accent-amber-glow)' : 'transparent',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { if (testRpm !== '1') e.currentTarget.style.borderColor = 'var(--color-text-secondary)' }}
                onMouseLeave={(e) => { if (testRpm !== '1') e.currentTarget.style.borderColor = 'var(--color-border-subtle)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Immediate Block (1 RPM)</span>
                  <input type="radio" checked={testRpm === '1'} onChange={() => {}} style={{ accentColor: 'var(--color-accent-amber)' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Ultra-strict throttling. Refills 1 token every 60 seconds. A single request triggers block.
                </p>
              </div>

            </div>

            {/* Action and Terminal Logs Split */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
              
              {/* Sandbox controls explainer */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Sandbox Flood Tester</div>
                  Use the trigger button to flood the rate-limiting endpoint. Watch how consecutive pings drain tokens down to 0, instantly transition to HTTP 429, and then capture the countdown time needed to regain clearance.
                  <div style={{ marginTop: '12px', padding: '12px', borderLeft: '3px solid var(--color-accent-amber)', background: 'var(--color-bg-canvas)', fontSize: '0.8rem' }}>
                    <strong>Note:</strong> While a test RPM is active, opening Chat and streaming completions will also use this sandboxed limit, letting you experience raw chat rate limiting first-hand!
                  </div>
                </div>

                <PrimaryButton 
                  onClick={triggerSimulation}
                  disabled={isTriggering || reset > 0}
                  style={{ 
                    justifyContent: 'center', 
                    padding: '14px',
                    opacity: (isTriggering || reset > 0) ? 0.6 : 1,
                    cursor: (isTriggering || reset > 0) ? 'not-allowed' : 'pointer',
                    width: '100%'
                  }}
                >
                  <Zap size={18} /> {isTriggering ? 'Flooding Sandbox...' : reset > 0 ? `Locked (Wait ${reset}s)` : 'Rapidly Trigger Limit (Ping Flood)'}
                </PrimaryButton>
              </div>

              {/* Terminal Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sandbox Console Output</span>
                  <button 
                    onClick={() => setLogs([])}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear Logs
                  </button>
                </div>
                
                <div style={{ 
                  flex: 1,
                  minHeight: '200px',
                  background: '#18181B', 
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '12px', 
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#A1A1AA',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
                }}>
                  {logs.length === 0 ? (
                    <div style={{ color: '#52525B', fontStyle: 'italic', margin: 'auto' }}>Console ready. Run a ping flood to view logs.</div>
                  ) : (
                    logs.map((log, index) => {
                      let color = '#A1A1AA' // Grey
                      if (log.type === 'success') color = '#34D399' // Light Green
                      else if (log.type === 'error') color = '#F87171' // Light Red
                      else if (log.type === 'info') color = '#60A5FA' // Light Blue
                      
                      return (
                        <div key={index} style={{ wordBreak: 'break-all', display: 'flex', gap: '8px', lineHeight: '1.4' }}>
                          <span style={{ color: '#52525B' }}>[{log.time}]</span>
                          <span style={{ color }}>{log.message}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </Card>

      {/* Educational How it Works */}
      <Card style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Database size={22} style={{ color: 'var(--color-accent-amber)' }} />
              <h3 className="claude-serif-title" style={{ fontSize: '1.4rem', color: 'var(--color-text-primary)' }}>
                Under The Hood: Redis Token Bucket Math
              </h3>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Learn how our distributed API cluster computes lightning-fast rate limits atomically with zero race conditions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-amber-glow)', color: 'var(--color-accent-amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0
              }}>1</div>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>The Token Bucket Pattern</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Think of limits as a bucket that holds up to <code style={{ fontFamily: 'monospace' }}>capacity</code> tokens (e.g. 60). Every API request consumes 1 token. If the bucket is empty, requests are blocked with HTTP 429.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-amber-glow)', color: 'var(--color-accent-amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0
              }}>2</div>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>On-the-Fly Continuous Refills</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Instead of resetting at rigid boundaries, tokens refill smoothly based on elapsed time: 
                  <code style={{ display: 'block', margin: '4px 0', padding: '2px 4px', background: 'var(--color-bg-canvas)', border: '1px solid var(--color-border-subtle)', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    tokens = min(cap, tokens + elapsed * rate)
                  </code>
                  Calculated dynamically on request arrival, saving background resources!
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-amber-glow)', color: 'var(--color-accent-amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0
              }}>3</div>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>Atomic Redis Lua Scripts</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  To prevent multi-threaded race conditions (like double-spending), we package the entire math sequence into a custom Lua script. Redis executes it atomically in a single, block-free step.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-amber-glow)', color: 'var(--color-accent-amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0
              }}>4</div>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>Zero-Waste Memory Expiry</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Whenever the Lua script updates the bucket, it updates an EXPIRE TTL to 120 seconds. If a user goes idle for 2 minutes, Redis cleans up the record completely, keeping memory lean!
                </p>
              </div>
            </div>

          </div>
        </div>
      </Card>

    </div>
  )
}
