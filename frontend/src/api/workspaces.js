import api from './client.js';

export const workspaceAPI = {
  getMyWorkspaces: () => api.get('/workspaces'),
  createWorkspace: (data) => api.post('/workspaces', data),
  getWorkspaceById: (id) => api.get(`/workspaces/${id}`),
  updateWorkspace: (id, data) => api.put(`/workspaces/${id}`, data),
  getMembers: (id) => api.get(`/workspaces/${id}/members`),
  inviteMember: (id, data) => api.post(`/workspaces/${id}/members/invite`, data),
  acceptInvite: (data) => api.post('/workspaces/accept-invite', data),
  updateMemberRole: (workspaceId, memberId, role) =>
    api.put(`/workspaces/${workspaceId}/members/${memberId}/role`, { role }),
  removeMember: (workspaceId, memberId) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
  getInvitations: (workspaceId) => api.get(`/workspaces/${workspaceId}/invitations`)
};
