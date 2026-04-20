import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

const resolveInitialStorageType = () => {
  if (localStorage.getItem('token')) return 'local';
  if (sessionStorage.getItem('token')) return 'session';
  return 'local';
};

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const readToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const readUser = () => safeParse(localStorage.getItem('user')) || safeParse(sessionStorage.getItem('user'));

export const AuthProvider = ({ children }) => {
  const [storageType, setStorageType] = useState(resolveInitialStorageType);
  const [user, setUser] = useState(readUser);
  const [token, setToken] = useState(readToken);
  const [loading, setLoading] = useState(false);

  const saveAuth = useCallback((userData, tokenData, remember = true) => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');

    const targetStorage = remember ? localStorage : sessionStorage;
    setUser(userData);
    setToken(tokenData);
    setStorageType(remember ? 'local' : 'session');
    targetStorage.setItem('user', JSON.stringify(userData));
    targetStorage.setItem('token', tokenData);
  }, []);

  const login = useCallback(async (credentials, remember = true) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      saveAuth(res.data.user, res.data.token, remember);
      return res.data.user;
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setStorageType('local');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  }, []);

  const updateUser = useCallback((updated) => {
    const newUser = { ...user, ...updated };
    setUser(newUser);
    const targetStorage = storageType === 'session' ? sessionStorage : localStorage;
    targetStorage.setItem('user', JSON.stringify(newUser));
  }, [storageType, user]);

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
