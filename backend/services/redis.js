import 'dotenv/config';

// Graceful Redis service — works with or without Upstash credentials
// Falls back to in-memory cache if Upstash is not configured (local dev)

let redisClient = null;
const memoryCache = new Map();

async function initRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && url !== 'https://your-redis-url.upstash.io') {
    try {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({ url, token });
      console.log('[Redis] ✅ Upstash Redis connected');
    } catch (err) {
      console.warn('[Redis] ⚠️  Upstash init failed, using in-memory cache:', err.message);
    }
  } else {
    console.log('[Redis] ℹ️  No Upstash credentials — using in-memory cache (dev mode)');
  }
}

initRedis();

/**
 * Get a cached value by key
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function cacheGet(key) {
  try {
    if (redisClient) {
      const val = await redisClient.get(key);
      return val;
    }
    // In-memory fallback
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  } catch (err) {
    console.error('[Redis] cacheGet error:', err.message);
    return null;
  }
}

/**
 * Set a cached value with optional TTL (seconds)
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 */
export async function cacheSet(key, value, ttlSeconds = 60) {
  try {
    if (redisClient) {
      await redisClient.set(key, value, { ex: ttlSeconds });
      return;
    }
    // In-memory fallback
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  } catch (err) {
    console.error('[Redis] cacheSet error:', err.message);
  }
}

/**
 * Delete a cached key (invalidate)
 * @param {string} key
 */
export async function cacheDel(key) {
  try {
    if (redisClient) {
      await redisClient.del(key);
      return;
    }
    memoryCache.delete(key);
  } catch (err) {
    console.error('[Redis] cacheDel error:', err.message);
  }
}

/**
 * Delete all keys matching a pattern prefix
 * @param {string} pattern - e.g. 'inventory:*'
 */
export async function cacheDelPattern(pattern) {
  try {
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(k => redisClient.del(k)));
      }
      return;
    }
    // In-memory: delete matching prefix
    const prefix = pattern.replace('*', '');
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
  } catch (err) {
    console.error('[Redis] cacheDelPattern error:', err.message);
  }
}

export const redis = redisClient;
export const redisGet = cacheGet;
export const redisSet = cacheSet;
export const redisDel = cacheDel;

export async function checkRateLimit(identifier, limit = 60, windowSeconds = 60) {
  const key = `ratelimit:${identifier}`;
  const current = (await cacheGet(key)) || 0;
  if (Number(current) >= limit) {
    return { allowed: false, remaining: 0 };
  }
  await cacheSet(key, Number(current) + 1, windowSeconds);
  return { allowed: true, remaining: limit - (Number(current) + 1) };
}

export default { cacheGet, cacheSet, cacheDel, cacheDelPattern, redis, redisGet, redisSet, redisDel, checkRateLimit };
