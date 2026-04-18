import api from './api';
const employeeService = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  toggleActive: (id) => api.patch(`/employees/${id}/toggle-active`),
};
export default employeeService;
