import 'dotenv/config';

// Graceful Redis service — supports local Redis (ioredis), Upstash, or in-memory fallback
// Priority: REDIS_URL (local/native) > UPSTASH credentials > in-memory

let redisClient = null;
const memoryCache = new Map();

async function initRedis() {
  const localRedisUrl = process.env.REDIS_URL;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Try local Redis via ioredis (connection string: redis://host:port or redis://:password@host:port)
  if (localRedisUrl && !localRedisUrl.includes('upstash.io')) {
    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(localRedisUrl, { lazyConnect: true, connectTimeout: 3000 });
      await client.connect();
      redisClient = {
        _type: 'ioredis',
        _client: client,
        get: (key) => client.get(key),
        set: (key, value, opts) => {
          const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
          if (opts && opts.ex) return client.set(key, val, 'EX', opts.ex);
          return client.set(key, val);
        },
        del: (key) => client.del(key),
        keys: (pattern) => client.keys(pattern),
      };
      console.log('[Redis] ✅ Local Redis connected via:', localRedisUrl);
    } catch (err) {
      redisClient = null;
      console.warn('[Redis] ⚠️  Local Redis connection failed, trying Upstash:', err.message);
    }
  }

  // 2. Try Upstash if local Redis failed or not configured
  if (!redisClient && upstashUrl && upstashToken && upstashUrl !== 'https://your-redis-url.upstash.io') {
    try {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({ url: upstashUrl, token: upstashToken });
      redisClient._type = 'upstash';
      console.log('[Redis] ✅ Upstash Redis connected');
    } catch (err) {
      console.warn('[Redis] ⚠️  Upstash init failed, using in-memory cache:', err.message);
    }
  } else if (!redisClient) {
    console.log('[Redis] ℹ️  No Redis credentials — using in-memory cache (dev mode)');
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
