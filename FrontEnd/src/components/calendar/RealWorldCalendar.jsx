import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  CalendarDays,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const CATEGORY_CONFIG = {
  Shift: {
    label: 'Shift Lapangan',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  MOS: {
    label: 'Penerimaan MOS',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500'
  },
  Opname: {
    label: 'Stock Opname',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  Maintenance: {
    label: 'Maintenance / Overhaul',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500'
  },
  Tools: {
    label: 'Inspeksi Tools',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500'
  },
  Meeting: {
    label: 'Koordinasi / Safety',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  }
};

const DAYS_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function RealWorldCalendar({ isModal = false, onClose }) {
  const { user, isAdmin, isSuperadmin } = useAuth();
  const { addToast } = useToast();
  const canManage = isAdmin || isSuperadmin;
  const queryClient = useQueryClient();

  // Current view year & month (0-indexed)
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form modal state (Add / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    start_time: '08:00',
    end_time: '17:00',
    category: 'Shift',
    site_location: 'Pit South Site BIB-02',
    pic_name: user?.full_name || '',
    status: 'scheduled',
    description: ''
  });

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Month query key
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Fetch agendas for current month
  const { data: agendasData = [], isLoading, refetch } = useQuery({
    queryKey: ['agendas', monthKey, categoryFilter],
    queryFn: async () => {
      const res = await api.get('/agendas', {
        params: {
          month: monthKey,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined
        }
      });
      return res.data?.data || [];
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newAgenda) => api.post('/agendas', newAgenda),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      addToast('Agenda operasional baru berhasil disimpan.', 'success');
      setFormModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal menyimpan agenda.', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => api.put(`/agendas/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      addToast('Perubahan agenda operasional berhasil disimpan.', 'success');
      setFormModalOpen(false);
      setEditingAgenda(null);
      resetForm();
    },
    onError: (err) => {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal memperbarui agenda.', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/agendas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendas'] });
      addToast('Agenda berhasil dihapus.', 'info');
      setDeleteConfirmId(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal menghapus agenda.', 'error');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      date: selectedDateStr || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
      start_time: '08:00',
      end_time: '17:00',
      category: 'Shift',
      site_location: 'Pit South Site BIB-02',
      pic_name: user?.full_name || '',
      status: 'scheduled',
      description: ''
    });
  };

  const handleOpenAddModal = (dateStr) => {
    setEditingAgenda(null);
    setFormData({
      title: '',
      date: dateStr || selectedDateStr,
      start_time: '08:00',
      end_time: '17:00',
      category: 'Shift',
      site_location: 'Pit South Site BIB-02',
      pic_name: user?.full_name || '',
      status: 'scheduled',
      description: ''
    });
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (agenda) => {
    setEditingAgenda(agenda);
    setFormData({
      title: agenda.title || '',
      date: agenda.date || '',
      start_time: agenda.start_time || '08:00',
      end_time: agenda.end_time || '17:00',
      category: agenda.category || 'Shift',
      site_location: agenda.site_location || 'Pit South Site BIB-02',
      pic_name: agenda.pic_name || user?.full_name || '',
      status: agenda.status || 'scheduled',
      description: agenda.description || ''
    });
    setFormModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) {
      addToast('Judul agenda dan tanggal wajib diisi.', 'warning');
      return;
    }

    if (editingAgenda) {
      updateMutation.mutate({ id: editingAgenda.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDateStr(`${y}-${m}-${d}`);
  };

  // Compute Calendar Grid Days
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Days count in current month
    const daysInCurrentMonth = lastDayOfMonth.getDate();

    // Monday-based indexing: Sunday is 6, Monday is 0
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex < 0) startDayIndex = 6;

    // Previous month trailing days
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays = [];
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      prevMonthDays.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // Current month days
    const currentMonthDays = [];
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      currentMonthDays.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month leading days to complete grid to 35 or 42
    const totalFilled = prevMonthDays.length + currentMonthDays.length;
    const totalGridCells = totalFilled > 35 ? 42 : 35;
    const remainingDays = totalGridCells - totalFilled;

    const nextMonthDays = [];
    for (let d = 1; d <= remainingDays; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      nextMonthDays.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isNextMonth: true
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentYear, currentMonth, today]);

  // Group agendas by date
  const agendasByDate = useMemo(() => {
    const map = {};
    agendasData.forEach((item) => {
      if (!map[item.date]) {
        map[item.date] = [];
      }
      map[item.date].push(item);
    });
    return map;
  }, [agendasData]);

  // Agendas for selected date or month
  const selectedDateAgendas = useMemo(() => {
    if (!selectedDateStr) return [];
    return agendasByDate[selectedDateStr] || [];
  }, [agendasByDate, selectedDateStr]);

  // Formatted date label for selected date
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateStr) return '';
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden font-sans select-none">
      
      {/* ── Top Header & Month Controls ── */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-red-700 text-white flex items-center justify-center shadow-md shadow-red-600/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                Kalender Nyata
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Jadwal shift operasional, penerimaan MOS, stock opname, dan inspeksi site
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Steppers */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleJumpToday}
              className="px-3 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Add Agenda Button for Admin & Superadmin */}
          {canManage && (
            <button
              type="button"
              onClick={() => handleOpenAddModal(selectedDateStr)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Agenda</span>
            </button>
          )}

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer border border-slate-200"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none">
        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            categoryFilter === 'ALL'
              ? 'bg-red-600 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Semua ({agendasData.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = agendasData.filter((a) => a.category === key).length;
          const isSelected = categoryFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategoryFilter(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? `${config.bg} ${config.text} ${config.border} border font-bold ring-1 ring-red-400`
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              <span>{config.label}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Body: Calendar Grid + Selected Day Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* Left: Real World Calendar Month Grid (8 columns on lg) */}
        <div className="lg:col-span-8 p-3 sm:p-5">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_NAMES.map((name, idx) => (
              <div
                key={name}
                className={`py-2 text-center text-[11px] font-bold tracking-wider uppercase ${
                  idx === 6 ? 'text-red-500' : 'text-slate-500'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarCells.map((cell, idx) => {
              const events = agendasByDate[cell.dateStr] || [];
              const isSelected = selectedDateStr === cell.dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[75px] sm:min-h-[96px] p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? 'bg-white hover:border-red-300 hover:shadow-xs'
                      : 'bg-slate-50/60 opacity-40 hover:opacity-70'
                  } ${
                    isSelected
                      ? 'ring-2 ring-red-600 border-red-500 bg-red-50/20 shadow-xs'
                      : 'border-slate-200/80'
                  }`}
                >
                  {/* Top Bar of Day Cell: Date Number & Today Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-red-600 text-white shadow-2xs font-black'
                          : isSelected
                          ? 'text-red-700 font-black'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {events.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {events.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges inside Cell */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {events.slice(0, 2).map((ev) => {
                      const cfg = CATEGORY_CONFIG[ev.category] || CATEGORY_CONFIG.Shift;
                      return (
                        <div
                          key={ev.id}
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate border ${cfg.bg} ${cfg.text} ${cfg.border} leading-tight flex items-center gap-1`}
                          title={`${ev.title} (${ev.start_time} - ${ev.end_time})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}

                    {events.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-500 pl-1">
                        +{events.length - 2} agenda lagi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Date Agenda Details & Admin Actions (4 columns on lg) */}
        <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-50/40 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header of Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  Agenda Terpilih
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {selectedDateFormatted}
                </h3>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(selectedDateStr)}
                  className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                  title="Tambah Agenda di Tanggal Ini"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* List of Agendas on Selected Date */}
            {selectedDateAgendas.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 mx-auto flex items-center justify-center shadow-2xs">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">
                    Tidak ada agenda pada tanggal ini
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    Pilih tanggal lain pada kalender atau jadwalkan agenda operasional baru.
                  </p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(selectedDateStr)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Jadwalkan Agenda</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {selectedDateAgendas.map((item) => {
                  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Shift;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5 transition hover:shadow-md hover:border-slate-300"
                    >
                      {/* Card Header: Category & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} flex items-center gap-1.5`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span>{cfg.label}</span>
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'completed'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {item.status === 'active'
                            ? 'Aktif'
                            : item.status === 'completed'
                            ? 'Selesai'
                            : 'Terjadwal'}
                        </span>
                      </div>

                      {/* Card Title */}
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>

                      {/* Details: Time, Location, PIC */}
                      <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {item.start_time} - {item.end_time} WITA
                          </span>
                        </div>

                        {item.site_location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.site_location}</span>
                          </div>
                        )}

                        {item.pic_name && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>PIC: {item.pic_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Admin / Superadmin Actions (Edit & Delete) */}
                      {canManage && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold transition cursor-pointer border border-transparent hover:border-red-200"
                            title="Edit Agenda"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                            title="Hapus Agenda"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Info Bar at Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Real-time database sync</span>
            </span>
            <span className="font-mono font-bold text-slate-700">
              Total {agendasData.length} Agenda
            </span>
          </div>
        </div>
      </div>

      {/* ── Modal Dialog: Tambah / Edit Agenda ── */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
            style={{
              clipPath: 'polygon(0 14px, 100% 0, 100% calc(100% - 14px), 0 100%)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(220,38,38,0.10)',
            }}
          >
            <div style={{ background: 'linear-gradient(90deg, #DC2626, #EF4444)', height: '4px', width: '100%' }} />
            <div className="p-5 sm:p-6 pt-8 pb-9 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingAgenda ? 'Edit Agenda Site' : 'Tambah Agenda Site Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Otoritas Manajemen: Admin &amp; Superadmin
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Judul Agenda <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shift A — Pit Sebamban KM 24"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Agenda
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold"
                  >
                    <option value="Shift">Shift Lapangan</option>
                    <option value="MOS">Penerimaan MOS</option>
                    <option value="Opname">Stock Opname</option>
                    <option value="Maintenance">Maintenance &amp; Overhaul</option>
                    <option value="Tools">Inspeksi Tools</option>
                    <option value="Meeting">Safety &amp; Koordinasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold"
                  >
                    <option value="scheduled">Terjadwal</option>
                    <option value="active">Aktif (Sedang Berjalan)</option>
                    <option value="completed">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lokasi Site / Gudang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pit South Site BIB-02"
                    value={formData.site_location}
                    onChange={(e) => setFormData({ ...formData, site_location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama PIC / Petugas
                  </label>
                  <input
                    type="text"
                    placeholder="Nama PIC penanggung jawab"
                    value={formData.pic_name}
                    onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan rincian operasional, nomor unit armada, atau instruksi khusus..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-none transition font-semibold resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold transition shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Menyimpan...'
                    : editingAgenda
                    ? 'Simpan Perubahan'
                    : 'Jadwalkan Agenda'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-sm overflow-hidden text-center animate-in zoom-in-95 duration-150"
            style={{
              clipPath: 'polygon(0 14px, 100% 0, 100% calc(100% - 14px), 0 100%)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(220,38,38,0.12)',
            }}
          >
            <div style={{ background: 'linear-gradient(90deg, #DC2626, #EF4444)', height: '4px', width: '100%' }} />
            <div className="p-5 pt-8 pb-9 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Hapus Agenda Site?</h4>
              <p className="text-xs text-slate-500">
                Agenda ini akan dihapus permanen dari kalender dan database server.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
