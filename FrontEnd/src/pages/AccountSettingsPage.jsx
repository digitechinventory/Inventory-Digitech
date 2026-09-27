import React, { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function AccountSettingsPage() {
  const { user, role, logout } = useAuth();

  // Tabs: 'profile' | 'security' | 'sessions'
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+62 812-3456-7890');
  const [department, setDepartment] = useState(user?.department || 'Operasional Lapangan & Maintenance');
  const [company, setCompany] = useState(user?.company || 'PT Borneo Indobara (BIB)');

  // Security Form State
  const [emailMfa, setEmailMfa] = useState(false);
  const [authenticatorMfa, setAuthenticatorMfa] = useState(false);
  const [authSecret] = useState('JBSWY3DPEHPK3PXP');
  const [authCode, setAuthCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

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
          setCompany(p.company || 'PT Borneo Indobara (BIB)');
          setEmailMfa(Boolean(p.email_mfa_enabled));
          setAuthenticatorMfa(Boolean(p.authenticator_mfa_enabled));
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

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-red-600" />
            Pengaturan Akun & Keamanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola profil identitas diri, verifikasi keamanan dua langkah (MFA), dan perlindungan akun
          </p>
        </div>

        {/* User Identity Chip */}
        <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span>{role || 'User'}</span>
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
                    placeholder="Contoh: PT Borneo Indobara (BIB)"
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
              <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Langkah Penyiapan Authenticator:
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                  
                  {/* Step 1: Scan QR Code */}
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
                    <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center text-slate-700">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-800 block">1. Scan Barcode / Input Manual</span>
                      <p className="text-slate-500">Kunci Rahasia (Secret Key):</p>
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        <span>{authSecret}</span>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="text-red-600 hover:text-red-700"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Verification Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      2. Masukkan 6 Digit Kode Verifikasi
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 123456"
                        className="w-36 h-10 px-3 text-center tracking-widest font-mono text-base font-bold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyAuthenticator}
                        disabled={saving || authCode.length !== 6}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        Verifikasi &amp; Simpan
                      </button>
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

      {/* ─── TAB 3: SESI AKTIF & LOGOUT ───────────────────────── */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900">Perangkat &amp; Sesi Aktif Saat Ini</h3>
          
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                PC
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Perangkat Ini (Sesi Aktif)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  IP: Localhost / 100.100.98.113 • Digitech Web Client v1.0
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              Online
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <div className="text-xs text-slate-400">
              Jika Anda mencurigai aktivitas mencurigakan, keluar dari semua sesi.
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Keluar dari Akun (Logout)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
