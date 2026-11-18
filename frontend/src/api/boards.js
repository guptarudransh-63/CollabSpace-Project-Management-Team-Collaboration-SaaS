import api from './client.js';

export const boardAPI = {
  getBoard: (projectId) => api.get(`/boards/project/${projectId}`),
  createColumn: (boardId, data) => api.post(`/boards/column/${boardId}`, data),
  updateColumn: (columnId, data) => api.put(`/boards/column/${columnId}`, data),
  reorderColumns: (columnIds) => api.put('/boards/columns/reorder', { columnIds }),
  deleteColumn: (columnId, data) => api.delete(`/boards/column/${columnId}`, { data })
};
