import NodeCache from 'node-cache';

// Initialize cache with default TTL of 300 seconds (5 minutes) and periodic check every 60 seconds
const cache = new NodeCache({ stdTTL: Number(process.env.CACHE_TTL_DEFAULT) || 300, checkperiod: 60 });

/**
 * Middleware to cache GET requests based on originalUrl
 * @param {number} ttl - Optional time-to-live in seconds for this route
 */
export const cacheMiddleware = (ttl) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedResponse);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
        cache.set(key, body, ttl || Number(process.env.CACHE_TTL_DEFAULT) || 300);
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Helper to clear cache keys matching a substring or exact prefix
 * @param {string} prefix - Substring to match inside cache keys
 */
export const clearCache = (prefix) => {
  try {
    const keys = cache.keys();
    const keysToDelete = keys.filter(k => k.includes(prefix));
    if (keysToDelete.length > 0) {
      cache.del(keysToDelete);
      console.log(`🧹 Cache cleared for pattern "${prefix}": ${keysToDelete.length} keys removed.`);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export default cache;
