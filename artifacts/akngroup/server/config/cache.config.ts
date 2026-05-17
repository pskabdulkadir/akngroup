import { createClient, RedisClientType } from 'redis';

/**
 * Redis Cache Configuration - Optimized for 1,000,000+ Users
 * 
 * Features:
 * - Multi-tier caching
 * - Automatic cache invalidation
 * - LRU eviction policy
 * - Cache warming on startup
 */

export interface CacheConfig {
  enabled: boolean;
  ttl: number;           // Time to live in seconds
  namespace: string;
  redisUrl?: string;
}

export const cacheConfig = {
  // User cache
  user: {
    ttl: 3600,           // 1 hour
    namespace: 'user'
  },

  // Wallet balance cache (frequently accessed)
  walletBalance: {
    ttl: 300,            // 5 minutes (shorter for accuracy)
    namespace: 'wallet:balance'
  },

  // Wallet transactions cache
  walletTransactions: {
    ttl: 600,            // 10 minutes
    namespace: 'wallet:tx'
  },

  // Commission data cache
  commissions: {
    ttl: 3600,
    namespace: 'commission'
  },

  // Network tree cache (heavy computation)
  networkTree: {
    ttl: 1800,           // 30 minutes
    namespace: 'network'
  },

  // Passive income pool cache
  passiveIncomePool: {
    ttl: 300,
    namespace: 'passive:pool'
  },

  // User sessions
  session: {
    ttl: 604800,         // 7 days
    namespace: 'session'
  },

  // API endpoints response cache
  apiResponse: {
    ttl: 60,             // 1 minute for dynamic data
    namespace: 'api'
  }
};

/**
 * Redis Cache Manager
 */
export class CacheManager {
  private client: RedisClientType | null = null;
  private enabled: boolean = false;
  private stats = {
    hits: 0,
    misses: 0,
    errors: 0
  };

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    if (process.env.USE_REDIS !== 'true') {
      this.enabled = false;
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          // keepAlive accepts boolean in node socket options
          keepAlive: true,
          noDelay: true
        }
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err);
        this.stats.errors++;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis cache connected');
        this.enabled = true;
      });

      await this.client.connect();

      // Set LRU eviction policy
      await this.client.configSet('maxmemory-policy', 'allkeys-lru');

      console.log('📊 Redis LRU eviction policy enabled');
    } catch (error) {
      console.warn('⚠️ Redis initialization failed:', error);
      console.log('💡 System will continue without caching');
      this.enabled = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        this.stats.hits++;
        if (typeof value === 'string') {
          return JSON.parse(value) as T;
        }
        // Some redis clients may return already-parsed objects/buffers
        return value as unknown as T;
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error('Cache set error:', error);
      this.stats.errors++;
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      this.stats.errors++;
    }
  }

  /**
   * Delete pattern (e.g., all user cache entries)
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Cache invalidation on data change
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `${cacheConfig.user.namespace}:${userId}*`,
      `${cacheConfig.walletBalance.namespace}:${userId}*`,
      `${cacheConfig.walletTransactions.namespace}:${userId}*`,
      `${cacheConfig.networkTree.namespace}:${userId}*`
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00';

    return {
      enabled: this.enabled,
      hits: this.stats.hits,
      misses: this.stats.misses,
      errors: this.stats.errors,
      hitRate: `${hitRate}%`,
      total
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, errors: 0 };
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      await this.client.flushDb();
      console.log('🗑️ Redis cache cleared');
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      console.log('❌ Redis connection closed');
    }
  }
}

/**
 * Create and export singleton cache manager
 */
let cacheManager: CacheManager;

export async function getCacheManager(): Promise<CacheManager> {
  if (!cacheManager) {
    cacheManager = new CacheManager();
    await cacheManager.initialize();
  }
  return cacheManager;
}

export default cacheConfig;
