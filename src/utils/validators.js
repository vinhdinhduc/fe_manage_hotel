export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPhone = (phone) => /^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone);
export const isValidPassword = (pw) => pw && pw.length >= 8;
export const isValidIdCard = (id) => /^[0-9]{9,12}$/.test(id);

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} không được để trống`;
  }
  return null;
};
