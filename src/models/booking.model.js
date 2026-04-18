export const createBookingModel = (data = {}) => ({
  id: data.id || null,
  user_id: data.user_id || null,
  room_id: data.room_id || null,
  check_in_date: data.check_in_date || '',
  check_out_date: data.check_out_date || '',
  adults: data.adults || 1,
  children: data.children || 0,
  status: data.status || 'Pending',
  special_request: data.special_request || '',
  total_amount: data.total_amount || 0,
  created_at: data.created_at || null,
});
