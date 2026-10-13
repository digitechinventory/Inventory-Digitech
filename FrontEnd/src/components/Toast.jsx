import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Bell } from 'lucide-react';

const Toast = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifikasi Sistem"
      className="fixed top-4 sm:top-6 right-3 sm:right-6 z-[999999] flex flex-col items-end gap-3 pointer-events-none max-w-sm w-[calc(100%-1.5rem)] sm:w-auto"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const defaultTitle = isSuccess
          ? 'Berhasil'
          : isError
          ? 'Gagal / Kesalahan'
          : isWarning
          ? 'Peringatan Operasional'
          : 'Informasi Sistem';

        const title = toast.title || defaultTitle;
        const durationMs = toast.duration || 4000;

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto relative overflow-hidden w-full sm:min-w-[340px] sm:max-w-md bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border p-4 flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-top-4 sm:slide-in-from-right-8 fade-in hover:shadow-red-950/10 ${
              isSuccess
                ? 'border-emerald-200/90 shadow-emerald-950/10'
                : isError
                ? 'border-red-300/90 shadow-red-950/15'
                : isWarning
                ? 'border-amber-200/90 shadow-amber-950/10'
                : 'border-slate-200/90 shadow-slate-900/10'
            }`}
          >
            {/* Left Status Icon */}
            <div className="shrink-0 pt-0.5">
              {isSuccess && (
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={18} className="stroke-[2.5]" />
                </div>
              )}
              {isError && (
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow-xs">
                  <XCircle size={18} className="stroke-[2.5]" />
                </div>
              )}
              {isWarning && (
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
                  <AlertTriangle size={18} className="stroke-[2.5]" />
                </div>
              )}
              {!isSuccess && !isError && !isWarning && (
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
                  <Info size={18} className="stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${
                    isSuccess
                      ? 'text-emerald-700'
                      : isError
                      ? 'text-red-700'
                      : isWarning
                      ? 'text-amber-800'
                      : 'text-slate-800'
                  }`}
                >
                  {title}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-semibold mt-0.5 leading-relaxed break-words">
                {typeof toast.message === 'object'
                  ? toast.message?.message || toast.message?.error || JSON.stringify(toast.message)
                  : String(toast.message || '')}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl transition-colors shrink-0 cursor-pointer"
              title="Tutup Notifikasi"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>

            {/* Micro Countdown Progress Bar at bottom */}
            {durationMs > 0 && (
              <div
                className={`absolute bottom-0 left-0 h-[3px] w-full ${
                  isSuccess
                    ? 'bg-emerald-500'
                    : isError
                    ? 'bg-red-600'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{
                  animation: `shrinkWidth ${durationMs}ms linear forwards`,
                }}
              />
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </aside>
  );
};

export default Toast;

