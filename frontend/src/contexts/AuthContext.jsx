import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');

  // Compute user role dynamically based on backend username context
  const role = username && username.toLowerCase() === 'admin' ? 'ADMIN' : 'ANALYST';
  const isAdmin = role === 'ADMIN';

  const loginUser = async (user, pass) => {
    const res = await api.login(user, pass);
    if (res.access_token) {
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('username', user);
      setToken(res.access_token);
      setUsername(user);
    }
    return res;
  };

  const registerUser = async (data) => {
    let u = '';
    let p = '';
    if (typeof data === 'object' && data !== null) {
      u = data.username || '';
      p = data.password || '';
    } else if (typeof data === 'string') {
      u = data;
      p = arguments[1] || '';
    }
    const res = await api.register(u, p);
    return { success: true, message: 'Operator account created successfully!', ...res };
  };

  const logoutUser = () => {
    setToken(null);
    setUsername('');
    localStorage.clear();
    sessionStorage.clear();
    api.logout();
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        isAdmin,
        isAuthenticated,
        loginUser,
        registerUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
