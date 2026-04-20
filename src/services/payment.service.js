import api from "./api";
const paymentService = {
  getByBooking: (bookingId, params) =>
    api.get(`/payments/bookings/${bookingId}`, { params }),
  getById: (id) => api.get(`/payments/${id}`),
  deposit: (bookingId, data) =>
    api.post(`/payments/bookings/${bookingId}/deposit`, data),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
};
export default paymentService;
