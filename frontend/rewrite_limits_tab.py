import os

file_path = 'src/pages/AdminPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of LimitsTab
start_idx = content.find('// Limits Tab showing')
if start_idx == -1:
    print("Could not find LimitsTab")
    exit(1)

# The new LimitsTab code
new_code = """// Real Rate Limits Configuration Tab
const LimitsTab = ({ userOrgId, userLevel }: { userOrgId: string, userLevel: number }) => {
  const { user: currentUser } = useAuthStore()
  const [limit, setLimit] = useState<number>(60)
  const [remaining, setRemaining] = useState<number>(60)
  const [reset, setReset] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  const [orgUsers, setOrgUsers] = useState<any[]>([])
  const [orgData, setOrgData] = useState<any>(null)
  const [orgLimitInput, setOrgLimitInput] = useState<string>('')
  
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

  const loadOrgData = async () => {
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
  }

  useEffect(() => {
    loadOrgData()
  }, [effectiveOrgId, userLevel])

  const handleUpdateOrgLimit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveOrgId || !orgData) return
    try {
      const val = orgLimitInput.trim() === '' ? undefined : Number(orgLimitInput)
      await orgsApi.update(effectiveOrgId, orgData.name, val)
      alert("Organization rate limit updated")
      loadOrgData()
    } catch (e) {
      alert("Error updating org rate limit")
    }
  }

  const handleUpdateUserLimit = async (userId: string, valStr: string) => {
    if (!effectiveOrgId) return
    try {
      const val = valStr.trim() === '' ? null : Number(valStr)
      await usersApi.updateRateLimit(effectiveOrgId, userId, val)
      alert("User rate limit updated")
      loadOrgData()
    } catch (e) {
      alert("Error updating user rate limit")
    }
  }

  const percentage = Math.max(0, Math.min(100, (remaining / limit) * 100))
  let progressColor = remaining / limit < 0.2 ? '#ef4444' : remaining / limit < 0.5 ? 'var(--color-accent-amber)' : '#10b981'

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

      {userLevel >= 4 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 600 }}>Select Organization to Manage:</span>
            <Select 
              value={selectedAdminOrgId} 
              onChange={e => setSelectedAdminOrgId(e.target.value)}
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
                    onChange={e => setOrgLimitInput(e.target.value)}
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

      {effectiveOrgId && (
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
                {orgUsers.map(u => {
                  const [rpmInput, setRpmInput] = useState(u.rate_limit_rpm ? String(u.rate_limit_rpm) : '')
                  return (
                    <tr key={u.user_id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
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
                          onChange={e => setRpmInput(e.target.value)}
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
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

    </div>
  )
}
"""

# Now write back
new_content = content[:start_idx] + new_code

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("LimitsTab replaced successfully!")
