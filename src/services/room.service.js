import api from "./api";
const roomService = {
  getAll: (params) => api.get("/rooms", { params }),
  search: (params) => api.get("/rooms/search", { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/rooms/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  create: (data) => api.post("/rooms", data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  updateStatus: (id, status) => api.patch(`/rooms/${id}/status`, { status }),
  delete: (id) => api.delete(`/rooms/${id}`),
};
export default roomService;
