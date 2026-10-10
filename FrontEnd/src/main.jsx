import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-200 shadow-inner">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold mb-1 text-slate-900">Pemulihan Tampilan Sistem</h1>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Komponen tampilan sedang disinkronkan. Klik tombol di bawah untuk melanjutkan secara aman ke portal Digitech IMS.
            </p>
            {this.state.error && (
              <div className="w-full text-left bg-slate-900 text-red-400 p-3 rounded-xl font-mono text-[11px] mb-4 overflow-auto max-h-36 border border-red-900/50">
                <div className="font-bold text-red-300 mb-1">{this.state.error.toString()}</div>
                <div className="text-slate-400 text-[10px] whitespace-pre-wrap">{this.state.error.stack}</div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                Pulihkan Komponen
              </button>
              <button
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                Ke Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Frame-busting guard: Prevent recursive embedding of React App inside iframes
if (typeof window !== 'undefined' && window.self !== window.top) {
  console.warn('[Layout] Prevented recursive React app instantiation inside iframe.');
  const rootEl = document.getElementById('root');
  if (rootEl) rootEl.innerHTML = '';
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}





