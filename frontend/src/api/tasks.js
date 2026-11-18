import api from './client.js';

export const taskAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  createTask: (data) => api.post('/tasks', data),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  moveTask: (id, data) => api.put(`/tasks/${id}/move`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  duplicateTask: (id) => api.post(`/tasks/${id}/duplicate`),
  addSubtask: (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data),
  toggleSubtask: (subtaskId) => api.put(`/tasks/subtasks/${subtaskId}/toggle`),
  deleteSubtask: (subtaskId) => api.delete(`/tasks/subtasks/${subtaskId}`),
  bulkUpdate: (data) => api.post('/tasks/bulk-update', data),
  bulkDelete: (data) => api.post('/tasks/bulk-delete', data)
};
