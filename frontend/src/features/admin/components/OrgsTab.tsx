import React, { useState, useEffect } from 'react'
import { orgsApi, usersApi } from '../../../api/admin'
import { useAuthStore } from '../../../store/authStore'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { SectionTitle } from '../../../components/ui/SectionTitle'
import { UsersTab } from './UsersTab'

export const OrgsTab = ({ onSelect, userLevel, setActiveTab }: { onSelect: (id: string) => void, userLevel: number, setActiveTab: (tab: any) => void }) => {
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
                onChange={(e: any) => setNewOrgName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>URL Slug</label>
              <Input
                type="text"
                placeholder="e.g. my-team"
                value={newOrgSlug}
                onChange={(e: any) => setNewOrgSlug(e.target.value)}
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

          {userLevel >= 2 && (
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
          )}
        </div>

        {userLevel < 2 && (
          <div style={{ marginTop: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Members</h3>
            <UsersTab userOrgId={myOrg.org_id} userLevel={userLevel} hideTitle={true} />
          </div>
        )}
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
            onChange={(e: any) => setNewOrgName(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <Input
            type="text"
            placeholder="Slug (e.g. acme-corp)"
            value={newOrgSlug}
            onChange={(e: any) => setNewOrgSlug(e.target.value)}
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
