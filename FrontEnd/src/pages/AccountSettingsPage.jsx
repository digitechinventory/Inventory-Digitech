import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  User,
  Shield,
  ShieldCheck,
  Mail,
  Key,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  Save,
  Lock,
  Building,
  Briefcase,
  Phone,
  RefreshCw,
  LogOut,
  Monitor,
  Laptop,
  Globe,
  Clock,
  Trash2,
  MapPin,
  Timer,
  Hourglass,
  SlidersHorizontal,
  Sparkles,
  Maximize2,
  Download,
  X,
  Boxes,
  FileText,
  Wrench,
  ClipboardCheck,
  Users,
  XCircle,
  BadgeCheck,
  Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, role, logout, session, isSuperadmin } = useAuth();

  // Tabs: 'profile' | 'security' | 'sessions'
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+62 812-3456-7890');
  const [department, setDepartment] = useState(user?.department || 'Operasional Lapangan & Maintenance');
  const [company, setCompany] = useState(user?.company || 'DIGITECH');

  // Security Form State
  const [emailMfa, setEmailMfa] = useState(false);
  const [authenticatorMfa, setAuthenticatorMfa] = useState(false);
  const [authSecret, setAuthSecret] = useState('JBSWY3DPEHPK3PXP');
  const [authCode, setAuthCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isZoomQrOpen, setIsZoomQrOpen] = useState(false);
  const [totpCountdown, setTotpCountdown] = useState(30);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Superadmin JWT Session Duration State
  const [sessionDuration, setSessionDuration] = useState(8);
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [sessionConfigSaving, setSessionConfigSaving] = useState(false);
  const [sessionConfigMeta, setSessionConfigMeta] = useState(null);
  const [remainingTimeStr, setRemainingTimeStr] = useState('');

  // UI State
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Live countdown timer for active user session
  useEffect(() => {
    if (!session?.expires_at) return;
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Number(session.expires_at) - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRemainingTimeStr(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session?.expires_at]);

  // Load session duration config from backend
  useEffect(() => {
    async function loadSessionConfig() {
      try {
        const res = await api.get('/auth/session-config');
        if (res.data?.data) {
          const cfg = res.data.data;
          setSessionDuration(cfg.durationHours || 8);
          setSessionConfigMeta(cfg);
        }
      } catch (err) {
        console.warn('Gagal memuat konfigurasi durasi sesi:', err);
      }
    }
    loadSessionConfig();
  }, []);

  const handleSaveSessionDuration = async (hoursToSave) => {
    const val = parseFloat(hoursToSave);
    if (isNaN(val) || val < 0.25 || val > 72) {
      setMessage({ type: 'error', text: 'Durasi sesi harus berupa angka antara 0.25 jam (15 menit) hingga 72 jam.' });
      return;
    }

    setSessionConfigSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/auth/session-config', { durationHours: val });
      setSessionDuration(val);
      setSessionConfigMeta(res.data?.data);
      setMessage({
        type: 'success',
        text: `Kebijakan masa berlaku sesi login sistem berhasil diset ke ${val} Jam (${Math.round(val * 60)} Menit). Sesi pengguna yang telah habis waktu akan otomatis terpental keluar (auto kick-out) ke halaman login.`
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan kebijakan sesi.'
      });
    } finally {
      setSessionConfigSaving(false);
    }
  };

  // Load existing profile from backend
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/users/me');
        if (res.data?.data) {
          const p = res.data.data;
          setFullName(p.full_name || user?.full_name || '');
          setPhone(p.phone || '+62 812-3456-7890');
          setDepartment(p.department || 'Operasional Lapangan & Maintenance');
          setCompany(p.company || 'DIGITECH');
          setEmailMfa(Boolean(p.email_mfa_enabled));
          setAuthenticatorMfa(Boolean(p.authenticator_mfa_enabled));
          if (p.totp_secret) {
            setAuthSecret(p.totp_secret);
          }
        }
      } catch (err) {
        console.warn('Could not load profile from backend, using session');
      }
    }
    loadProfile();
  }, [user]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put('/users/profile', {
        full_name: fullName,
        phone,
        department,
        company
      });

      // Update local storage user profile
      const localUser = JSON.parse(localStorage.getItem('ims_user') || '{}');
      const updatedUser = { ...localUser, full_name: fullName, phone, department, company };
      localStorage.setItem('ims_user', JSON.stringify(updatedUser));

      setMessage({ type: 'success', text: 'Data diri akun berhasil diperbarui dan disimpan.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Gagal menyimpan profil.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Toggle Email MFA
  const handleToggleEmailMfa = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const nextState = !emailMfa;
      await api.post('/users/mfa/email', { enabled: nextState });
      setEmailMfa(nextState);
      setMessage({
        type: 'success',
        text: nextState
          ? 'MFA dengan Email telah aktif! Kode OTP akan dikirim via Gmail SMTP saat login.'
          : 'MFA dengan Email telah dinonaktifkan.'
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal memperbarui pengaturan MFA Email.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Enable Authenticator
  const handleVerifyAuthenticator = async () => {
    if (!authCode || authCode.length !== 6) {
      setMessage({ type: 'error', text: 'Masukkan 6 digit kode dari Google Authenticator / Authy.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await api.post('/users/mfa/authenticator', { enabled: true, code: authCode });
      setAuthenticatorMfa(true);
      setAuthCode('');
      setMessage({
        type: 'success',
        text: 'Aplikasi Authenticator berhasil diverifikasi dan terhubung ke akun Anda.'
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Kode verifikasi tidak sesuai. Pastikan jam pada perangkat akurat.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAuthenticator = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/users/mfa/authenticator', { enabled: false });
      setAuthenticatorMfa(false);
      setMessage({ type: 'success', text: 'MFA Aplikasi Authenticator dinonaktifkan.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menonaktifkan Authenticator.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password akun Anda berhasil diperbarui.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal mengubah password.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(authSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Generate accurate RFC 6238 TOTP QR Code using 'qrcode'
  useEffect(() => {
    let active = true;
    const userEmail = email || user?.email || 'arya-superadmin@digitech.co.id';
    const totpUri = `otpauth://totp/Digitech%20IMS:${encodeURIComponent(userEmail)}?secret=${authSecret}&issuer=Digitech%20IMS&algorithm=SHA1&digits=6&period=30`;

    QRCode.toDataURL(totpUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (active) setQrCodeUrl(url);
      })
      .catch((err) => {
        console.warn('Gagal membuat QR Code TOTP:', err);
      });

    return () => {
      active = false;
    };
  }, [authSecret, email, user?.email]);

  // Live 30-second token rotation countdown
  useEffect(() => {
    const updateSec = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = 30 - (nowSec % 30);
      setTotpCountdown(remaining === 0 ? 30 : remaining);
    };
    updateSec();
    const interval = setInterval(updateSec, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real Client Environment & Device Metadata
  const getDetectedOS = () => {
    if (typeof navigator === 'undefined') return 'PC Desktop';
    const ua = navigator.userAgent;
    if (ua.includes('Windows NT 10.0') || ua.includes('Windows')) return 'Windows 11 / 10 PC';
    if (ua.includes('Macintosh') || ua.includes('Mac OS X')) return 'macOS Apple';
    if (ua.includes('Android')) return 'Android Mobile';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Apple';
    if (ua.includes('Linux')) return 'Linux Workstation';
    return 'Desktop Workstation';
  };

  const getDetectedBrowser = () => {
    if (typeof navigator === 'undefined') return 'Web Browser';
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Microsoft Edge';
    if (ua.includes('Brave')) return 'Brave Browser';
    if (ua.includes('Chrome/')) return 'Google Chrome';
    if (ua.includes('Firefox/')) return 'Mozilla Firefox';
    if (ua.includes('Safari/')) return 'Apple Safari';
    return 'Chromium Browser';
  };

  const clientHost = typeof window !== 'undefined' ? window.location.host : 'localhost:5175';
  const clientHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const clientProtocol = typeof window !== 'undefined' ? window.location.protocol.replace(':', '').toUpperCase() : 'HTTP';
  const isLocalEnv = clientHostname === 'localhost' || clientHostname === '127.0.0.1';

  const sessionExpiryFormatted = () => {
    if (!session?.expires_at) return `Aktif (${sessionDuration || 8} Jam)`;
    const raw = Number(session.expires_at);
    const ms = raw < 10000000000 ? raw * 1000 : raw;
    const date = new Date(ms);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA';
  };

  const PERMISSIONS_MATRIX = [
    {
      id: 'inventory',
      module: 'Katalog & Rak Gudang (Inventory)',
      icon: Boxes,
      superadmin: { allowed: true, text: 'Akses Penuh (CRUD)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      admin: { allowed: true, text: 'Akses Penuh (CRUD)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      user: { allowed: true, text: 'Cek Stok & Scan QR', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
      desc: 'Master SKU material, bin lokasi rak gudang Sebamban & Batulicin, cetak kartu QR, dan monitoring batas minimum stok.'
    },
    {
      id: 'mos',
      module: 'Otorisasi Dokumen MOS & MDT',
      icon: FileText,
      superadmin: { allowed: true, text: 'Approval Final (Slot 3)', badge: 'bg-red-50 text-red-700 border-red-200 font-bold' },
      admin: { allowed: true, text: 'Verifikasi Gudang (Slot 2)', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
      user: { allowed: true, text: 'Input & Pemohon (Slot 1)', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
      desc: 'Alur penandatanganan digital resmi 3-slot berjenjang berkas Material On Site (MOS) dan Material Transfer (MDT).'
    },
    {
      id: 'tools',
      module: 'Peminjaman Alat Kerja (Tools)',
      icon: Wrench,
      superadmin: { allowed: true, text: 'Otorisasi & Hapus Log', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      admin: { allowed: true, text: 'Otorisasi & Pengembalian', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      user: { allowed: true, text: 'Ajukan Pinjam & Cek Overdue', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
      desc: 'Peminjaman peralatan kerja non-habis pakai, deteksi otomatis batas waktu jatuh tempo, dan riwayat peminjaman.'
    },
    {
      id: 'opname',
      module: 'Stock Opname & Variance Control',
      icon: ClipboardCheck,
      superadmin: { allowed: true, text: 'Approval Selisih & Rekonsiliasi', badge: 'bg-red-50 text-red-700 border-red-200 font-bold' },
      admin: { allowed: true, text: 'Eksekusi Scan & Input Fisik', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      user: { allowed: false, text: 'Terkunci (Petugas Khusus)', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
      desc: 'Pemeriksaan fisik berkala stok gudang, kalkulasi selisih (variance), dan berita acara opname resmi.'
    },
    {
      id: 'ledger',
      module: 'Mutasi Stok & Buku Besar Ledger',
      icon: Clock,
      superadmin: { allowed: true, text: 'Audit Trail & Ekspor Lengkap', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      admin: { allowed: true, text: 'Audit Trail & Ekspor Lengkap', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      user: { allowed: true, text: 'Melihat Mutasi Personal', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
      desc: 'Catatan kronologis penerimaan, pengeluaran, pemakaian material per proyek, serta audit trail kepatuhan.'
    },
    {
      id: 'users',
      module: 'Manajemen Pengguna (User RBAC)',
      icon: Users,
      superadmin: { allowed: true, text: 'Otoritas Eksklusif Superadmin', badge: 'bg-red-50 text-red-700 border-red-200 font-bold' },
      admin: { allowed: false, text: 'Terkunci (Tanpa Akses)', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
      user: { allowed: false, text: 'Terkunci (Tanpa Akses)', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
      desc: 'Persetujuan pendaftaran akun baru, penetapan role (Superadmin/Admin/User), dan kontrol aktivasi akun.'
    },
    {
      id: 'session_config',
      module: 'Kebijakan Masa Sesi JWT Global',
      icon: SlidersHorizontal,
      superadmin: { allowed: true, text: 'Otoritas Eksklusif Superadmin', badge: 'bg-red-50 text-red-700 border-red-200 font-bold' },
      admin: { allowed: false, text: 'Terkunci (Mengikuti Kebijakan)', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
      user: { allowed: false, text: 'Terkunci (Mengikuti Kebijakan)', badge: 'bg-slate-100 text-slate-400 border-slate-200' },
      desc: 'Pengaturan masa berlaku token otentikasi login sistem (0.25 - 72 jam) dan kebijakan auto kick-out pengguna.'
    },
    {
      id: 'tracking',
      module: 'Asset Tracking & GIS Site Map',
      icon: MapPin,
      superadmin: { allowed: true, text: 'Akses Monitoring Penuh', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      admin: { allowed: true, text: 'Akses Monitoring Penuh', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      user: { allowed: true, text: 'Akses Monitoring Penuh', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      desc: 'Peta geospasial armada alat berat, pelacakan komponen terpasang di Pit Sebamban KM 24.'
    }
  ];

  const getActivePerm = (item) => {
    if (role === 'Superadmin') return item.superadmin;
    if (role === 'Admin') return item.admin;
    return item.user;
  };

  return (
    <div className="space-y-6 pb-16 font-sans animate-in fade-in duration-200">
      
      {/* ─── Header Banner (Matches InventoryPage & UsersPage) ─── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-red-500/10 via-red-500/5 to-transparent pointer-events-none rounded-r-3xl" />

        <div className="relative z-10 flex-1 min-w-0 pr-0 sm:pr-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span>Profil Resmi &amp; Keamanan Terpusat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Pengaturan Akun &amp; Keamanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data profil pengguna, perlindungan otentikasi dua langkah (MFA), dan pemantauan sesi aktif
          </p>
        </div>

        {/* User Identity Chip */}
        <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold shadow-2xs ml-auto shrink-0 justify-end">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span>Role: {role || 'User'}</span>
        </div>
      </div>

      {/* ─── Alerts & Feedback Messages ────────────────────────── */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="font-semibold leading-relaxed">{message.text}</span>
        </div>
      )}

      {/* ─── Tab Navigation Bar ──────────────────────────────── */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-full sm:w-fit overflow-x-auto border border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          Data Diri Profil
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-red-600" />
          Keamanan &amp; MFA
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          Sesi &amp; Hak Akses
        </button>
      </div>

      {/* ─── TAB 1: DATA DIRI PROFIL ──────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center text-3xl font-black shadow-md border-2 border-white">
                {fullName.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-lg font-bold text-slate-900">{fullName || 'Nama Lengkap'}</h3>
                <p className="text-xs text-slate-500 font-mono">{email}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  <span>Role Sistem: {role || 'User'}</span>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Alamat Email (Login Resmi)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nomor HP / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-XXXX-XXXX"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Divisi / Departemen
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Contoh: Operasional Pit & Heavy Fleet"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Perusahaan / Site Tambang
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Contoh: DIGITECH"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Submit Action */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

          </div>
        </form>
      )}

      {/* ─── TAB 2: KEAMANAN & FITUR MFA ──────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          
          {/* Section 1: Email MFA */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Otentikasi Dua Langkah (MFA) via Email
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Kirim 6 digit kode OTP verifikasi ke email terdaftar ({email}) via Gmail SMTP setiap kali ada login dari perangkat baru.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleEmailMfa}
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 ${
                  emailMfa
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {emailMfa ? '✓ MFA Email Aktif' : 'Aktifkan MFA Email'}
              </button>
            </div>

            {emailMfa && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Perlindungan login aktif. Kode OTP akan dikirimkan otomatis melalui SMTP Digitech.
              </div>
            )}
          </div>

          {/* Section 2: Authenticator App MFA (TOTP) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    MFA dengan Aplikasi Authenticator (Google / Authy)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Gunakan aplikasi TOTP pada smartphone untuk menghasilkan token 6-digit dinamis tanpa memerlukan sinyal seluler.
                  </p>
                </div>
              </div>

              {authenticatorMfa ? (
                <button
                  type="button"
                  onClick={handleDisableAuthenticator}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
                >
                  Nonaktifkan Authenticator
                </button>
              ) : null}
            </div>

            {/* Authenticator Setup Box (if not enabled) */}
            {!authenticatorMfa ? (
              <div className="mt-4 p-5 sm:p-6 bg-slate-50/80 border border-slate-200 rounded-3xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Langkah Penyiapan Authenticator (Google / Authy):
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    Standar TOTP RFC 6238 • 30 Detik
                  </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                  
                  {/* Step 1: Scan Barcode / Input Manual */}
                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* The Real Scannable High-Definition QR Code */}
                    <div className="relative group shrink-0">
                      <div className="w-32 h-32 sm:w-36 sm:h-36 bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-xs flex items-center justify-center overflow-hidden">
                        {qrCodeUrl ? (
                          <img
                            src={qrCodeUrl}
                            alt="QR Code TOTP Digitech IMS"
                            className="w-full h-full object-contain select-none"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                            <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
                            <span className="text-[10px]">Membuat Barcode...</span>
                          </div>
                        )}
                      </div>
                      
                      {qrCodeUrl && (
                        <button
                          type="button"
                          onClick={() => setIsZoomQrOpen(true)}
                          className="absolute inset-0 bg-slate-950/70 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer text-xs font-bold shadow-md"
                        >
                          <Maximize2 className="w-5 h-5" />
                          <span>Perbesar QR</span>
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          1. Pindai Barcode / Input Manual
                        </span>
                      </div>
                      
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                        Arahkan pemindai pada Google Authenticator atau Authy ke Barcode QR di samping.
                      </p>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Kunci Rahasia (Secret Key):
                        </span>
                        <div className="inline-flex items-center gap-2 font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-xs tracking-wider">
                          <span>{authSecret}</span>
                          <button
                            type="button"
                            onClick={handleCopyKey}
                            className="text-red-600 hover:text-red-700 p-0.5 rounded cursor-pointer transition active:scale-90"
                            title="Salin Kunci"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {copiedKey && (
                          <span className="text-[10px] text-emerald-600 font-bold ml-1.5">✓ Tersalin!</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        {qrCodeUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsZoomQrOpen(true)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>Perbesar Barcode</span>
                            </button>
                            <a
                              href={qrCodeUrl}
                              download={`DigitechIMS-MFA-${email || 'user'}.png`}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                            >
                              <Download className="w-3 h-3" />
                              <span>Unduh Gambar QR</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Verification Input */}
                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-bold text-slate-800 block">
                          2. Masukkan 6 Digit Kode Token Verifikasi
                        </label>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Timer className="w-3 h-3 text-red-600" />
                          <span>Rotasi: {totpCountdown}s</span>
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-500">
                        Buka aplikasi Authenticator, lalu masukkan 6 digit token yang dihasilkan untuk akun ini:
                      </p>

                      <div className="flex flex-wrap sm:flex-nowrap gap-2.5 items-center pt-1">
                        <input
                          type="text"
                          maxLength={6}
                          value={authCode}
                          onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-36 h-11 px-3 text-center tracking-[0.3em] font-mono text-lg font-black rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyAuthenticator}
                          disabled={saving || authCode.length !== 6}
                          className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Memverifikasi...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Verifikasi &amp; Simpan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        Kode token diperbarui secara otomatis setiap 30 detik tanpa memerlukan koneksi internet pada smartphone.
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Aplikasi Authenticator aktif. Anda dapat menggunakannya untuk login aman.
              </div>
            )}
          </div>

          {/* Section 3: Ubah Password */}
          <form onSubmit={handleChangePassword} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Key className="w-5 h-5 text-red-600" />
              <h3 className="text-base font-bold text-slate-900">Perbarui Password Akun</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                Perbarui Password
              </button>
            </div>
          </form>

        </div>
      )}

      {/* ─── TAB 3: SESI AKTIF & DEVICE LOGIN INFO ────────────────── */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">

          {/* Superadmin Global Policy Notice Banner */}
          {(isSuperadmin || role === 'Superadmin') && (
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Kebijakan Masa Berlaku JWT Sesi Global:</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono text-[11px] font-black">{sessionDuration} Jam</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pengguna otomatis terpental keluar (auto kick-out) ke halaman login bila sesi melewati batas waktu.
                  </p>
                </div>
              </div>

              {isSuperadmin && (
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-red-300 text-red-700 text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Kelola di Manajemen User</span>
                </button>
              )}
            </div>
          )}
          
          {/* 1. Real Active Session & Live Token Status Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-red-600" />
                  <span>Informasi Sesi Login Aktif &amp; Perangkat Riil</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Metadata sesi aktif terdeteksi otomatis dari peramban dan token JWT yang digunakan saat ini.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sesi Ini (Online &amp; Aktif)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMessage({ type: 'success', text: 'Sesi akun dan masa berlaku token berhasil disinkronkan ulang.' });
                  }}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Segarkan Sesi"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4 Real Live Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* Sisa Waktu Sesi (Live Countdown) */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-emerald-600" />
                  Sisa Waktu Sesi Aktif
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-black text-emerald-700 tracking-wider">
                    {remainingTimeStr || '08:00:00'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">Live</span>
                </div>
                <p className="text-[10px] text-emerald-600/90 font-medium">Auto kick-out saat 00:00:00</p>
              </div>

              {/* Masa Berlaku Token */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Kedaluwarsa Token
                </span>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {sessionExpiryFormatted()}
                </div>
                <p className="text-[10px] text-slate-500">Kebijakan durasi: {sessionDuration || 8} Jam</p>
              </div>

              {/* Sistem Operasi & Browser */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  Perangkat &amp; Peramban
                </span>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {getDetectedOS()}
                </div>
                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {getDetectedBrowser()}
                </p>
              </div>

              {/* Host & Port Aktual */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-slate-500" />
                  Host Node &amp; Port
                </span>
                <div className="text-sm font-mono font-bold text-red-700 truncate">
                  {clientHost}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  {isLocalEnv ? '127.0.0.1 (Local Dev)' : 'Production Server'}
                </p>
              </div>

            </div>

            {/* Real Session Metadata Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4 text-slate-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                  Lokasi Sesi: <strong>Site Pit Sebamban KM 24 (BIB-02)</strong>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  Protokol: <strong>{clientProtocol} (Bearer JWT Auth)</strong>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Resolusi: {typeof window !== 'undefined' ? `${window.screen.width} × ${window.screen.height} px` : '1920 × 1080 px'}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="px-4 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ml-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Akhiri Sesi (Logout)</span>
              </button>
            </div>
          </div>

          {/* 2. Comprehensive Role-Based Access Control (RBAC) Permissions Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                  <span>Matriks Hak Akses &amp; Wewenang Akun (RBAC)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemetaan hak akses modul, batas wewenang approval, dan hak operasional akun Anda di sistem.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                <span>Role Terotentikasi:</span>
                <span className="text-red-700 font-black">{role || 'User'}</span>
              </div>
            </div>

            {/* Authority Profile Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {role === 'Superadmin'
                      ? 'Level 3 — Otoritas Tertinggi (Root System Administrator)'
                      : role === 'Admin'
                      ? 'Level 2 — Otoritas Pengawas Gudang & Operasional (Controller)'
                      : 'Level 1 — Otoritas Teknisi Lapangan (Field Operator & Requester)'}
                  </span>
                </div>
                <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <span>{fullName || user?.full_name || 'Pengguna Digitech'}</span>
                  <span className="text-xs font-mono font-normal text-slate-400">({email || user?.email})</span>
                </h4>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {role === 'Superadmin'
                    ? 'Memiliki hak akses tak terbatas ke seluruh modul sistem: persetujuan registrasi akun baru, konfigurasi masa berlaku sesi JWT, otorisasi dokumen MOS Slot 3, audit log, dan mutasi ledger.'
                    : role === 'Admin'
                    ? 'Memiliki kewenangan pengawasan logistik: pengelolaan katalog suku cadang, verifikasi dokumen MOS Slot 2, pelaksanaan stock opname gudang, dan pelacakan alat kerja.'
                    : 'Memiliki kewenangan teknisi lapangan: pengajuan Material Request (MR), pencarian ketersediaan stok & scan QR material, peminjaman alat kerja, dan tanda tangan MOS Slot 1 penerima.'}
                </p>
              </div>

              <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Status Otoritas</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  ✓ Aktif &amp; Terverifikasi
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-1">
                  {company || 'DIGITECH'} • {department || 'Operasional'}
                </span>
              </div>
            </div>

            {/* Permissions Matrix Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-2">
                <span>Daftar Modul &amp; Batasan Wewenang Sistem:</span>
                <span className="text-slate-400 font-normal text-[11px]">8 Modul Terverifikasi</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PERMISSIONS_MATRIX.map((item) => {
                  const Icon = item.icon;
                  const activePerm = getActivePerm(item);
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            activePerm.allowed ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{item.module}</h5>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${activePerm.badge}`}>
                          {activePerm.text}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Wewenang Role {role || 'User'}:</span>
                        <span className={`font-bold flex items-center gap-1 ${activePerm.allowed ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {activePerm.allowed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                          {activePerm.allowed ? 'Dapat Digunakan' : 'Akses Dibatasi'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Security Info Notice */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Shield className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  Hak akses sistem menerapkan standar Role-Based Access Control (RBAC). Perubahan role hanya dapat disetujui langsung oleh Superadmin.
                </span>
              </div>

              {isSuperadmin && (
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer shrink-0"
                >
                  Kelola Pengguna
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ─── Modal Zoom Barcode QR Code ────────────────────────── */}
      {isZoomQrOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl space-y-5 text-center relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsZoomQrOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold mb-1">
                <span>Google Authenticator / Authy</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Barcode MFA Presisi Tinggi</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{email || user?.email}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-center">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code TOTP Digitech IMS"
                  className="w-60 h-60 object-contain bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
                />
              ) : (
                <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
              )}
            </div>

            <div className="space-y-1 text-left bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kunci Rahasia Manual:</span>
              <div className="flex items-center justify-between gap-2 font-mono font-bold text-xs text-slate-900">
                <span>{authSecret}</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-red-600 hover:text-red-700 font-sans text-xs font-bold"
                >
                  {copiedKey ? '✓ Tersalin' : 'Salin'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomQrOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Tutup Tampilan Barcode
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
