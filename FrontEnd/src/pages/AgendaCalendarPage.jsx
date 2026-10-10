import React from 'react';
import { Calendar as CalendarIcon, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import RealWorldCalendar from '../components/calendar/RealWorldCalendar';
import { useAuth } from '../context/AuthContext';

export default function AgendaCalendarPage() {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6 pb-20 font-sans select-none animate-in fade-in duration-200">
      {/* ── Top Header Banner ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase">
              Operasional Lapangan &amp; Site
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Role: {role || 'User'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Agenda &amp; Kalender Operasional Site
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kalender jadwal shift, penerimaan MOS, stock opname bulanan, dan jadwal pemeliharaan unit tambang.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/80 ml-auto shrink-0">
          <Clock className="w-4 h-4 text-red-600" />
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">Zona Waktu Site</div>
            <div className="text-[10px] text-slate-500 font-mono">WITA (UTC+8) Kalimantan</div>
          </div>
        </div>
      </div>

      {/* ── Real World Calendar Component ── */}
      <RealWorldCalendar />
    </div>
  );
}
