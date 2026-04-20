import api from "./api";
const serviceService = {
  getAll: (params) => api.get("/services", { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post("/services", data),
  update: (id, data) => api.put(`/services/${id}`, data),
  toggle: (id) => api.patch(`/services/${id}/toggle`),
  delete: (id) => api.delete(`/services/${id}`),
};
export default serviceService;
