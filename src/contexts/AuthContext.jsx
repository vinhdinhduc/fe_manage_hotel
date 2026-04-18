import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const saveAuth = useCallback((userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      saveAuth(res.data.user, res.data.token);
      return res.data.user;
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const updateUser = useCallback((updated) => {
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, [user]);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  const isAdmin = user?.role === 'admin';
  const isReceptionist = user?.role === 'receptionist';
  const isStaff = isAdmin || isReceptionist;
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAdmin, isReceptionist, isStaff, isCustomer,
      login, logout, updateUser, isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
