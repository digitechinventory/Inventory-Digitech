import db from './localDb.js';
import { cacheGet, cacheSet } from './redis.js';

const SETTINGS_KEY = 'session_duration_hours';
const REDIS_KEY = 'system:config:session_duration_hours';
const DEFAULT_HOURS = 8; // 8 Jam (Standar 1 Shift Operasional BIB / Digitech)

let inMemoryDuration = DEFAULT_HOURS;
let inMemoryUpdatedAt = new Date().toISOString();
let inMemoryUpdatedBy = 'system';

/**
 * Pastikan tabel system_settings ada di PostgreSQL
 */
async function ensureTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by VARCHAR(100)
      );
    `);
  } catch (err) {
    console.warn('[SystemSettings] Warning initializing system_settings table:', err.message);
  }
}

// Inisialisasi tabel saat startup (hanya di server biasa, skip di Vercel)
if (!process.env.VERCEL) {
  ensureTable();
}

/**
 * Mendapatkan konfigurasi durasi masa aktif sesi login (JWT)
 * @returns {Promise<{durationHours: number, durationMinutes: number, durationMs: number, updatedAt: string, updatedBy: string}>}
 */
export async function getSessionDurationConfig() {
  try {
    // 1. Cek Redis cache terlebih dahulu untuk performa tinggi
    const cached = await cacheGet(REDIS_KEY).catch(() => null);
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      const hours = parseFloat(parsed.durationHours) || DEFAULT_HOURS;
      inMemoryDuration = hours;
      inMemoryUpdatedAt = parsed.updatedAt || inMemoryUpdatedAt;
      inMemoryUpdatedBy = parsed.updatedBy || inMemoryUpdatedBy;
      return {
        durationHours: hours,
        durationMinutes: Math.round(hours * 60),
        durationMs: Math.round(hours * 3600 * 1000),
        updatedAt: inMemoryUpdatedAt,
        updatedBy: inMemoryUpdatedBy
      };
    }

    // 2. Cek database PostgreSQL
    const res = await db.query(
      'SELECT value, updated_at, updated_by FROM system_settings WHERE key = $1 LIMIT 1',
      [SETTINGS_KEY]
    );

    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      const hours = parseFloat(row.value) || DEFAULT_HOURS;
      inMemoryDuration = hours;
      inMemoryUpdatedAt = row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString();
      inMemoryUpdatedBy = row.updated_by || 'system';

      const config = {
        durationHours: hours,
        durationMinutes: Math.round(hours * 60),
        durationMs: Math.round(hours * 3600 * 1000),
        updatedAt: inMemoryUpdatedAt,
        updatedBy: inMemoryUpdatedBy
      };

      // Simpan kembali ke Redis selama 7 hari
      await cacheSet(REDIS_KEY, JSON.stringify(config), 604800).catch(() => {});
      return config;
    }
  } catch (err) {
    console.warn('[SystemSettings] Gagal membaca konfigurasi sesi dari DB/Redis, fallback ke memori:', err.message);
  }

  // Fallback in-memory
  return {
    durationHours: inMemoryDuration,
    durationMinutes: Math.round(inMemoryDuration * 60),
    durationMs: Math.round(inMemoryDuration * 3600 * 1000),
    updatedAt: inMemoryUpdatedAt,
    updatedBy: inMemoryUpdatedBy
  };
}

/**
 * Menyimpan konfigurasi durasi masa aktif sesi login (JWT)
 * @param {number} hours - Durasi dalam jam (misal 1, 2, 4, 8, 12, 24)
 * @param {string} updatedBy - Email atau nama superadmin yang mengubah
 * @returns {Promise<{durationHours: number, durationMinutes: number, durationMs: number, updatedAt: string, updatedBy: string}>}
 */
export async function updateSessionDurationConfig(hours, updatedBy = 'Superadmin') {
  const numericHours = parseFloat(hours);
  if (isNaN(numericHours) || numericHours < 0.25 || numericHours > 72) {
    throw new Error('Durasi sesi harus berupa angka antara 0.25 jam (15 menit) hingga 72 jam.');
  }

  const now = new Date().toISOString();
  inMemoryDuration = numericHours;
  inMemoryUpdatedAt = now;
  inMemoryUpdatedBy = updatedBy;

  const result = {
    durationHours: numericHours,
    durationMinutes: Math.round(numericHours * 60),
    durationMs: Math.round(numericHours * 3600 * 1000),
    updatedAt: now,
    updatedBy
  };

  // 1. Simpan ke PostgreSQL
  try {
    await db.query(`
      INSERT INTO system_settings (key, value, updated_at, updated_by)
      VALUES ($1, $2, NOW(), $3)
      ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by;
    `, [SETTINGS_KEY, String(numericHours), updatedBy]);
  } catch (err) {
    console.error('[SystemSettings] Gagal menyimpan ke PostgreSQL:', err.message);
  }

  // 2. Simpan ke Redis Cache
  try {
    await cacheSet(REDIS_KEY, JSON.stringify(result), 604800);
  } catch (err) {
    console.warn('[SystemSettings] Gagal menyimpan ke Redis:', err.message);
  }

  return result;
}
