import React, { useState, useEffect } from 'react'
import { usersApi } from '../../../api/admin'
import { useAuthStore } from '../../../store/authStore'
import { Plus, Trash2 } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { SectionTitle } from '../../../components/ui/SectionTitle'

export const UsersTab = ({ userOrgId, userLevel, hideTitle }: { userOrgId: string, userLevel: number, hideTitle?: boolean }) => {
  const { user: currentUser } = useAuthStore()
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
      {!hideTitle && <SectionTitle>Users & Roles</SectionTitle>}

      {userLevel >= 3 && (
        <Card>
          <h3 className="claude-serif-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Invite User</h3>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <Select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
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
                  {userLevel >= 3 && u.user_id !== currentUser?.id ? (
                    <Select
                      value={u.role}
                      onChange={async (e: any) => {
                        const newRole = e.target.value
                        try {
                          await usersApi.updateRole(userOrgId, u.user_id, newRole)
                          await fetchUsers()
                        } catch (err) {
                          alert("Failed to update user role")
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.85rem', height: 'auto', width: 'auto' }}
                    >
                      <option value="user">User</option>
                      <option value="team_lead">Team Lead</option>
                      {(currentUser?.role === 'super_admin' || u.role === 'org_admin') && (
                        <option value="org_admin" disabled={currentUser?.role !== 'super_admin'}>Org Admin</option>
                      )}
                    </Select>
                  ) : (
                    <span style={{
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                      background: u.role === 'org_admin' ? 'rgba(139, 92, 246, 0.1)' : u.role === 'team_lead' ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-border-subtle)',
                      color: u.role === 'org_admin' ? '#8b5cf6' : u.role === 'team_lead' ? '#3b82f6' : 'var(--color-text-secondary)'
                    }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  )}
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
