import React, { useState, useEffect, useCallback } from 'react'
import { orgsApi, usersApi } from '../../../api/admin'
import { authApi } from '../../../api/auth'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'

export const LimitsTab = ({ userOrgId, userLevel }: { userOrgId: string, userLevel: number }) => {
  const [limit, setLimit] = useState<number>(60)
  const [remaining, setRemaining] = useState<number>(60)
  const [reset, setReset] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [orgUsers, setOrgUsers] = useState<any[]>([])
  const [orgData, setOrgData] = useState<any>(null)
  const [orgLimitInput, setOrgLimitInput] = useState<string>('')

  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Super Admin org selector
  const [selectedAdminOrgId, setSelectedAdminOrgId] = useState<string>(userOrgId)
  const [allOrgs, setAllOrgs] = useState<any[]>([])

  const effectiveOrgId = userLevel >= 4 && selectedAdminOrgId ? selectedAdminOrgId : userOrgId

  useEffect(() => {
    // Fetch live rate limit for the current user's session
    const fetchLiveRateLimit = async () => {
      try {
        const res = await authApi.rateLimit()
        const data = res.data.data
        setLimit(data.limit)
        setRemaining(data.remaining)
        setReset(data.reset)
      } catch (err: any) {
        if (err.response && err.response.status === 429) {
          const retryAfter = err.response.data?.details?.retry_after || 10
          setRemaining(0)
          setReset(Number(retryAfter) || 10)
        }
      }
    }
    fetchLiveRateLimit()
    const timer = setInterval(fetchLiveRateLimit, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (reset <= 0) return
    const timer = setInterval(() => setReset(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(timer)
  }, [reset])

  const loadOrgData = useCallback(async () => {
    setIsLoading(true)
    try {
      if (userLevel >= 4 && allOrgs.length === 0) {
        const orgsRes = await orgsApi.list()
        setAllOrgs(orgsRes.data.data)
      }
      if (effectiveOrgId) {
        const [orgRes, usersRes] = await Promise.all([
          orgsApi.get(effectiveOrgId),
          usersApi.list(effectiveOrgId)
        ])
        setOrgData(orgRes.data.data)
        setOrgLimitInput(orgRes.data.data.rate_limit_rpm ? String(orgRes.data.data.rate_limit_rpm) : '')
        setOrgUsers(usersRes.data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [effectiveOrgId, userLevel, allOrgs.length])

  useEffect(() => {
    loadOrgData()
  }, [loadOrgData])

  const handleUpdateOrgLimit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!effectiveOrgId || !orgData) return
    try {
      const val = orgLimitInput.trim() === '' ? undefined : Number(orgLimitInput)
      await orgsApi.update(effectiveOrgId, orgData.name, val)
      setSuccess("Organization rate limit updated")
      loadOrgData()
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Error updating org rate limit")
    }
  }

  const handleUpdateUserLimit = async (userId: string, valStr: string) => {
    if (!effectiveOrgId) return
    setError('')
    setSuccess('')
    try {
      const val = valStr.trim() === '' ? null : Number(valStr)
      await usersApi.updateRateLimit(effectiveOrgId, userId, val)
      setSuccess("User rate limit updated")
      loadOrgData()
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Error updating user rate limit")
    }
  }

  const percentage = Math.max(0, Math.min(100, (remaining / limit) * 100))
  const progressColor = remaining / limit < 0.2 ? '#ef4444' : remaining / limit < 0.5 ? 'var(--color-accent-amber)' : '#10b981'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeSlideUp 0.3s ease' }}>
      <div>
        <h2 className="claude-serif-title" style={{ fontSize: '1.75rem', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Usage &amp; Rate Limits Configuration
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Configure API rate limits (RPM) for organizations and individual users. Leave blank to inherit the default (60 RPM).
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '16px',
          borderRadius: '12px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'shake 0.5s ease'
        }}>
          <AlertTriangle size={20} />
          <span style={{ flex: 1, fontSize: '0.9rem' }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '16px',
          borderRadius: '12px',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <CheckCircle size={20} />
          <span style={{ flex: 1, fontSize: '0.9rem' }}>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      {userLevel >= 4 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 600 }}>Select Organization to Manage:</span>
            <Select
              value={selectedAdminOrgId}
              onChange={(e: any) => setSelectedAdminOrgId(e.target.value)}
              style={{ flex: 1, maxWidth: '400px' }}
            >
              <option value="">-- Select an Organization --</option>
              {allOrgs.map(o => <option key={o.org_id} value={o.org_id}>{o.name} ({o.slug})</option>)}
            </Select>
          </div>
        </Card>
      )}

      {effectiveOrgId ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

          {userLevel >= 3 && (
            <Card>
              <h3 className="claude-serif-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
                Organization Limit
              </h3>
              {isLoading ? <div>Loading...</div> : orgData ? (
                <form onSubmit={handleUpdateOrgLimit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      Rate Limit (Requests Per Minute)
                    </label>
                    <Input
                      type="number"
                      placeholder="Inherit global default (60)"
                      value={orgLimitInput}
                      onChange={(e: any) => setOrgLimitInput(e.target.value)}
                      min={1}
                      max={10000}
                    />
                    <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      This applies to all users in {orgData.name} unless specifically overridden.
                    </p>
                  </div>
                  <PrimaryButton type="submit">Save Organization Limit</PrimaryButton>
                </form>
              ) : <div>Error loading organization</div>}
            </Card>
          )}

          <Card style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} style={{ color: progressColor }} />
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Your Active Capacity Bucket</span>
              </div>
            </div>
            <div>
              <div style={{
                height: '24px', background: 'var(--color-bg-canvas)', borderRadius: '12px',
                border: '1px solid var(--color-border-subtle)', overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`, height: '100%', background: progressColor,
                  transition: 'width 0.4s', borderRadius: '12px'
                }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: progressColor }}>{remaining} / {limit} tokens</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total: {limit} RPM</span>
              </div>
            </div>
          </Card>

        </div>
      ) : (
        <Card><div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '20px' }}>Please select an organization.</div></Card>
      )}

      {effectiveOrgId && userLevel >= 3 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <h3 className="claude-serif-title" style={{ fontSize: '1.2rem', margin: 0 }}>
              User Specific Limits
            </h3>
          </div>
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>Loading users...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>User</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Role</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Rate Limit (RPM)</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgUsers.map(u => (
                  <UserRow key={u.user_id} u={u} handleUpdateUserLimit={handleUpdateUserLimit} />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

    </div>
  )
}

const UserRow = ({ u, handleUpdateUserLimit }: { u: any, handleUpdateUserLimit: (userId: string, val: string) => void }) => {
  const [rpmInput, setRpmInput] = useState(u.rate_limit_rpm ? String(u.rate_limit_rpm) : '')
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      <td style={{ padding: '16px 24px' }}>
        <div style={{ fontWeight: 500 }}>{u.full_name}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{u.email}</div>
      </td>
      <td style={{ padding: '16px 24px', textTransform: 'capitalize' }}>{u.role.replace('_', ' ')}</td>
      <td style={{ padding: '16px 24px' }}>
        <Input
          type="number"
          placeholder="Inherit Org Limit"
          value={rpmInput}
          onChange={(e: any) => setRpmInput(e.target.value)}
          style={{ maxWidth: '150px' }}
        />
      </td>
      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
        <PrimaryButton
          onClick={() => handleUpdateUserLimit(u.user_id, rpmInput)}
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex' }}
        >
          Save
        </PrimaryButton>
      </td>
    </tr>
  )
}
