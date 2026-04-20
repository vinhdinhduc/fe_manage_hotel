import api from "./api";

const bookingDetailService = {
  remove: (detailId) => api.delete(`/booking-details/${detailId}`),
};

export default bookingDetailService;
