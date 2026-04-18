export const createUserModel = (data = {}) => ({
  id: data.id || null,
  full_name: data.full_name || '',
  email: data.email || '',
  phone: data.phone || '',
  address: data.address || '',
  id_card: data.id_card || '',
  role: data.role || 'customer',
  is_active: data.is_active ?? true,
  created_at: data.created_at || null,
});

export const getRoleLabel = (role) => {
  const labels = { admin: 'Quản lý', receptionist: 'Lễ tân', customer: 'Khách hàng' };
  return labels[role] || role;
};
