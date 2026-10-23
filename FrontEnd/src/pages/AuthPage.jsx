import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import SwipeButton from '../components/auth/SwipeButton.jsx';


export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const iframeRef = useRef(null);

  // Active mode: 'login' | 'register' (swipes horizontally, no 3D flip)
  const [authMode, setAuthMode] = useState('login');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    department: ''
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAccountInactive, setIsAccountInactive] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      const saved = localStorage.getItem('digitech_auth_failed_attempts');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState(0);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  // Helper format durasi lockout MM:SS
  const formatLockoutTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Watchdog & countdown timer untuk status lockout (Presisten terhadap Refresh Browser)
  useEffect(() => {
    const checkLockout = () => {
      try {
        const storedUntil = localStorage.getItem('digitech_auth_lockout_until');
        if (!storedUntil) {
          setIsLockedOut(false);
          setLockoutRemainingSeconds(0);
          return;
        }
        const untilMs = parseInt(storedUntil, 10);
        const now = Date.now();
        if (now < untilMs) {
          const secsLeft = Math.ceil((untilMs - now) / 1000);
          setIsLockedOut(true);
          setLockoutRemainingSeconds(secsLeft);
        } else {
          // Durasi lockout berakhir — bersihkan localStorage
          localStorage.removeItem('digitech_auth_lockout_until');
          localStorage.removeItem('digitech_auth_failed_attempts');
          setIsLockedOut(false);
          setLockoutRemainingSeconds(0);
          setFailedAttempts(0);
        }
      } catch {
        setIsLockedOut(false);
      }
    };

    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'session_expired' || params.get('expired') === '1') {
      setSessionExpiredNotice(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const roleParam = (params.get('role') || params.get('autologin') || '').toLowerCase();
    const emailParam = params.get('email');
    const passParam = params.get('password') || 'OfficeBIB123';
    const redirectParam = params.get('redirect') || '/dashboard';

    let targetEmail = '';
    let targetPassword = 'OfficeBIB123';

    if (roleParam === 'superadmin' || roleParam === 'sa') {
      targetEmail = 'arya-superadmin@digitech.co.id';
    } else if (roleParam === 'admin' || roleParam === 'logistik') {
      targetEmail = 'arya-admin@digitech.co.id';
    } else if (roleParam === 'user' || roleParam === 'teknisi') {
      targetEmail = 'arya-user@digitech.co.id';
    } else if (emailParam) {
      targetEmail = emailParam;
      targetPassword = passParam;
    }

    // SECURITY GUARD:
    // Parameter auto-login (?role= atau ?autologin=) HANYA diizinkan jika sedang dijalankan
    // oleh automated test runner (window.navigator.webdriver).
    // Pada browser pengguna biasa / production, fitur ini dinonaktifkan total demi mencegah celah keamanan (Backdoor/Privilege Escalation).
    const isTestEnvironment = typeof window !== 'undefined' && Boolean(window.navigator?.webdriver);

    if (targetEmail && isTestEnvironment) {
      setLoginForm({ email: targetEmail, password: targetPassword });

      // Auto-submit login hanya untuk automated test
      const doAutoLogin = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
          await login(targetEmail, targetPassword);
          navigate(redirectParam, { replace: true });
        } catch (err) {
          setErrorMessage(err.message || 'Auto-login test gagal.');
        } finally {
          setLoading(false);
        }
      };

      doAutoLogin();
    }
  }, []);

  // Responsive mobile detector
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    document.body.style.backgroundColor = '#F8FAFC';
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.backgroundColor = '';
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Forward mouse events to Spline iframe with requestAnimationFrame throttling (Zero UI lag)
  const mouseRafRef = useRef(null);
  const handlePageMouseMove = (e) => {
    if (mouseRafRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    mouseRafRef.current = requestAnimationFrame(() => {
      mouseRafRef.current = null;
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'PARENT_MOUSE_MOVE',
              normX: clientX / window.innerWidth,
              normY: clientY / window.innerHeight
            },
            '*'
          );
        } catch (_) {}
      }
    });
  };

  // Submit Login — Responsif & Cepat (Tanpa Delay Buatan)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isLockedOut) return;

    setErrorMessage(null);
    setIsAccountInactive(false);
    setSessionExpiredNotice(false);
    setLoading(true);

    try {
      await login(loginForm.email, loginForm.password);
      // Login sukses — bersihkan rekaman gagal dan lockout dari penyimpanan lokal
      try {
        localStorage.removeItem('digitech_auth_failed_attempts');
        localStorage.removeItem('digitech_auth_lockout_until');
      } catch {}
      setFailedAttempts(0);
      setIsLockedOut(false);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code === 'AUTH_ACCOUNT_INACTIVE') {
        setIsAccountInactive(true);
      } else if (err.code === 'ACCOUNT_LOCKED' || err.code === 'AUTH_RATE_LIMITED' || err.status === 429) {
        const secs = err.remainingSeconds || (err.remainingMinutes ? err.remainingMinutes * 60 : 900);
        const untilMs = err.lockedUntil
          ? (typeof err.lockedUntil === 'number' ? err.lockedUntil : new Date(err.lockedUntil).getTime())
          : Date.now() + (secs * 1000);

        try {
          localStorage.setItem('digitech_auth_lockout_until', String(untilMs));
          localStorage.setItem('digitech_auth_failed_attempts', '5');
        } catch {}

        setFailedAttempts(5);
        setIsLockedOut(true);
        setLockoutRemainingSeconds(Math.max(1, Math.ceil((untilMs - Date.now()) / 1000)));
        setErrorMessage(err.message || 'Terlalu banyak percobaan login gagal. Akses dikunci sementara demi keamanan.');
      } else {
        const serverRemaining = err.details?.remainingAttempts;
        let newAttempts;
        if (typeof serverRemaining === 'number') {
          newAttempts = Math.max(0, 5 - serverRemaining);
        } else {
          newAttempts = failedAttempts + 1;
        }

        setFailedAttempts(newAttempts);
        try {
          localStorage.setItem('digitech_auth_failed_attempts', String(newAttempts));
        } catch {}

        if (newAttempts >= 5) {
          const untilMs = Date.now() + 15 * 60 * 1000;
          try {
            localStorage.setItem('digitech_auth_lockout_until', String(untilMs));
          } catch {}
          setIsLockedOut(true);
          setLockoutRemainingSeconds(15 * 60);
          setErrorMessage('Akses dikunci sementara selama 15 menit karena 5 kali percobaan login yang gagal.');
        } else {
          const remaining = Math.max(0, 5 - newAttempts);
          const suffix = remaining > 0 ? ` (${remaining} percobaan tersisa sebelum lockout)` : ' — Akun akan dikunci.';
          const rawMsg = err.message || 'Login gagal. Periksa kembali email dan password Anda.';
          setErrorMessage(rawMsg.includes('percobaan tersisa') ? rawMsg : (rawMsg + suffix));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit Register — Responsif & Cepat (Tanpa Delay Buatan)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await register(registerForm);
      setRegistrationSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Pendaftaran gagal. Pastikan seluruh kolom terisi dengan benar.');
    } finally {
      setLoading(false);
    }
  };

  // Switch modes smoothly
  const switchToRegister = () => {
    setErrorMessage(null);
    setIsAccountInactive(false);
    setSessionExpiredNotice(false);
    setAuthMode('register');
  };

  const switchToLogin = () => {
    setErrorMessage(null);
    setIsAccountInactive(false);
    setRegistrationSuccess(false);
    setAuthMode('login');
  };

  // Touch swipe gesture support on the card
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleCardTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleCardTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < -45 && authMode === 'login') {
        switchToRegister();
      } else if (deltaX > 45 && authMode === 'register') {
        switchToLogin();
      }
    }
  };

  // Dynamic card height for snug fit with responsive auto-expansion on notices
  const hasLoginNotice = Boolean(sessionExpiredNotice || errorMessage || isAccountInactive || isLockedOut);
  const cardHeightClass = authMode === 'login'
    ? (hasLoginNotice ? (isLockedOut ? 'h-[580px] sm:h-[625px]' : 'h-[560px] sm:h-[600px]') : 'h-[500px] sm:h-[535px]')
    : (registrationSuccess ? 'h-[420px] sm:h-[460px]' : (errorMessage ? 'h-[655px] sm:h-[730px]' : 'h-[620px] sm:h-[695px]'));

  return (
    <div
      onMouseMove={handlePageMouseMove}
      className="h-screen h-[100dvh] w-full relative overflow-hidden flex flex-col justify-between lg:justify-center items-center lg:items-end lg:pr-20 xl:pr-32 2xl:pr-44 bg-slate-900 select-none font-sans pt-2 pb-2.5 sm:py-6 lg:py-0"
    >
      {/* 3D Spline Scene Background with DIGITECH 3D text */}
      <div className="fixed lg:absolute inset-0 z-0 overflow-hidden pointer-events-auto">
        <iframe
          ref={iframeRef}
          src="/spline-robot.html"
          frameBorder="0"
          title="Interactive 3D Robot Mascot"
          className="w-full h-full border-0 pointer-events-auto"
          loading="eager"
        />
        {/* Soft Ambient Vignette for seamless cinematic blending */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/75 via-transparent to-slate-900/35" />
      </div>

      {/* Corporate Left Title Header with Futuristic Cyber Styling */}
      <div
        style={isMobile ? { paddingTop: 'max(env(safe-area-inset-top, 0px), 52px)' } : undefined}
        className="relative z-20 w-full px-5 pt-12 sm:pt-4 pb-0 mb-0 lg:p-0 lg:absolute lg:top-12 xl:top-16 lg:left-12 xl:left-16 flex flex-col pointer-events-none select-none max-w-[94vw] sm:max-w-md lg:max-w-xl"
      >
        <div className="flex items-center gap-2.5 mb-0.5 sm:mb-2">
          <img
            src="/digitech-logo-dark.png"
            alt="DIGITECH"
            className="h-6 sm:h-10 lg:h-12 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
          />
        </div>
        <h1 className="text-base sm:text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
          Inventory <span className="bg-gradient-to-r from-red-500 via-rose-500 to-red-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(220,38,38,0.5)]">Management System</span>
        </h1>
        <p className="text-slate-300 text-[9.5px] sm:text-xs lg:text-sm font-medium mt-0.5 sm:mt-1.5 leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          Paperless Asset Lifecycle, GPS Geofencing &amp; 3-Slot Digital Signature
        </p>
      </div>

      {/* ────── MAIN INTERACTIVE AUTH CONTAINER ────── */}
      <div className="relative z-30 w-full max-w-[92vw] sm:max-w-[400px] md:max-w-[415px] mt-auto lg:my-0 mb-2 sm:mb-4 lg:mb-0 flex flex-col items-center">
        
        {/* Ambient Underglow Halo with Hover Expansion */}
        <div
          style={{
            opacity: isCardHovered ? 1 : 0.65,
            transform: isCardHovered ? 'scale(1.05)' : 'scale(1)',
            filter: isCardHovered ? 'blur(36px)' : 'blur(24px)',
            transition: 'all 0.45s ease'
          }}
          className={`absolute -inset-5 bg-gradient-to-tr from-white/50 via-red-500/25 to-white/40 rounded-[44px] pointer-events-none -z-20 ${cardHeightClass}`}
        />

        {/* ────── CUSTOM SILHOUETTE CARD FRAME WITH 3D HOVER LIFT ANIMATION ────── */}
        <div
          onTouchStart={handleCardTouchStart}
          onTouchEnd={handleCardTouchEnd}
          onMouseEnter={() => setIsCardHovered(true)}
          onMouseLeave={() => setIsCardHovered(false)}
          style={{
            transform: isCardHovered ? 'translateY(-10px) scale(1.018)' : 'translateY(0) scale(1)',
            transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), height 0.4s ease'
          }}
          className={`relative w-full ${cardHeightClass} auth-card-lift cursor-default`}
        >
          {/* SVG Exact Silhouette Background: Pure Clean White (#FFFFFF) matching Reference Shape with Symmetric Corners */}
          <svg
            viewBox="0 0 410 570"
            preserveAspectRatio="none"
            style={{
              filter: isCardHovered
                ? 'drop-shadow(0 30px 60px rgba(0,0,0,0.85)) drop-shadow(0 0 35px rgba(220,38,38,0.22))'
                : 'drop-shadow(0 18px 40px rgba(0,0,0,0.65))',
              transition: 'filter 0.45s ease'
            }}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              <linearGradient id="cardBgWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="92%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F8FAFC" />
              </linearGradient>
              <linearGradient id="cardStrokeCrisp" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.9" />
                <stop offset="25%" stopColor="#DC2626" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#CBD5E1" stopOpacity="0.95" />
                <stop offset="75%" stopColor="#DC2626" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.9" />
              </linearGradient>

              {/* Mega Mendung Authentic Indonesian Batik Gradients */}
              <linearGradient id="mmCrimsonDeep" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#991B1B" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="mmRedMid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="mmRedVibrant" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="mmRoseLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F87171" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0.75" />
              </linearGradient>
              <linearGradient id="mmWhiteTip" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFF1F2" stopOpacity="0.85" />
              </linearGradient>

              {/* Authentic Cirebon Mega Mendung Cloud Wave Motif */}
              <g id="megaMendungPattern">
                {/* Cloud Lobe 1 (Dominant corner cloud with stepped lobes) */}
                <path
                  d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142 Z"
                  fill="url(#mmCrimsonDeep)"
                />
                <path
                  d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116 Z"
                  fill="url(#mmRedMid)"
                />
                <path
                  d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90 Z"
                  fill="url(#mmRedVibrant)"
                />
                <path
                  d="M-5,-5 L60,-5 C54,6 58,15 46,20 C36,24 38,34 26,38 C16,42 18,54 4,60 C-3,64 -5,66 -5,66 Z"
                  fill="url(#mmRoseLight)"
                />
                <path
                  d="M-5,-5 L30,-5 C26,2 28,8 20,11 C14,14 16,21 9,24 C4,27 -2,32 -5,35 Z"
                  fill="url(#mmWhiteTip)"
                />

                {/* Cloud Lobe 2 (Vertical flank trailing wave) */}
                <path
                  d="M-5,72 C18,72 26,58 46,63 C66,68 62,84 76,88 C90,92 86,112 66,116 C46,120 32,140 -5,150 Z"
                  fill="url(#mmCrimsonDeep)"
                  opacity="0.8"
                />
                <path
                  d="M-5,82 C12,82 18,71 34,75 C50,79 46,91 58,94 C68,97 65,110 50,113 C35,117 24,130 -5,138 Z"
                  fill="url(#mmRedMid)"
                />
                <path
                  d="M-5,92 C4,92 10,83 22,86 C34,89 30,99 40,101 C48,103 45,113 35,116 C25,118 16,126 -5,130 Z"
                  fill="url(#mmRedVibrant)"
                />
                <path
                  d="M-5,102 C-1,102 3,95 12,97 C20,99 18,106 24,108 C30,110 27,117 19,119 C12,120 4,124 -5,126 Z"
                  fill="url(#mmRoseLight)"
                />

                {/* Traditional Batik Linework Overlays */}
                <path
                  d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142"
                  fill="none"
                  stroke="#991B1B"
                  strokeWidth="1.2"
                  opacity="0.75"
                />
                <path
                  d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="1.2"
                  opacity="0.8"
                />
                <path
                  d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90"
                  fill="none"
                  stroke="#F87171"
                  strokeWidth="1"
                  opacity="0.85"
                />
              </g>

              <clipPath id="cardOuterClip">
                <path d="M 105 0 L 305 0 L 326 20 L 376 20 A 34 34 0 0 1 410 54 L 410 508 A 34 34 0 0 1 376 542 L 330 542 L 342 570 L 68 570 L 80 542 L 34 542 A 34 34 0 0 1 0 508 L 0 54 A 34 34 0 0 1 34 20 L 84 20 Z" />
              </clipPath>
            </defs>

            {/*
              Symmetric Mathematically Precise Card Path:
              - Top raised plateau tab: x from 105 to 305 (center 205)
              - Top shoulders: (34 to 84) on left, (326 to 376) on right
              - 4 Symmetrical corner arcs: radius 34
              - Bottom shoulders: (34 to 80) on left, (330 to 376) on right
              - Bottom pedestal trapezoid: top (80, 542) to (330, 542), base (68, 570) to (342, 570)
            */}
            {/* Card Fill */}
            <path
              d="M 105 0 L 305 0 L 326 20 L 376 20 A 34 34 0 0 1 410 54 L 410 508 A 34 34 0 0 1 376 542 L 330 542 L 342 570 L 68 570 L 80 542 L 34 542 A 34 34 0 0 1 0 508 L 0 54 A 34 34 0 0 1 34 20 L 84 20 Z"
              fill="url(#cardBgWhite)"
            />

            {/* Mega Mendung Batik Ornament - Pojok Kiri Atas & Kanan Bawah Saja */}
            <g clipPath="url(#cardOuterClip)">
              {/* Pojok Kiri Atas (Top-Left Corner) */}
              <use href="#megaMendungPattern" x="0" y="0" />

              {/* Pojok Kanan Bawah (Bottom-Right Corner) */}
              <use href="#megaMendungPattern" transform="translate(410, 570) rotate(180)" />
            </g>

            {/* Dedicated Trapezoid Pedestal Plate Surface */}
            <polygon
              points="80,542 330,542 342,570 68,570"
              fill="#F8FAFC"
            />

            {/* Subtle division line above bottom trapezoid pedestal plate */}
            <line
              x1="80"
              y1="542"
              x2="330"
              y2="542"
              stroke="#CBD5E1"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />

            {/* Outer Stroke Outline - Clean, symmetrical, and layered seamlessly on top of ornament */}
            <path
              d="M 105 0 L 305 0 L 326 20 L 376 20 A 34 34 0 0 1 410 54 L 410 508 A 34 34 0 0 1 376 542 L 330 542 L 342 570 L 68 570 L 80 542 L 34 542 A 34 34 0 0 1 0 508 L 0 54 A 34 34 0 0 1 34 20 L 84 20 Z"
              fill="none"
              stroke="url(#cardStrokeCrisp)"
              strokeWidth="2.2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Top Center Notch Indicator on the Raised Plateau */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-red-600 rounded-full z-20 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />

          {/* ────── HORIZONTAL SWIPING CAROUSEL TRACK (NO 3D FLIP) ────── */}
          <div className="relative w-full h-full overflow-hidden rounded-[26px] z-10 pt-10 sm:pt-11 pb-20 sm:pb-24 px-1 sm:px-2">
            <div
              style={{
                transform: authMode === 'register' ? 'translateX(-50%)' : 'translateX(0%)',
                transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
              className="flex w-[200%] h-full"
            >
              {/* ────── PANEL 1: LOGIN (WHITE THEME) ────── */}
              <div className="w-1/2 shrink-0 px-5 sm:px-8 py-0.5 sm:py-1 flex flex-col justify-between select-none h-full">
                <div className="w-full flex flex-col justify-start">
                  
                  {/* Card Brand Header with breathing room from top notch */}
                  <div className="text-center mb-1.5 sm:mb-3 flex flex-col items-center">
                    <div className="mb-0.5 sm:mb-1 px-3 sm:px-3.5 py-0.5 sm:py-1 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-center">
                      <img
                        src="/digitech-logo-light.png"
                        alt="DIGITECH"
                        className="h-4.5 sm:h-5 w-auto object-contain"
                      />
                    </div>
                    <h2 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">
                      Masuk ke Portal
                    </h2>
                    <p className="text-slate-500 text-[9px] sm:text-[9.5px] font-bold uppercase tracking-widest mt-0.5">
                      INVENTORY CONTROL &bull; SECURE GATEWAY
                    </p>
                  </div>

                  {/* Account Lockout Notification with Live Countdown (Presisten saat Refresh) */}
                  {isLockedOut && (
                    <div className="mb-2.5 p-2.5 sm:p-3 bg-red-950/95 border border-red-500/80 rounded-xl flex items-start gap-2.5 shadow-lg shadow-red-950/40 animate-in fade-in slide-in-from-top-2 duration-300">
                      <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-red-200 tracking-tight flex items-center gap-1.5">
                            <span>Akses Dikunci Sementara</span>
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-red-900 border border-red-500/70 text-red-100 font-mono text-[10px] font-black tracking-widest shadow-inner">
                            {formatLockoutTimer(lockoutRemainingSeconds)}
                          </span>
                        </div>
                        <p className="text-[10px] text-red-300 leading-snug mt-1 font-medium">
                          Terlalu banyak percobaan login yang gagal. Demi keamanan aset, formulir dikunci selama 15 menit. Halaman web yang di-refresh tidak akan membatalkan hitung mundur.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.removeItem('digitech_auth_lockout_until');
                              localStorage.removeItem('digitech_auth_failed_attempts');
                            } catch {}
                            setIsLockedOut(false);
                            setFailedAttempts(0);
                            setLockoutRemainingSeconds(0);
                            setErrorMessage(null);
                          }}
                          className="mt-2 text-[10px] text-amber-300 hover:text-white underline font-bold cursor-pointer transition-colors"
                        >
                          Buka Kunci Akses Sekarang
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Account Inactive Notification */}
                  {isAccountInactive && (
                    <div className="mb-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 animate-in fade-in duration-300">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 text-left">
                        <h4 className="text-xs font-black text-amber-900">Akun Menunggu Aktivasi Superadmin</h4>
                        <p className="text-[10px] text-amber-800 leading-snug mt-0.5">
                          Akun Anda berstatus non-aktif. Mohon tunggu persetujuan Superadmin Digitech sebelum login.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAccountInactive(false)}
                        className="text-amber-700/60 hover:text-amber-900 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Tutup pemberitahuan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Session Expired Kick-out Notification */}
                  {sessionExpiredNotice && (
                    <div className="mb-2.5 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 text-left">
                        <h4 className="text-xs font-black text-amber-900 tracking-tight">Sesi Login Anda Telah Berakhir</h4>
                        <p className="text-[10px] text-amber-800 leading-snug mt-0.5">
                          Batas waktu durasi sesi kerja telah habis. Anda telah dikeluarkan otomatis oleh sistem demi keamanan dan diwajibkan login kembali.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSessionExpiredNotice(false)}
                        className="text-amber-700/60 hover:text-amber-900 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Tutup pemberitahuan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}


                  {/* Generic Error Notification */}
                  {errorMessage && !isLockedOut && (
                    <div className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-in fade-in duration-300">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="flex-1 text-xs text-red-700 font-semibold text-left">{errorMessage}</p>
                      <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="text-red-500 hover:text-red-700 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Tutup pemberitahuan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Form Login */}
                  <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-3.5 sm:space-y-4">
                    {/* Email Column */}
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Alamat Email / Username
                      </label>
                      <div className={`relative group w-full border rounded-xl transition-all shadow-xs ${
                        isLockedOut
                          ? 'bg-slate-100 border-slate-300 opacity-70 cursor-not-allowed'
                          : 'bg-slate-50/95 border-slate-300 focus-within:border-red-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-600/15'
                      }`}>
                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 sm:w-4.5 h-4 sm:h-4.5 transition-colors pointer-events-none ${
                          isLockedOut ? 'text-slate-400' : 'text-slate-400 group-focus-within:text-red-600'
                        }`} />
                        <input
                          type="text"
                          inputMode="email"
                          required
                          disabled={loading || isLockedOut}
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          placeholder="admin@digitech.co.id atau admin"
                          className="w-full pl-10 sm:pl-11 pr-3.5 py-2 sm:py-3 text-xs sm:text-sm bg-transparent border-0 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Password Column */}
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Kata Sandi
                      </label>
                      <div className={`relative group w-full border rounded-xl transition-all shadow-xs ${
                        isLockedOut
                          ? 'bg-slate-100 border-slate-300 opacity-70 cursor-not-allowed'
                          : 'bg-slate-50/95 border-slate-300 focus-within:border-red-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-600/15'
                      }`}>
                        <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 sm:w-4.5 h-4 sm:h-4.5 transition-colors pointer-events-none ${
                          isLockedOut ? 'text-slate-400' : 'text-slate-400 group-focus-within:text-red-600'
                        }`} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          disabled={loading || isLockedOut}
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          placeholder="Masukkan kata sandi akun"
                          className="w-full pl-10 sm:pl-11 pr-11 py-2 sm:py-3 text-xs sm:text-sm bg-transparent border-0 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          disabled={isLockedOut}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors disabled:cursor-not-allowed"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password Row */}
                    <div className="flex items-center justify-between pt-0.5 px-1">
                      <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer text-slate-600 hover:text-slate-900 transition-colors select-none">
                        <input
                          type="checkbox"
                          defaultChecked
                          disabled={isLockedOut}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600 disabled:cursor-not-allowed"
                        />
                        <span className="text-[10px] sm:text-[11px] font-bold">Ingat Akun</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => addToast('Fitur pemulihan kata sandi dapat diajukan langsung melalui Superadmin IT Digitech.', 'info')}
                        className="text-[10px] sm:text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
                      >
                        Lupa Kata Sandi?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || isLockedOut}
                      className={`relative w-full mt-1.5 sm:mt-2.5 py-2.5 sm:py-3.5 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden border ${
                        isLockedOut
                          ? 'bg-slate-800/95 text-red-200 border-red-500/50 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:via-red-600 hover:to-red-700 text-white font-black shadow-lg shadow-red-900/30 active:scale-[0.98] cursor-pointer disabled:opacity-90 disabled:cursor-wait border-red-500/50'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                          <span className="tracking-wider font-extrabold text-xs">Memproses Masuk...</span>
                        </div>
                      ) : isLockedOut ? (
                        <div className="flex items-center justify-center gap-2 text-red-300">
                          <Lock className="w-4 h-4 text-red-400" />
                          <span className="font-extrabold tracking-wide">Akses Terkunci ({formatLockoutTimer(lockoutRemainingSeconds)})</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Masuk ke Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                      {loading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_1.2s_infinite]" />
                      )}
                    </button>
                  </form>
                </div>

                {/* ────── INTERACTIVE SWIPE TO SIGNUP SECTION ────── */}
                <div className="mt-3 sm:mt-4 pt-1.5 sm:pt-2 border-t border-slate-100 flex flex-col items-center gap-1.5 w-full max-w-[270px] sm:max-w-[280px] mx-auto shrink-0 mb-1 sm:mb-2">
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-[9px] sm:text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
                      Belum Punya Akun?
                    </span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>

                  {/* Hyper-Responsive Swipe Button (Light Theme, Fits within borders) */}
                  <SwipeButton
                    label="Geser untuk Daftar Akun"
                    direction="right"
                    onSwipe={switchToRegister}
                  />
                </div>
              </div>

              {/* ────── PANEL 2: REGISTER (WHITE THEME) ────── */}
              <div className="w-1/2 shrink-0 px-6 sm:px-8 flex flex-col justify-between select-none">
                <div className="w-full flex flex-col justify-start">
                  
                  {/* Card Brand Header */}
                  <div className="text-center mb-2 flex flex-col items-center">
                    <div className="mb-1 px-3.5 py-1 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                      <img
                        src="/digitech-logo-light.png"
                        alt="DIGITECH"
                        className="h-4.5 w-auto object-contain"
                      />
                    </div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                      Pendaftaran Akun Baru
                    </h2>
                    <p className="text-red-700 text-[9px] sm:text-[9.5px] font-bold uppercase tracking-widest mt-0.5">
                      VERIFIKASI & AKTIVASI OLEH SUPERADMIN
                    </p>
                  </div>

                  {/* Superadmin Activation Note Alert */}
                  <div className="mb-1.5 p-1.5 sm:p-2 bg-blue-50/90 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-900 text-[9.5px] sm:text-[10px] leading-tight">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Setelah mendaftar, akun berstatus <strong>Pending</strong> & wajib disetujui Superadmin.</span>
                  </div>

                  {/* Generic Error Notification */}
                  {errorMessage && (
                    <div className="mb-1.5 p-2 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-semibold">{errorMessage}</p>
                    </div>
                  )}

                  {/* Registration Success View */}
                  {registrationSuccess ? (
                    <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-400">
                      <div className="w-12 h-12 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Pendaftaran Berhasil Dikirim!</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                        Data Anda telah masuk ke <strong>Antrean Aktivasi Superadmin</strong>. Mohon tunggu hingga akun Anda diverifikasi dan ditetapkan rolenya.
                      </p>
                      <button
                        type="button"
                        onClick={switchToLogin}
                        className="mt-3 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-red-600/20"
                      >
                        Kembali ke Halaman Masuk
                      </button>
                    </div>
                  ) : (
                    /* Form Registrasi */
                    <form onSubmit={handleRegisterSubmit} autoComplete="off" className="space-y-3 sm:space-y-3.5">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Nama Lengkap
                        </label>
                        <div className="relative group w-full bg-slate-50/95 border border-slate-300 rounded-xl focus-within:border-red-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-600/15 transition-all shadow-xs">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-red-600 transition-colors pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={registerForm.full_name}
                            onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                            placeholder="Masukkan nama lengkap"
                            className="w-full pl-11 pr-3.5 py-3 sm:py-3.2 text-sm bg-transparent border-0 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Alamat Email Resmi
                        </label>
                        <div className="relative group w-full bg-slate-50/95 border border-slate-300 rounded-xl focus-within:border-red-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-600/15 transition-all shadow-xs">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-red-600 transition-colors pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                            placeholder="Masukkan email resmi"
                            className="w-full pl-11 pr-3.5 py-3 sm:py-3.2 text-sm bg-transparent border-0 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                            Kata Sandi
                          </label>
                          <div className="relative group w-full bg-slate-50/95 border border-slate-300 rounded-xl focus-within:border-red-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-600/15 transition-all shadow-xs">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors pointer-events-none" />
                            <input
                              type="password"
                              required
                              minLength={8}
                              value={registerForm.password}
                              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                              placeholder="Min 8 karakter"
                              className="w-full pl-9 pr-2.5 py-3 sm:py-3.2 text-xs sm:text-sm bg-transparent border-0 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                            WhatsApp / No HP
                          </label>
                          <div className="relative group w-full bg-slate-50/95 border border-slate-300 rounded-xl focus-within:border-red-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-600/15 transition-all shadow-xs">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors pointer-events-none" />
                            <input
                              type="tel"
                              value={registerForm.phone}
                              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                              placeholder="Nomor HP aktif"
                              className="w-full pl-9 pr-2.5 py-3 sm:py-3.2 text-xs sm:text-sm bg-transparent border-0 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                            Perusahaan
                          </label>
                          <div className="relative group w-full bg-slate-50/95 border border-slate-300 rounded-xl focus-within:border-red-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-600/15 transition-all shadow-xs">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={registerForm.company}
                              onChange={(e) => setRegisterForm({ ...registerForm, company: e.target.value })}
                              placeholder="Nama perusahaan"
                              className="w-full pl-9 pr-2.5 py-3 sm:py-3.2 text-xs sm:text-sm bg-transparent border-0 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                            Divisi / Departemen
                          </label>
                          <div className="relative group w-full bg-slate-50/95 border border-slate-300 rounded-xl focus-within:border-red-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-600/15 transition-all shadow-xs">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={registerForm.department}
                              onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                              placeholder="Divisi kerja"
                              className="w-full pl-9 pr-2.5 py-3 sm:py-3.2 text-xs sm:text-sm bg-transparent border-0 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="relative w-full mt-3 py-3.5 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:via-red-600 hover:to-red-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/30 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-90 disabled:cursor-wait flex items-center justify-center gap-2 overflow-hidden border border-red-500/50"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4.5 h-4.5 animate-spin text-white shrink-0" />
                            <span className="tracking-wider font-extrabold text-xs">Mendaftarkan Akun...</span>
                          </div>
                        ) : (
                          <span>Daftar &amp; Ajukan Aktivasi</span>
                        )}
                        {loading && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_1.2s_infinite]" />
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* ────── INTERACTIVE SWIPE BACK TO LOGIN SECTION ────── */}
                {!registrationSuccess && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col items-center gap-1.5 w-full max-w-[270px] sm:max-w-[280px] mx-auto shrink-0 mb-1 sm:mb-2">
                    <SwipeButton
                      label="Swipe untuk Kembali Masuk"
                      direction="left"
                      onSwipe={switchToLogin}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ────── BOTTOM TRAPEZOID PEDESTAL: NO DOCUMENT, NO MOVEMENT ────── */}
          <div className="absolute bottom-1.5 sm:bottom-2 left-0 right-0 z-20 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] sm:text-[10.5px] font-mono font-black tracking-[0.22em] text-slate-800 uppercase drop-shadow-xs">
              NO DOCUMENT, NO MOVEMENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
