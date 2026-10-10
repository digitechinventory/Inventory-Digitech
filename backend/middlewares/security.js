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
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > 60 * 60 * 1000) {
      loginAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);

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

// ─── 4. BRUTE FORCE PROTECTION (tracking gagal per IP) ────────────────────
export function bruteForceProtection(req, res, next) {
  const ip = getClientIp(req);
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return next();
  }
  const now = Date.now();
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
  const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

  const record = loginAttempts.get(ip) || { attempts: 0, lockedUntil: 0, lastAttempt: 0 };

  // Cek lockout aktif
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    console.warn(`[Security] Brute force lockout: ${ip} — ${remainingMinutes} mnt tersisa`);
    return res.status(429).json({
      success: false,
      statusCode: 429,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: `Akses dari IP Anda dikunci ${remainingMinutes} menit lagi karena terlalu banyak percobaan login gagal. Hubungi admin jika ini bukan Anda.`,
        lockedUntil: new Date(record.lockedUntil).toISOString(),
        remainingMinutes
      }
    });
  }

  // Reset jika window sudah berlalu
  if (now - record.lastAttempt > LOCKOUT_WINDOW_MS) {
    record.attempts = 0;
    record.lockedUntil = 0;
  }

  // Expose callback ke auth route
  req._bruteForceIp = ip;
  req._bruteForceSuccess = () => { loginAttempts.delete(ip); };
  req._bruteForceFail = () => {
    record.attempts += 1;
    record.lastAttempt = now;
    if (record.attempts >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION_MS;
      console.warn(`[Security] IP ${ip} DIKUNCI 30 menit setelah ${record.attempts} percobaan gagal`);
    } else {
      console.warn(`[Security] Login gagal dari ${ip}: percobaan ke-${record.attempts}/${MAX_ATTEMPTS}`);
    }
    loginAttempts.set(ip, record);
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
