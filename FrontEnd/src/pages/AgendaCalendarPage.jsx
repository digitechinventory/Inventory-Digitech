import React from 'react';
import { Calendar as CalendarIcon, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import RealWorldCalendar from '../components/calendar/RealWorldCalendar';
import { useAuth } from '../context/AuthContext';

export default function AgendaCalendarPage() {
  const { user, role } = useAuth();

  return (
    <div className="space-y-2.5 pb-0 font-sans select-none animate-in fade-in duration-200">
      {/* ── Compact Top Header Banner ── */}
      <div className="bg-white rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase shrink-0">
            Operasional Site
          </span>
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Agenda &amp; Kalender Operasional Site
          </h1>
          <span className="hidden xl:inline text-xs text-slate-400">&bull;</span>
          <p className="hidden xl:inline text-xs text-slate-500 truncate">
            Jadwal shift, penerimaan MOS, stock opname bulanan, dan pemeliharaan unit.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 ml-auto shrink-0">
          <Clock className="w-3.5 h-3.5 text-red-600" />
          <div className="text-right leading-tight">
            <span className="text-[11px] font-bold text-slate-800">WITA (UTC+8)</span>
            <span className="text-[10px] text-slate-400 font-mono ml-1.5 hidden sm:inline">Kalimantan</span>
          </div>
        </div>
      </div>

      {/* ── Real World Calendar Component ── */}
      <RealWorldCalendar />
    </div>
  );
}
