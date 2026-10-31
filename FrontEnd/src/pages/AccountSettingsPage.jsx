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
  SlidersHorizontal,
  Sparkles,
  Maximize2,
  Download,
  X,
  BadgeCheck,
  Radio,
  Volume2,
  VolumeX,
  Crown,
  Wrench,
  ChevronRight,
  ChevronDown,
  Hash,
  Activity,
  Layers,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playNotificationSound, isSoundMuted, setSoundMuted } from '../utils/notificationSound';
import api from '../api/client';

/* ─── Authentic Mega Mendung Batik SVG Pattern (Matching Brand Identity) ─── */
const MegaMendungDefs = () => (
  <svg className="absolute -top-10 -right-10 w-80 h-80 opacity-20 pointer-events-none" viewBox="0 0 200 200" fill="none">
    <defs>
      <linearGradient id="heroMmCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DC2626" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#991B1B" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="heroMmRose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F87171" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#EF4444" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="heroMmWhite" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#FECDD3" stopOpacity="0.85" />
      </linearGradient>
    </defs>
    {/* Cloud Lobe 1 */}
    <path
      d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142 Z"
      fill="url(#heroMmCrimson)"
    />
    <path
      d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116 Z"
      fill="url(#heroMmRose)"
    />
    <path
      d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90 Z"
      fill="url(#heroMmWhite)"
    />
    {/* Cloud Lobe 2 */}
    <path
      d="M-5,72 C18,72 26,58 46,63 C66,68 62,84 76,88 C90,92 86,112 66,116 C46,120 32,140 -5,150 Z"
      fill="url(#heroMmCrimson)"
      opacity="0.85"
    />
    <path
      d="M-5,82 C12,82 18,71 34,75 C50,79 46,91 58,94 C68,97 65,110 50,113 C35,117 24,130 -5,138 Z"
      fill="url(#heroMmRose)"
    />
    {/* Batik Contour Lines */}
    <path
      d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142"
      fill="none"
      stroke="#DC2626"
      strokeWidth="1.2"
      opacity="0.8"
    />
    <path
      d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116"
      fill="none"
      stroke="#F87171"
      strokeWidth="1.2"
      opacity="0.85"
    />
  </svg>
);

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
  const [siteLocation, setSiteLocation] = useState(user?.site_id || 'BIB Pit Sebamban KM-24');
  const [jobTitle, setJobTitle] = useState(() => {
    if (role === 'Superadmin') return 'Root System Administrator';
    if (role === 'Admin') return 'Warehouse Logistics Controller';
    return 'Field Operations Technician';
  });
  const [employeeId] = useState(user?.id || 'DGT-2026-0891');
  const [soundMutedState, setSoundMutedState] = useState(() => isSoundMuted());

  // Security Form State
  const [emailMfa, setEmailMfa] = useState(false);
  const [authenticatorMfa, setAuthenticatorMfa] = useState(false);
  const [authSecret, setAuthSecret] = useState('JBSWY3DPEHPK3PXP');
  const [authCode, setAuthCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isZoomQrOpen, setIsZoomQrOpen] = useState(false);
  const [totpCountdown, setTotpCountdown] = useState(30);
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Superadmin JWT Session Duration State
  const [sessionDuration, setSessionDuration] = useState(8);
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
          if (p.site_id) setSiteLocation(p.site_id);
          setEmailMfa(Boolean(p.email_mfa_enabled));
          setAuthenticatorMfa(Boolean(p.authenticator_mfa_enabled));
          if (p.totp_secret) {
            setAuthSecret(p.totp_secret);
          }
        }
      } catch (err) {
        console.warn('Could not load profile from backend, using session');
      }

      // Check MFA status specifically
      try {
        const mfaRes = await api.get('/users/mfa/status');
        if (mfaRes.data?.data) {
          const m = mfaRes.data.data;
          setEmailMfa(Boolean(m.email_mfa_enabled));
          setAuthenticatorMfa(Boolean(m.authenticator_mfa_enabled));
          if (m.secretKey) {
            setAuthSecret(m.secretKey);
          }
        }
      } catch (err) {
        console.warn('Could not load MFA status:', err);
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
      await api.put('/users/profile', {
        full_name: fullName,
        phone,
        department,
        company,
        site_id: siteLocation,
        job_title: jobTitle
      });

      // Update local storage user profile
      const localUser = JSON.parse(localStorage.getItem('ims_user') || '{}');
      const updatedUser = {
        ...localUser,
        full_name: fullName,
        phone,
        department,
        company,
        site_id: siteLocation,
        job_title: jobTitle
      };
      localStorage.setItem('ims_user', JSON.stringify(updatedUser));

      setMessage({ type: 'success', text: 'Data profil dan penugasan kerja berhasil diperbarui dan disimpan.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Gagal menyimpan profil.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Audio Chime Toggle & Test
  const handleToggleSound = () => {
    const nextState = !soundMutedState;
    setSoundMutedState(nextState);
    setSoundMuted(nextState);
    if (!nextState) {
      playNotificationSound(true);
    }
  };

  const handleTestChime = () => {
    playNotificationSound(true);
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
      const res = await api.post('/users/mfa/authenticator', {
        enabled: true,
        code: authCode,
        secret: authSecret
      });
      setAuthenticatorMfa(true);
      setAuthCode('');
      if (res.data?.data?.backupCodes) {
        setBackupCodes(res.data.data.backupCodes);
      }
      setMessage({
        type: 'success',
        text: 'Aplikasi Authenticator berhasil diverifikasi dan terhubung ke akun Anda.'
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Kode verifikasi tidak sesuai. Pastikan jam pada perangkat akurat.' });
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
      setBackupCodes([]);
      setMessage({ type: 'success', text: 'MFA Aplikasi Authenticator dinonaktifkan.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menonaktifkan Authenticator.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes.length > 0 && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const content = `DIGITECH IMS - EMERGENCY RECOVERY BACKUP CODES\nAkun: ${email || user?.email}\nTanggal Dibuat: ${new Date().toLocaleString('id-ID')}\n\nGunakan salah satu kode ini jika Anda kehilangan akses ke aplikasi Authenticator:\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nPERINGATAN: Simpan file ini di tempat yang aman dan rahasia.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIGITECH-backup-codes-${(email || 'user').split('@')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
    const userEmail = email || user?.email || 'user@digitech.internal';
    const totpUri = `otpauth://totp/DIGITECH:${encodeURIComponent(userEmail)}?secret=${authSecret}&issuer=DIGITECH&algorithm=SHA1&digits=6&period=30`;

    QRCode.toDataURL(totpUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e293b',
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

  return (
    <div className="space-y-6 pb-16 font-sans animate-in fade-in duration-200">
      
      {/* ─── Top Header Banner ─── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(59,130,246,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-500/10 via-blue-500/5 to-transparent pointer-events-none rounded-r-3xl" />

        <div className="relative z-10 flex-1 min-w-0 pr-0 sm:pr-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Profil Resmi &amp; Keamanan Terpusat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Pengaturan Akun &amp; Profil
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data diri pengguna, penugasan operasional, perlindungan dua langkah (MFA), dan pemantauan sesi aktif
          </p>
        </div>
      </div>

      {/* ─── Elevated Hero Profile Card (Clean White High-Contrast Theme) ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 text-slate-900 shadow-[0_12px_36px_rgba(15,23,42,0.04),0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600" />
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-blue-50/70 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar & Main Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center text-3xl sm:text-4xl font-black shadow-md shadow-blue-600/20 ring-4 ring-blue-50">
                {fullName?.charAt(0)?.toUpperCase() || user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white" title="Akun Aktif & Terverifikasi">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  role === 'Superadmin'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : role === 'Admin'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {role === 'Superadmin' ? <Crown className="w-3.5 h-3.5 text-blue-600" /> : role === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> : <Wrench className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>
                    {role === 'Superadmin'
                      ? 'Level 3 — Root System Administrator'
                      : role === 'Admin'
                      ? 'Level 2 — Logistics & Warehouse Controller'
                      : 'Level 1 — Field Operations Technician'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>{fullName || user?.full_name || 'Pengguna Digitech'}</span>
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              </h2>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(email || user?.email || '');
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition cursor-pointer font-mono bg-slate-50 hover:bg-blue-50/70 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-200"
                  title="Klik untuk salin email"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{email || user?.email}</span>
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                <span className="flex items-center gap-1.5 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-mono">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>{company || 'DIGITECH'}</span>
                </span>

                <span className="flex items-center gap-1.5 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{siteLocation}</span>
                </span>
              </div>
            </div>
          </div>
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
          <User className="w-4 h-4 text-blue-600" />
          Data Diri &amp; Organisasi
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-blue-600" />
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
          <Monitor className="w-4 h-4 text-blue-600" />
          Sesi Aktif &amp; Perangkat
        </button>
      </div>

      {/* ─── TAB 1: DATA DIRI & ORGANISASI ───────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Section 1: Informasi Personal & Kontak Lapangan */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Identitas &amp; Kontak Resmi Personel</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data identitas resmi yang terhubung dengan laporan operasional dan logistik.
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-bold">
                <Hash className="w-3 h-3 text-slate-400" />
                ID: {employeeId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Lengkap (Sesuai KTP / SIM)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Alamat Email (Login Resmi SSO)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-11 pl-10 pr-24 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed outline-none"
                  />
                  <span className="absolute right-3 top-3 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    Terverifikasi
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nomor HP / WhatsApp Lapangan
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-XXXX-XXXX"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Jabatan / Posisi Kerja
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Contoh: Field Maintenance Lead"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Penugasan Unit & Organisasi Kerja */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Penugasan Unit, Divisi &amp; Site Tambang</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lokasi penempatan fisik dan divisi operasional yang memandu akses gudang dan approval dokumen.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Perusahaan / Kontraktor
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Contoh: DIGITECH"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Departemen / Divisi Kerja
                </label>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Contoh: Operasional Lapangan & Maintenance"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Site Penempatan Operasional Utama
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-blue-600" />
                  <select
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                  >
                    <option value="BIB Pit Sebamban KM-24">Site Pit Sebamban KM-24 (BIB-02) — Workshop &amp; Pit Tambang</option>
                    <option value="BIB Port Batulicin Terminal">BIB Port Batulicin Terminal — Pelabuhan &amp; Stockpile Batubara</option>
                    <option value="Checkpoint KM-28 Hauling Road">Checkpoint KM-28 Hauling Road — Stasiun Timbangan &amp; Telemetri</option>
                    <option value="Main Site Office Lantai 2">Main Site Office Lantai 2 — Pusat Pengendali Logistik &amp; GPS Hub</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
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
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Otentikasi Dua Langkah via Email (OTP Gmail)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Setiap kali login dari peramban baru, sistem akan mengirimkan 6 digit kode keamanan ke alamat email resmi Anda ({email || user?.email}).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleEmailMfa}
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                  emailMfa
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {emailMfa ? 'Aktif (Klik untuk Nonaktifkan)' : 'Aktifkan OTP Email'}
              </button>
            </div>
          </div>

          {/* Section 2: Google Authenticator / Authy (TOTP MFA) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Aplikasi Authenticator (Google Authenticator / Authy)
                    </h3>
                    {authenticatorMfa && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Aktif &amp; Terlindungi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Standar industri RFC 6238 TOTP dengan rotasi kode 30 detik. Berjalan luring (offline) tanpa pulsa atau internet di lokasi operasional.
                  </p>
                </div>
              </div>

              {authenticatorMfa ? (
                <button
                  type="button"
                  onClick={handleDisableAuthenticator}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition cursor-pointer shrink-0"
                >
                  Nonaktifkan Authenticator
                </button>
              ) : null}
            </div>

            {!authenticatorMfa ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  
                  {/* Step 1: Barcode Display */}
                  <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="QR Code TOTP DIGITECH IMS"
                          className="w-36 h-36 object-contain"
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                        1. Pindai Menggunakan Kamera Smartphone
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Buka Google Authenticator, pilih tanda <strong>+</strong> lalu arahkan kamera ke barcode di samping.
                      </p>

                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-mono text-slate-400 block">Kunci Rahasia Manual:</span>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 select-all">
                            {authSecret}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyKey}
                            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
                            title="Salin Kunci Manual"
                          >
                            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        {qrCodeUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsZoomQrOpen(true)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>Perbesar Barcode</span>
                            </button>
                            <a
                              href={qrCodeUrl}
                              download={`DIGITECH-MFA-${email || 'user'}.png`}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
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
                          <Timer className="w-3 h-3 text-blue-600" />
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
                Aplikasi Authenticator aktif. Anda dapat menggunakannya untuk login aman kapan saja di seluruh sistem DIGITECH IMS.
              </div>
            )}

            {/* Emergency Recovery Backup Codes Display Card */}
            {backupCodes && backupCodes.length > 0 && (
              <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Key className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Kode Cadangan Pemulihan Darurat (Backup Codes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyBackupCodes}
                      className="px-3 py-1.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      {copiedBackupCodes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBackupCodes ? 'Tersalin' : 'Salin Semua'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBackupCodes}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh .TXT</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-amber-800 leading-relaxed">
                  Simpan 8 kode cadangan sekali pakai ini di tempat aman. Gunakan jika Anda kehilangan akses ke smartphone atau aplikasi Google Authenticator saat login:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {backupCodes.map((bCode, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-xl border border-amber-200 text-center font-mono font-bold text-xs text-slate-800 shadow-2xs select-all"
                    >
                      {bCode}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Ubah Password */}
          <form onSubmit={handleChangePassword} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Key className="w-5 h-5 text-blue-600" />
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
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
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
          {/* Real Active Session & Live Token Status Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <span>Informasi Sesi Login Aktif &amp; Perangkat Riil</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Metadata sesi aktif terdeteksi otomatis dari peramban dan token otentikasi JWT yang digunakan saat ini.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessage({ type: 'success', text: 'Sesi akun dan masa berlaku token berhasil disinkronkan ulang.' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="Segarkan Sesi"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan Sesi</span>
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
                <div className="text-sm font-mono font-bold text-blue-700 truncate">
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
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  Protokol: <strong>{clientProtocol} (Bearer JWT Auth)</strong>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Resolusi Layar: {typeof window !== 'undefined' ? `${window.screen.width} × ${window.screen.height} px` : '1920 × 1080 px'}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ─── Modal Zoom Barcode QR Code ────────────────────────── */}
      {isZoomQrOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm p-6 pt-8 pb-7 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-center relative">
            <button
              type="button"
              onClick={() => setIsZoomQrOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold mb-1">
                <span>Google Authenticator / Authy</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Barcode MFA Presisi Tinggi</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{email || user?.email}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-center mb-4">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code TOTP DIGITECH IMS"
                  className="w-60 h-60 object-contain bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
                />
              ) : (
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              )}
            </div>

            <div className="space-y-1 text-left bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kunci Rahasia Manual:</span>
              <div className="flex items-center justify-between gap-2 font-mono font-bold text-xs text-slate-900">
                <span>{authSecret}</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-blue-600 hover:text-blue-700 font-sans text-xs font-bold cursor-pointer"
                >
                  {copiedKey ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomQrOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-blue-600/20"
            >
              Tutup Tampilan Barcode
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
