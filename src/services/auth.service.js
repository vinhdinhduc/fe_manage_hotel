import api from "./api";
const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  getMe: () => api.get("/auth/me"),
  changePassword: (data) => api.patch("/auth/change-password", data),
};
export default authService;
