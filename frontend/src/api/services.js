import api from './client.js';

export const activityAPI = {
  getActivities: (params) => api.get('/activities', { params })
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

export const analyticsAPI = {
  getWorkspaceMetrics: (workspaceId) => api.get(`/analytics/workspace/${workspaceId}`),
  getProjectAnalytics: (projectId) => api.get(`/analytics/project/${projectId}`)
};

export const searchAPI = {
  search: (params) => api.get('/search', { params })
};

export const savedViewAPI = {
  getSavedViews: (params) => api.get('/saved-views', { params }),
  createSavedView: (data) => api.post('/saved-views', data),
  deleteSavedView: (id) => api.delete(`/saved-views/${id}`)
};
