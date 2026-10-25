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

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('ims_user');
    localStorage.removeItem('ims_session');
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?reason=session_expired';
    }
  }, []);

  // Monitor token expiration & auto kick-out saat waktu expired tercapai
  useEffect(() => {
    if (!session?.expires_at) return;

    const rawExpiry = Number(session.expires_at);
    if (!rawExpiry || isNaN(rawExpiry)) return;

    // Normalize Unix seconds (10 digits) to milliseconds (13 digits)
    const expiresAt = rawExpiry < 10000000000 ? rawExpiry * 1000 : rawExpiry;

    const checkExpiration = () => {
      const now = Date.now();
      if (now >= expiresAt) {
        console.warn('[Auth] Masa aktif sesi telah habis (Session Expired). Auto kick-out initiated.');
        handleSessionExpired();
      }
    };

    // 1. Cek langsung saat mount / update
    const now = Date.now();
    if (now >= expiresAt) {
      handleSessionExpired();
      return;
    }

    // 2. Set timeout presisi pas waktu kedaluwarsa tiba
    const msUntilExpiry = expiresAt - now;
    const timer = setTimeout(() => {
      handleSessionExpired();
    }, Math.min(msUntilExpiry, 2147483640));

    // 3. Watchdog interval per 15 detik (mengantisipasi tab idle atau laptop mode tidur/sleep)
    const interval = setInterval(checkExpiration, 15000);

    // 4. Cek saat tab browser kembali aktif
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiration();
      }
    };
    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', checkExpiration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', checkExpiration);
    };
  }, [session?.expires_at, handleSessionExpired]);

  const switchDemoRole = useCallback((roleName) => {
    const targetUser = DEMO_USERS[roleName] || DEMO_USERS.User;
    setUser(targetUser);
    const durationMs = 8 * 3600 * 1000;
    const expiresAt = Date.now() + durationMs;
    const newSession = {
      access_token: `bearer.${btoa(JSON.stringify({ id: targetUser.id, email: targetUser.email, role: targetUser.role, exp: expiresAt }))}`,
      expires_at: expiresAt,
      duration_hours: 8
    };
    setSession(newSession);
    localStorage.setItem('token', newSession.access_token);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const payload = res.data?.data || res.data;
      if (payload?.mfaRequired) {
        return payload;
      }
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
        const durationMs = 8 * 3600 * 1000;
        const expiresAt = Date.now() + durationMs;
        const newSession = {
          access_token: `bearer.${btoa(JSON.stringify({ id: demoUser.id, email: demoUser.email, role: demoUser.role, exp: expiresAt }))}`,
          expires_at: expiresAt,
          duration_hours: 8
        };
        setSession(newSession);
        localStorage.setItem('token', newSession.access_token);
        return { success: true, user: demoUser };
      }

      // Re-throw with server message if available
      const apiErr = err.response?.data?.error;
      const errMsg = apiErr?.message || err.response?.data?.message || err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.';
      const errCode = apiErr?.code || (err.response?.status === 429 ? 'ACCOUNT_LOCKED' : 'AUTH_ERROR');
      const customErr = new Error(errMsg);
      customErr.code = errCode;
      customErr.status = err.response?.status;
      customErr.details = apiErr?.details || err.response?.data?.details;
      customErr.remainingMinutes = apiErr?.remainingMinutes;
      customErr.remainingSeconds = apiErr?.remainingSeconds;
      customErr.lockedUntil = apiErr?.lockedUntil;
      throw customErr;
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (mfaPendingToken, code) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-2fa', { mfaPendingToken, code });
      const payload = res.data?.data || res.data;
      if (payload?.user && payload?.session) {
        setUser(payload.user);
        setSession(payload.session);
        if (payload.session.access_token) {
          localStorage.setItem('token', payload.session.access_token);
        }
        return { success: true, user: payload.user };
      }
      throw new Error('Verifikasi 2FA gagal diproses.');
    } catch (err) {
      const apiErr = err.response?.data?.error;
      const errMsg = apiErr?.message || err.response?.data?.message || err.message || 'Kode verifikasi 2FA tidak valid.';
      const customErr = new Error(errMsg);
      customErr.code = apiErr?.code || 'INVALID_2FA_CODE';
      throw customErr;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendEmailOtp = useCallback(async (mfaPendingToken) => {
    try {
      const res = await axios.post('/api/auth/resend-email-otp', { mfaPendingToken });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Gagal mengirim ulang kode OTP.';
      throw new Error(errMsg);
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
    verify2FA,
    resendEmailOtp,
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
