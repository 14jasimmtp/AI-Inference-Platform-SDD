import { api } from './auth'

export const orgsApi = {
  list: () => api.get('/api/v1/orgs'),
  get: (orgId: string) => api.get(`/api/v1/orgs/${orgId}`),
  create: (name: string, slug: string) => api.post('/api/v1/orgs', { name, slug }),
  update: (orgId: string, name: string) => api.put(`/api/v1/orgs/${orgId}`, { name }),
  delete: (orgId: string) => api.delete(`/api/v1/orgs/${orgId}`),
}

export const usersApi = {
  list: (orgId: string) => api.get(`/api/v1/orgs/${orgId}/users`),
  invite: (orgId: string, email: string, role: string) => 
    api.post(`/api/v1/orgs/${orgId}/invite`, { email, role }),
  updateRole: (orgId: string, userId: string, role: string) => 
    api.patch(`/api/v1/orgs/${orgId}/users/${userId}`, { role }),
  remove: (orgId: string, userId: string) => 
    api.delete(`/api/v1/orgs/${orgId}/users/${userId}`),
}

// Update apiKeysApi with rotate endpoint
export const apiKeysAdminApi = {
  list: () => api.get('/api/v1/api-keys'),
  create: (name: string, rate_limit_rpm = 60, user_id?: string) =>
    api.post('/api/v1/api-keys', { name, rate_limit_rpm, user_id }),
  revoke: (keyId: string) => api.delete(`/api/v1/api-keys/${keyId}`),
  rotate: (keyId: string) => api.post(`/api/v1/api-keys/${keyId}/rotate`),
}
