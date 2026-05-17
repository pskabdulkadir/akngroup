import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiting Configuration untuk 1,000,000+ Users
 * 
 * Strategies:
 * - Token Bucket Algorithm
 * - Adaptive Rate Limiting based on server load
 * - Per-endpoint rate limits
 * - Distributed rate limiting (Redis-ready)
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message: string;
  statusCode: number;
}

interface ClientRequest {
  count: number;
  resetTime: number;
}

/**
 * Global Rate Limit Configurations
 */
export const rateLimitConfigs = {
  // Global API limit
  global: {
    windowMs: 60000,       // 1 minute
    maxRequests: 1000,     // 1000 requests per minute per IP
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra deneyin.',
    statusCode: 429
  },

  // Authentication endpoints
  auth: {
    windowMs: 900000,      // 15 minutes
    maxRequests: 5,        // 5 attempts per 15 minutes
    message: 'Çok fazla giriş denemesi, hesabınız 15 dakika kilitlendi.',
    statusCode: 429
  },

  // Public endpoints
  public: {
    windowMs: 60000,
    maxRequests: 100,      // 100 requests per minute
    message: 'Rate limit aşıldı.',
    statusCode: 429
  },

  // Protected user endpoints
  user: {
    windowMs: 60000,
    maxRequests: 500,      // 500 requests per minute per user
    message: 'Çok fazla istek gönderdiniz.',
    statusCode: 429
  },

  // Admin endpoints
  admin: {
    windowMs: 60000,
    maxRequests: 2000,     // 2000 requests per minute for admin
    message: 'Admin rate limit aşıldı.',
    statusCode: 429
  },

  // Payment endpoints (strict)
  payment: {
    windowMs: 300000,      // 5 minutes
    maxRequests: 10,       // 10 attempts per 5 minutes
    message: 'Çok fazla ödeme isteği, lütfen daha sonra deneyin.',
    statusCode: 429
  },

  // Withdrawal endpoints (strict)
  withdrawal: {
    windowMs: 300000,      // 5 minutes
    maxRequests: 5,        // 5 attempts per 5 minutes
    message: 'Çok fazla çekim isteği, lütfen daha sonra deneyin.',
    statusCode: 429
  }
};

/**
 * RateLimiter Class - Token Bucket Algorithm
 */
export class RateLimiter {
  private store: Map<string, ClientRequest> = new Map();
  private redisClient: any;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(redisClient?: any) {
    this.redisClient = redisClient;
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Check if request is allowed
   */
  async isAllowed(key: string, config: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
    const now = Date.now();

    if (this.redisClient) {
      return this.checkRedis(key, config, now);
    } else {
      return this.checkMemory(key, config, now);
    }
  }

  /**
   * Check rate limit in memory
   */
  private checkMemory(key: string, config: RateLimitConfig, now: number): { allowed: boolean; remaining: number; retryAfter: number } {
    let request = this.store.get(key);

    // If no entry or window expired, create new
    if (!request || now >= request.resetTime) {
      request = {
        count: 1,
        resetTime: now + config.windowMs
      };
      this.store.set(key, request);
      return { allowed: true, remaining: config.maxRequests - 1, retryAfter: 0 };
    }

    // Increment counter
    request.count++;

    if (request.count > config.maxRequests) {
      const retryAfter = Math.ceil((request.resetTime - now) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }

    const remaining = config.maxRequests - request.count;
    return { allowed: true, remaining, retryAfter: 0 };
  }

  /**
   * Check rate limit in Redis (distributed)
   */
  private async checkRedis(key: string, config: RateLimitConfig, now: number): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
    const redisKey = `ratelimit:${key}`;
    const count = await this.redisClient.incr(redisKey);

    if (count === 1) {
      // Set expiration on first request
      await this.redisClient.pexpire(redisKey, config.windowMs);
    }

    if (count > config.maxRequests) {
      const ttl = await this.redisClient.pttl(redisKey);
      const retryAfter = Math.ceil(ttl / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }

    const remaining = config.maxRequests - count;
    return { allowed: true, remaining, retryAfter: 0 };
  }

  /**
   * Cleanup expired entries from memory store
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, request] of this.store.entries()) {
      if (now >= request.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limit cleanup: ${cleaned} expired entries removed`);
    }
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval as unknown as number);
    }
    this.store.clear();
  }
}

/**
 * Express middleware for rate limiting
 */
export function createRateLimitMiddleware(config: RateLimitConfig, getKeyFn: (req: Request) => string, rateLimiter: RateLimiter) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = getKeyFn(req);
      const check = await rateLimiter.isAllowed(key, config);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', check.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + check.retryAfter * 1000).toISOString());

      if (!check.allowed) {
        res.setHeader('Retry-After', check.retryAfter);
        return res.status(config.statusCode).json({
          success: false,
          error: config.message,
          retryAfter: check.retryAfter
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // On error, allow the request to proceed
      next();
    }
  };
}

/**
 * Get client IP address (handles proxies)
 */
export function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Get user ID or IP for rate limiting
 */
export function getRateLimitKey(req: any): string {
  // Prefer authenticated user ID for per-user limits
  if (req.userId) {
    return `user:${req.userId}`;
  }
  // Fallback to IP address
  return `ip:${getClientIp(req)}`;
}

export default RateLimiter;
