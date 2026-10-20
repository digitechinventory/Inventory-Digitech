/**
 * security.js — Middleware Keamanan Terpusat Digitech IMS
 *
 * Proteksi yang diimplementasikan:
 * 1. Rate Limiting Global  — maks 200 req/menit per IP
 * 2. Brute Force Login     — maks 5 percobaan gagal / 15 menit, lalu 30 menit lockout
 * 3. Strict Rate Limit API — maks 60 req/menit untuk endpoint sensitif
 * 4. XSS / SQL Injection Detection — blokir payload berbahaya di body
 * 5. Attack Logging        — catat semua percobaan serangan
 */

import rateLimit from 'express-rate-limit';

// In-memory store untuk tracking brute force
// Format: { ip: { attempts: number, lockedUntil: timestamp, lastAttempt: timestamp } }
const loginAttempts = new Map();

// Bersihkan entri lama setiap 1 jam
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > 60 * 60 * 1000) {
      loginAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);
if (cleanupTimer && cleanupTimer.unref) cleanupTimer.unref();

// ─── 1. GLOBAL RATE LIMITER ────────────────────────────────────────────────
export const globalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api'),
  handler: (req, res) => {
    console.warn(`[Security] Rate limit exceeded: ${getClientIp(req)} → ${req.method} ${req.path}`);
    res.status(429).json({
      success: false,
      statusCode: 429,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Terlalu banyak permintaan. Tunggu 1 menit sebelum mencoba lagi.',
        retryAfter: '60 detik'
      }
    });
  }
});

// ─── 2. STRICT RATE LIMITER (endpoint sensitif) ────────────────────────────
export const strictRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[Security] Strict rate limit exceeded: ${getClientIp(req)} → ${req.path}`);
    res.status(429).json({
      success: false,
      statusCode: 429,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.',
        retryAfter: '60 detik'
      }
    });
  }
});

// ─── 3. AUTH RATE LIMITER (khusus login/register) ─────────────────────────
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 menit
  max: 100,
  skip: (req) => {
    const ip = getClientIp(req);
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = getClientIp(req);
    console.warn(`[Security] Auth rate limit exceeded: ${ip}`);
    res.status(429).json({
      success: false,
      statusCode: 429,
      error: {
        code: 'AUTH_RATE_LIMITED',
        message: 'Terlalu banyak percobaan login dari IP Anda. Coba lagi dalam 15 menit.',
        retryAfter: '15 menit'
      }
    });
  }
});

// ─── 4. BRUTE FORCE PROTECTION (tracking gagal per IP & Email) ───────────
export function bruteForceProtection(req, res, next) {
  const ip = getClientIp(req);
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
  const now = Date.now();
  const MAX_ACCOUNT_ATTEMPTS = 5; // 5 kali gagal per akun -> akun dikunci
  const MAX_IP_ATTEMPTS = 20;      // 20 kali gagal per IP (mencegah credential spraying pada NAT kantor)
  const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;  // 15 menit window
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit durasi lockout

  const ipKey = `ip:${ip}`;
  const emailKey = rawEmail ? `acc:${rawEmail}` : null;

  const ipRecord = loginAttempts.get(ipKey) || { attempts: 0, lockedUntil: 0, lastAttempt: 0 };
  const emailRecord = emailKey ? (loginAttempts.get(emailKey) || { attempts: 0, lockedUntil: 0, lastAttempt: 0 }) : null;

  // Cek apakah akun atau IP sedang dalam status lockout aktif
  const isAccountActiveLock = emailRecord?.lockedUntil && now < emailRecord.lockedUntil;
  const isIpActiveLock = ipRecord?.lockedUntil && now < ipRecord.lockedUntil;

  if (isAccountActiveLock || isIpActiveLock) {
    const activeLockRecord = isAccountActiveLock ? emailRecord : ipRecord;
    const remainingSeconds = Math.max(1, Math.ceil((activeLockRecord.lockedUntil - now) / 1000));
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const targetLabel = isAccountActiveLock ? `Akun (${rawEmail})` : `IP (${ip})`;
    console.warn(`[Security] Brute force lockout aktif: ${targetLabel} — ${remainingMinutes} mnt (${remainingSeconds} dtk) tersisa`);
    return res.status(429).json({
      success: false,
      statusCode: 429,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: `${targetLabel} dikunci sementara selama ${remainingMinutes} menit (${remainingSeconds} detik lagi) karena terlalu banyak percobaan login yang gagal. Silakan coba kembali nanti.`,
        lockedUntil: activeLockRecord.lockedUntil,
        remainingMinutes,
        remainingSeconds
      }
    });
  }

  // Reset window jika waktu window telah lewat
  if (now - ipRecord.lastAttempt > LOCKOUT_WINDOW_MS) {
    ipRecord.attempts = 0;
    ipRecord.lockedUntil = 0;
  }
  if (emailRecord && (now - emailRecord.lastAttempt > LOCKOUT_WINDOW_MS)) {
    emailRecord.attempts = 0;
    emailRecord.lockedUntil = 0;
  }

  // Expose callbacks ke auth route
  req._bruteForceIp = ip;
  req._bruteForceEmail = rawEmail;

  req._bruteForceSuccess = () => {
    if (emailKey) loginAttempts.delete(emailKey);
  };

  req._bruteForceFail = () => {
    const currentTime = Date.now();
    ipRecord.attempts += 1;
    ipRecord.lastAttempt = currentTime;

    let emailAttempts = 0;
    if (emailRecord) {
      emailRecord.attempts += 1;
      emailRecord.lastAttempt = currentTime;
      emailAttempts = emailRecord.attempts;
    }

    const isAccountLocked = emailRecord && emailRecord.attempts >= MAX_ACCOUNT_ATTEMPTS;
    const isIpLocked = ipRecord.attempts >= MAX_IP_ATTEMPTS;
    const isLocked = Boolean(isAccountLocked || isIpLocked);
    let lockUntil = 0;

    if (isAccountLocked && emailRecord) {
      lockUntil = currentTime + LOCKOUT_DURATION_MS;
      emailRecord.lockedUntil = lockUntil;
      console.warn(`[Security] LOCKOUT AKUN: ${rawEmail} dikunci 15 menit setelah ${emailRecord.attempts} kegagalan berturut-turut`);
    }

    if (isIpLocked) {
      lockUntil = currentTime + LOCKOUT_DURATION_MS;
      ipRecord.lockedUntil = lockUntil;
      console.warn(`[Security] LOCKOUT IP: ${ip} dikunci 15 menit setelah ${ipRecord.attempts} kegagalan berturut-turut`);
    }

    loginAttempts.set(ipKey, ipRecord);
    if (emailKey && emailRecord) loginAttempts.set(emailKey, emailRecord);

    const remainingAttempts = emailRecord
      ? Math.max(0, MAX_ACCOUNT_ATTEMPTS - emailRecord.attempts)
      : Math.max(0, MAX_IP_ATTEMPTS - ipRecord.attempts);

    const remainingMinutes = isLocked ? Math.ceil(LOCKOUT_DURATION_MS / 60000) : 0;
    const remainingSeconds = isLocked ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0;

    return {
      attempts: emailRecord ? emailRecord.attempts : ipRecord.attempts,
      maxAttempts: emailRecord ? MAX_ACCOUNT_ATTEMPTS : MAX_IP_ATTEMPTS,
      remainingAttempts,
      isLocked,
      lockedUntil: lockUntil,
      remainingMinutes,
      remainingSeconds
    };
  };

  next();
}

// ─── 5. XSS & SQL INJECTION DETECTION ─────────────────────────────────────
const DANGEROUS_PATTERNS = [
  /(\bSELECT\b.*\bFROM\b|\bINSERT\b.*\bINTO\b|\bDELETE\b.*\bFROM\b|\bDROP\b.*\bTABLE\b|\bUNION\b.*\bSELECT\b)/i,
  /('|(--|#|\/\*).*(\bOR\b|\bAND\b).*\b(=|LIKE)\b)/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript:/i,
  /\.\.(\/|\\)/,
  /[;&|`$].*(?:rm|del|format|shutdown|wget|curl|bash|sh\s|cmd|powershell)/i,
];

export function xssInjectionGuard(req, res, next) {
  // Lewati pengecekan data binary/base64 gambar agar tidak false positive akibat kombinasi karakter acak base64
  let cleanBody = {};
  try {
    if (req.body && typeof req.body === 'object') {
      const sanitizeObj = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(sanitizeObj);
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string') {
            if (
              v.startsWith('data:image/') ||
              k.toLowerCase().includes('signature') ||
              (v.length > 300 && /^[A-Za-z0-9+/=_-]+$/.test(v))
            ) {
              result[k] = '[BASE64_DATA]';
            } else {
              result[k] = v;
            }
          } else if (typeof v === 'object' && v !== null) {
            result[k] = sanitizeObj(v);
          } else {
            result[k] = v;
          }
        }
        return result;
      };
      cleanBody = sanitizeObj(req.body);
    }
  } catch {
    cleanBody = {};
  }

  const bodyStr = JSON.stringify(cleanBody || {}).substring(0, 5000);
  const queryStr = JSON.stringify(req.query || {});
  const combined = bodyStr + queryStr;

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(combined)) {
      const ip = getClientIp(req);
      console.error(`[Security] ATTACK DETECTED from ${ip}: ${req.method} ${req.path}`);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input mengandung karakter yang tidak diperbolehkan oleh sistem.'
        }
      });
    }
  }
  next();
}

// ─── 6. SECURITY HEADERS TAMBAHAN ──────────────────────────────────────────
export function additionalSecurityHeaders(req, res, next) {
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/users')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Hanya kirim Strict-Transport-Security jika koneksi benar-benar HTTPS / di balik reverse proxy SSL
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

// ─── Helper: Dapatkan IP asli (support behind nginx/proxy) ────────────────
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
