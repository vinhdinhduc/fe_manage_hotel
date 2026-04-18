import api from './api';
const paymentService = {
  getByBooking: (bookingId) => api.get(`/payments/bookings/${bookingId}`),
  getById: (id) => api.get(`/payments/${id}`),
  deposit: (bookingId, data) => api.post(`/payments/bookings/${bookingId}/deposit`, data),
  refund: (id) => api.post(`/payments/${id}/refund`),
};
export default paymentService;
