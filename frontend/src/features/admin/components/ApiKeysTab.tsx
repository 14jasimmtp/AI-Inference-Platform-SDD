import React, { useState, useEffect } from 'react'
import { apiKeysAdminApi } from '../../../../api/admin'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { Card } from '../../../../components/ui/Card'
import { Input } from '../../../../components/ui/Input'
import { PrimaryButton } from '../../../../components/ui/PrimaryButton'
import { SectionTitle } from '../../../../components/ui/SectionTitle'

export const ApiKeysTab = () => {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [newKeyData, setNewKeyData] = useState<{ api_key: string, name: string } | null>(null)

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
