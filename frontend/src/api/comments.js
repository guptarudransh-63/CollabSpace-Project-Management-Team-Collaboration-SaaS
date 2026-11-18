import api from './client.js';

export const commentAPI = {
  getComments: (taskId) => api.get(`/comments/task/${taskId}`),
  addComment: (taskId, data) => api.post(`/comments/task/${taskId}`, data),
  updateComment: (commentId, data) => api.put(`/comments/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  addAttachment: (taskId, data) => api.post(`/comments/task/${taskId}/attachments`, data),
  deleteAttachment: (attachmentId) => api.delete(`/comments/attachments/${attachmentId}`)
};
