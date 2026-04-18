import api from './api';
const roomService = {
  getAll: (params) => api.get('/rooms', { params }),
  search: (params) => api.get('/rooms/search', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  updateStatus: (id, status) => api.patch(`/rooms/${id}/status`, { status }),
  delete: (id) => api.delete(`/rooms/${id}`),
};
export default roomService;
