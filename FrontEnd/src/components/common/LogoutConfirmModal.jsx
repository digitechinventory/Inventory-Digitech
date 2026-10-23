import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Keluar",
  description = "Apakah Anda yakin ingin keluar dari sistem IMS Digitech? Sesi kerja Anda akan ditutup dan Anda harus login kembali untuk mengakses data gudang dan operasional."
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-700/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-center"
        style={{
          clipPath: "polygon(0 16px, 100% 0, 100% calc(100% - 16px), 0 100%)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(220,38,38,0.15)",
          background: "#FFFFFF",
        }}
      >
        <div style={{ background: "linear-gradient(90deg, #DC2626, #EF4444)", height: "4px", width: "100%" }} />

        <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none opacity-70">
          <svg viewBox="-5 -5 160 160" className="w-full h-full">
            <defs>
              <linearGradient id="lmMm" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            <path d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90 Z" fill="url(#lmMm)" />
            <path d="M-5,-5 L55,-5 C49,5 53,13 42,18 C32,21 34,31 23,35 C13,38 15,50 1,55 C-4,58 -5,59 -5,59 Z" fill="#F87171" fillOpacity="0.35" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none opacity-50 rotate-180">
          <svg viewBox="-5 -5 160 160" className="w-full h-full">
            <path d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90 Z" fill="#DC2626" fillOpacity="0.3" />
          </svg>
        </div>

        <div className="relative z-10 p-6 pt-9 pb-10">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-5 p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer z-20"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
            <LogOut className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-medium">{description}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-98 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => { onClose(); onConfirm(); }}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Ya, Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
