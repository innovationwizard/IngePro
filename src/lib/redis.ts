import { Redis } from 'ioredis'

// Redis client instance
let redis: Redis | null = null

// Initialize Redis connection
export function initRedis() {
  if (redis) return redis

  try {
    // Production Redis configuration
    const redisUrl = process.env.REDIS_URL
    
    if (redisUrl) {
      redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // Production-specific settings
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1, // Fail fast in production
        retryDelayOnFailover: 50,
        // TLS for production security
        tls: process.env.NODE_ENV === 'production' ? {} : undefined,
      })

      redis.on('error', (error) => {
        console.warn('Redis connection error:', error)
        redis = null
      })

      redis.on('connect', () => {
        console.log('Redis: Connected to production instance')
      })

      redis.on('ready', () => {
        console.log('Redis: Ready for production traffic')
      })

      redis.on('close', () => {
        console.log('Redis: Production connection closed')
        redis = null
      })

      // Test connection
      redis.ping().catch(() => {
        console.warn('Redis ping failed, disabling Redis')
        redis = null
      })
    } else {
      console.log('Production: No Redis URL provided, Redis caching disabled')
    }
  } catch (error) {
    console.warn('Failed to initialize Redis:', error)
    redis = null
  }

  return redis
}

// Get Redis client
export function getRedis() {
  if (!redis) {
    initRedis()
  }
  return redis
}

// Export the Redis client for direct use
export { redis }

// Utility functions for common Redis operations
export const redisUtils = {
  // Set key with expiration
  async setex(key: string, ttl: number, value: string): Promise<void> {
    const client = getRedis()
    if (client) {
      await client.setex(key, ttl, value)
    }
  },

  // Get value by key
  async get(key: string): Promise<string | null> {
    const client = getRedis()
    if (client) {
      return await client.get(key)
    }
    return null
  },

  // Delete key
  async del(key: string): Promise<number> {
    const client = getRedis()
    if (client) {
      return await client.del(key)
    }
    return 0
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const client = getRedis()
    if (client) {
      const result = await client.exists(key)
      return result === 1
    }
    return false
  },

  // Set multiple keys
  async mset(keyValues: Record<string, string>): Promise<void> {
    const client = getRedis()
    if (client) {
      await client.mset(keyValues)
    }
  },

  // Get multiple keys
  async mget(keys: string[]): Promise<(string | null)[]> {
    const client = getRedis()
    if (client) {
      return await client.mget(keys)
    }
    return keys.map(() => null)
  },

  // Increment counter
  async incr(key: string): Promise<number> {
    const client = getRedis()
    if (client) {
      return await client.incr(key)
    }
    return 0
  },

  // Set key with expiration (alias for setex)
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedis()
    if (client) {
      if (ttl) {
        await client.setex(key, ttl, value)
      } else {
        await client.set(key, value)
      }
    }
  }
}

// Initialize Redis on module load
if (typeof window === 'undefined') {
  initRedis()
}
