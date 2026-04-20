import api from "./api";
const bookingService = {
  create: (data) => api.post("/bookings", data),
  getAll: (params) => api.get("/bookings", { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  getInvoice: (id) => api.get(`/bookings/${id}/invoice`),
  confirm: (id) => api.patch(`/bookings/${id}/confirm`),
  checkIn: (id) => api.patch(`/bookings/${id}/check-in`),
  checkOut: (id, data) => api.patch(`/bookings/${id}/check-out`, data),
  cancel: (id, data) => api.patch(`/bookings/${id}/cancel`, data),
  addService: (id, data) => api.post(`/bookings/${id}/services`, data),
  myBookings: (params) => api.get("/users/me/bookings", { params }),
};
export default bookingService;
