import 'dotenv/config';

// Dedicated Local Redis Service (ioredis) with high-performance in-memory fallback
let redisClient = null;
const memoryCache = new Map();

async function initRedis() {
  if (process.env.VERCEL) {
    console.log('[Redis] Vercel Serverless environment: using in-memory cache.');
    return;
  }
  const localRedisUrl = process.env.REDIS_URL;

  if (localRedisUrl) {
    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(localRedisUrl, {
        lazyConnect: true,
        connectTimeout: 4000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null // Don't retry endlessly if Redis is unreachable
      });
      client.on('error', (err) => {
        // Prevent unhandled error event from throwing in Node.js
        console.warn('[Redis] Connection warning:', err.message);
      });
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
      console.log('[Redis] Local Redis connected via:', localRedisUrl.replace(/:[^@]+@/, ':***@'));
    } catch (err) {
      redisClient = null;
      console.warn('[Redis] Warning: Local Redis connection failed (' + err.message + '). In-memory cache will serve as fallback.');
    }
  } else {
    console.log('[Redis] Info: No REDIS_URL configured — using in-memory cache.');
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
