import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export const DEMO_USERS = {
  User: {
    id: 'demo-user-001',
    email: 'arya-user@digitech.co.id',
    full_name: 'arya-user',
    role: 'User',
    company: 'Digitech',
    department: 'Operations',
    site_id: 'site-bib-02',
    is_active: true
  },
  Admin: {
    id: 'demo-admin-001',
    email: 'arya-admin@digitech.co.id',
    full_name: 'arya-admin',
    role: 'Admin',
    company: 'Digitech',
    department: 'Inventory Control',
    site_id: 'site-bib-02',
    is_active: true
  },
  Superadmin: {
    id: 'demo-sa-001',
    email: 'arya-superadmin@digitech.co.id',
    full_name: 'arya-superadmin',
    role: 'Superadmin',
    company: 'Digitech',
    department: 'System Administration',
    site_id: null,
    is_active: true
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ims_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('ims_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ims_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ims_user');
    }
    if (session) {
      localStorage.setItem('ims_session', JSON.stringify(session));
      if (session.access_token) {
        localStorage.setItem('token', session.access_token);
      }
    } else {
      localStorage.removeItem('ims_session');
      localStorage.removeItem('token');
    }
  }, [user, session]);

  const switchDemoRole = useCallback((roleName) => {
    const targetUser = DEMO_USERS[roleName] || DEMO_USERS.User;
    setUser(targetUser);
    const newSession = {
      access_token: `bearer.${btoa(JSON.stringify({ id: targetUser.id, email: targetUser.email, role: targetUser.role, exp: Date.now() + 86400000 }))}`,
      expires_at: Date.now() + 86400000
    };
    setSession(newSession);
    localStorage.setItem('token', newSession.access_token);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const payload = res.data?.data || res.data;
      if (payload?.user && payload?.session) {
        setUser(payload.user);
        setSession(payload.session);
        if (payload.session.access_token) {
          localStorage.setItem('token', payload.session.access_token);
        }
        return { success: true, user: payload.user };
      }
      throw new Error('Format data login tidak valid.');
    } catch (err) {
      // If network fails (e.g. proxy or network issue), handle demo credentials gracefully
      const cleanEmail = email?.toLowerCase()?.trim();
      const matchedDemoKey = Object.keys(DEMO_USERS).find(
        key => DEMO_USERS[key].email.toLowerCase() === cleanEmail || key.toLowerCase() === cleanEmail
      );
      if (matchedDemoKey && (!err.response || err.message === 'Network Error' || err.code === 'ERR_NETWORK')) {
        const demoUser = DEMO_USERS[matchedDemoKey];
        setUser(demoUser);
        const newSession = {
          access_token: `bearer.${btoa(JSON.stringify({ id: demoUser.id, email: demoUser.email, role: demoUser.role, exp: Date.now() + 86400000 }))}`,
          expires_at: Date.now() + 86400000
        };
        setSession(newSession);
        localStorage.setItem('token', newSession.access_token);
        return { success: true, user: demoUser };
      }

      // Re-throw with server message if available
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      const errCode = err.response?.data?.error?.code || 'AUTH_ERROR';
      const customErr = new Error(errMsg);
      customErr.code = errCode;
      customErr.status = err.response?.status;
      throw customErr;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', formData);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      const errCode = err.response?.data?.error?.code || 'REGISTRATION_ERROR';
      const customErr = new Error(errMsg);
      customErr.code = errCode;
      throw customErr;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout').catch(() => {});
    } finally {
      setUser(null);
      setSession(null);
      localStorage.removeItem('ims_user');
      localStorage.removeItem('ims_session');
    }
  }, []);

  const role = user?.role || 'User';

  const value = {
    user,
    role,
    session,
    token: session?.access_token || null,
    isAuthenticated: !!user,
    isUser: role === 'User',
    isAdmin: ['Admin', 'Superadmin'].includes(role),
    isSuperadmin: role === 'Superadmin',
    loading,
    login,
    register,
    logout,
    switchDemoRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
