import api from './api';
const reportService = {
  dashboard: () => api.get('/reports/dashboard'),
  revenue: (params) => api.get('/reports/revenue', { params }),
  occupancy: (params) => api.get('/reports/occupancy', { params }),
  bookingSummary: (params) => api.get('/reports/booking-summary', { params }),
  topServices: (params) => api.get('/reports/top-services', { params }),
};
export default reportService;
