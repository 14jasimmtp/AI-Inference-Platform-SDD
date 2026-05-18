import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { orgsApi, usersApi, apiKeysAdminApi } from '../api/admin'
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react'

// Basic layout for Admin
export const AdminPage: React.FC = () => {
  const { user, logout, refreshUser } = useAuthStore()
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#111]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/chat')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {userLevel >= 4 ? 'Admin Console' : 'Workspace Settings'} <span className="text-xs text-gray-600 font-mono ml-2">v1.1-secure</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <span className="font-medium text-gray-300">{user?.full_name}</span> ({user?.role})
          </div>
          <button onClick={logout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/10 p-4 space-y-2 bg-[#111]/50">
          <button
            onClick={() => setActiveTab('orgs')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'orgs' ? 'bg-blue-500/20 text-blue-400 font-medium' : 'hover:bg-white/5 text-gray-400'}`}
          >
            {userLevel >= 4 ? 'Organizations' : 'My Organization'}
          </button>
          {userLevel >= 2 && (
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-blue-500/20 text-blue-400 font-medium' : 'hover:bg-white/5 text-gray-400'}`}
            >
              Users & Roles
            </button>
          )}
          <button
            onClick={() => setActiveTab('keys')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'keys' ? 'bg-blue-500/20 text-blue-400 font-medium' : 'hover:bg-white/5 text-gray-400'}`}
          >
            API Keys
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'orgs' && <OrgsTab userLevel={userLevel} setActiveTab={setActiveTab} onSelect={(id) => { setSelectedOrgId(id); setActiveTab('users'); }} />}
          {activeTab === 'users' && userLevel >= 2 && <UsersTab userOrgId={selectedOrgId || user?.org_id || ''} userLevel={userLevel} />}
          {activeTab === 'keys' && <ApiKeysTab userLevel={userLevel} />}
        </div>
      </div>
    </div>
  )
}

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
      const res = await orgsApi.create(newOrgName, newOrgSlug)
      const newOrgId = res.data.data.org_id
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
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  const myOrg = orgs.find(o => o.org_id === user?.org_id)

  if (userLevel < 4 && !user?.org_id) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Get Started</h2>
          <p className="text-gray-400">You are not currently in an organization. Create your own to start working with others and managing API keys.</p>
        </div>
        
        <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 shadow-2xl">
          <h3 className="text-xl font-medium mb-6">Create Your Organization</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Organization Name</label>
              <input
                type="text"
                placeholder="e.g. My Awesome Team"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">URL Slug</label>
              <input
                type="text"
                placeholder="e.g. my-team"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                required
                pattern="[a-z0-9-]+"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
              <Plus size={20} /> Create Organization
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (userLevel < 4 && myOrg) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold mb-1">My Organization</h2>
            <p className="text-gray-400">Manage your workspace and team members.</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg text-blue-400 text-sm font-medium">
            Role: {user?.role}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10">
            <h3 className="text-lg font-medium text-gray-400 mb-2">Organization Details</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 block">Name</span>
                <span className="text-xl font-semibold">{myOrg.name}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 block">Slug</span>
                <span className="text-lg font-mono text-gray-300">{myOrg.slug}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4">
              <RefreshCw size={32} />
            </div>
            <h3 className="text-lg font-medium mb-2">Team Management</h3>
            <p className="text-sm text-gray-400 mb-6">Go to the Users & Roles tab to invite teammates to {myOrg.name}.</p>
            <button 
              onClick={() => setActiveTab('users')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
            >
              Manage Users
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Organizations</h2>
      
      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-medium mb-4">Create New Organization</h3>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            placeholder="Name (e.g. Acme Corp)"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Slug (e.g. acme-corp)"
            value={newOrgSlug}
            onChange={(e) => setNewOrgSlug(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            required
            pattern="[a-z0-9-]+"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Plus size={18} /> Create
          </button>
        </form>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#222] border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-400">Name</th>
              <th className="px-6 py-4 font-medium text-gray-400">Slug</th>
              <th className="px-6 py-4 font-medium text-gray-400">Created</th>
              <th className="px-6 py-4 font-medium text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {orgs.map(org => (
              <tr key={org.org_id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium">{org.name}</td>
                <td className="px-6 py-4 text-gray-400">{org.slug}</td>
                <td className="px-6 py-4 text-gray-400">{new Date(org.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onSelect(org.org_id)}
                      className="px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded text-xs transition-colors"
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
                        className="px-3 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded text-xs transition-colors"
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
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  if (!userOrgId) return (
    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl text-blue-400">
      <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
      <p>Please create or join an organization to manage users and roles.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Users & Roles</h2>
      
      {userLevel >= 3 && (
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-medium mb-4">Invite User</h3>
          <form onSubmit={handleInvite} className="flex gap-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="user">User</option>
              <option value="team_lead">Team Lead</option>
              <option value="org_admin">Org Admin</option>
            </select>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Plus size={18} /> Invite
            </button>
          </form>
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#222] border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-400">Name</th>
              <th className="px-6 py-4 font-medium text-gray-400">Email</th>
              <th className="px-6 py-4 font-medium text-gray-400">Role</th>
              {userLevel >= 3 && <th className="px-6 py-4 font-medium text-gray-400 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map(u => (
              <tr key={u.user_id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium">{u.full_name}</td>
                <td className="px-6 py-4 text-gray-400">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    u.role === 'org_admin' ? 'bg-purple-500/20 text-purple-400' :
                    u.role === 'team_lead' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {u.role}
                  </span>
                </td>
                {userLevel >= 3 && (
                  <td className="px-6 py-4 text-right">
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
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// API Keys Tab
const ApiKeysTab = ({ userLevel }: { userLevel: number }) => {
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

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">API Keys</h2>
      
      {newKeyData && (
        <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl">
          <h3 className="text-green-400 font-medium mb-2">Save this key now! It will never be shown again.</h3>
          <div className="bg-black/50 p-4 rounded-lg font-mono text-sm break-all select-all text-white">
            {newKeyData.api_key}
          </div>
          <button onClick={() => setNewKeyData(null)} className="mt-4 text-sm text-green-400 hover:text-green-300">
            I have saved it
          </button>
        </div>
      )}

      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-medium mb-4">Create New API Key</h3>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            placeholder="Key Name (e.g. Production Web)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Plus size={18} /> Generate Key
          </button>
        </form>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#222] border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-400">Name</th>
              <th className="px-6 py-4 font-medium text-gray-400">Prefix</th>
              <th className="px-6 py-4 font-medium text-gray-400">Created</th>
              <th className="px-6 py-4 font-medium text-gray-400">Last Used</th>
              <th className="px-6 py-4 font-medium text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {keys.map(k => (
              <tr key={k.key_id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium">{k.name}</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-sm">{k.prefix}...</td>
                <td className="px-6 py-4 text-gray-400">
                  {/* Fallback to display valid created date if 'created_at' does not exist yet */}
                  {new Date(k.created_at || new Date()).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleRotate(k.key_id)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
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
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
      </div>
    </div>
  )
}
