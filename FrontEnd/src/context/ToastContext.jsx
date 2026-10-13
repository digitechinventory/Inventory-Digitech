import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000, options = {}) => {
    let cleanMessage = '';
    let customTitle = options?.title || null;

    if (typeof message === 'string') {
      cleanMessage = message;
    } else if (message && typeof message === 'object') {
      cleanMessage = message.error || message.message || message.msg || JSON.stringify(message);
      if (message.title) customTitle = message.title;
    } else {
      cleanMessage = String(message || '');
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    const createdAt = Date.now();

    setToasts(prev => {
      // Keep at most 5 toasts to avoid cluttering the corner
      const updated = [...prev, { id, message: cleanMessage, type, title: customTitle, duration, createdAt }];
      return updated.slice(-5);
    });

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Failsafe: Intercept any window.alert() calls across the app to display sleek corner in-app notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (msg) => {
        // Detect if error-like message or info
        const str = String(msg || '');
        const isErr = str.toLowerCase().includes('gagal') || str.toLowerCase().includes('error') || str.toLowerCase().includes('salah');
        const isSuccess = str.toLowerCase().includes('berhasil') || str.toLowerCase().includes('sukses');
        const type = isErr ? 'error' : isSuccess ? 'success' : 'warning';
        addToast(str, type, 4500);
      };
      return () => {
        window.alert = originalAlert;
      };
    }
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (msg, type = 'info', duration = 4000, opts = {}) => {
        console.info(`[Toast ${type}]:`, msg);
      },
      removeToast: () => {},
      toasts: []
    };
  }
  return context;
};

