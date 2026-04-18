import api from './api';
const roomTypeService = {
  getAll: () => api.get('/room-types'),
  getById: (id) => api.get(`/room-types/${id}`),
  create: (data) => api.post('/room-types', data),
  update: (id, data) => api.put(`/room-types/${id}`, data),
  delete: (id) => api.delete(`/room-types/${id}`),
};
export default roomTypeService;
