import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import { orgsApi, usersApi, apiKeysAdminApi } from '../api/admin'
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react'

// Basic layout for Admin
export const AdminPage: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'orgs' | 'users' | 'keys'>('keys')
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  const roleHierarchy = {
    super_admin: 4,
    org_admin: 3,
    team_lead: 2,
    user: 1
  }

  const userLevel = roleHierarchy[(user?.role as keyof typeof roleHierarchy)] || 1

  useEffect(() => {
    if (userLevel >= 4 && activeTab === 'keys') setActiveTab('orgs')
    else if (userLevel >= 1 && activeTab === 'keys') setActiveTab('orgs') // Users go to 'My Organization'
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
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {activeTab === 'orgs' && <OrgsTab userLevel={userLevel} setActiveTab={setActiveTab} onSelect={(id) => { setSelectedOrgId(id); setActiveTab('users'); }} />}
            {activeTab === 'users' && userLevel >= 2 && <UsersTab userOrgId={selectedOrgId || user?.org_id || ''} userLevel={userLevel} />}
            {activeTab === 'keys' && <ApiKeysTab />}
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
