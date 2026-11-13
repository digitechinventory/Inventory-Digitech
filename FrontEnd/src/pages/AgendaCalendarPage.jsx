import React from 'react';
import { Calendar as CalendarIcon, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import RealWorldCalendar from '../components/calendar/RealWorldCalendar';
import { useAuth } from '../context/AuthContext';

export default function AgendaCalendarPage() {
  const { user, role } = useAuth();

  return (
    <div className="space-y-3.5 pb-0 font-sans select-none animate-in fade-in duration-200">
      {/* ── Top Header Banner ── */}
      <div className="bg-white rounded-3xl px-4 py-3.5 sm:px-6 sm:py-4 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase">
              Operasional Lapangan &amp; Site
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Role: {role || 'User'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Agenda &amp; Kalender Operasional Site
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kalender jadwal shift, penerimaan MOS, stock opname bulanan, dan jadwal pemeliharaan unit tambang.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/80 self-start sm:self-auto sm:ml-auto shrink-0">
          <Clock className="w-4 h-4 text-red-600 shrink-0" />
          <div className="text-left sm:text-right">
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
