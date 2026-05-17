import jwt from 'jsonwebtoken';

/**
 * Authentication Configuration - Optimized for 1,000,000+ Users
 * 
 * Features:
 * - Fast JWT token generation
 * - Redis session caching
 * - Token blacklist management
 * - Distributed session support
 */

export const authConfig = {
  // JWT Configuration
  jwt: {
    accessTokenExpiry: '15m',      // Short-lived for security
    refreshTokenExpiry: '7d',      // Longer-lived refresh token
    issuer: 'mlm-system',
    audience: 'mlm-users',
    algorithm: 'HS256'
  },

  // Session Configuration
  session: {
    maxSessions: 5,                // Max concurrent sessions per user
    sessionTTL: 604800,            // 7 days in seconds
    slideExpiration: true,         // Auto-extend on activity
    slideInterval: 3600            // Extend after 1 hour of inactivity
  },

  // Rate Limiting (brute-force protection)
  rateLimit: {
    loginAttempts: 5,              // Max failed attempts
    lockoutDuration: 900,          // 15 minutes in seconds
    resetAfter: 3600               // Reset counter after 1 hour
  },

  // Token Blacklist (for logout, token revocation)
  tokenBlacklist: {
    enabled: true,
    checkInterval: 3600,           // Check every 1 hour
    maxSize: 100000                // Keep last 100k blacklisted tokens
  },

  // CORS Configuration (for scaling)
  cors: {
    origins: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.API_URL || 'http://localhost:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    maxAge: 86400
  },

  // Password Policy
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90
  }
};

/**
 * Generate optimized JWT token
 */
export function generateAccessToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: authConfig.jwt.accessTokenExpiry,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience,
    algorithm: authConfig.jwt.algorithm as any
  });
}

/**
 * Generate refresh token (for token rotation)
 */
export function generateRefreshToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', {
    expiresIn: authConfig.jwt.refreshTokenExpiry,
    issuer: authConfig.jwt.issuer
  });
}

/**
 * Verify and decode JWT token with caching
 */
export function verifyAccessToken(token: string, cache?: Map<string, any>): any {
  // Check cache first (Redis ideally)
  if (cache?.has(token)) {
    return cache.get(token);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    });

    // Cache for 5 minutes (reduce token verification overhead)
    if (cache) {
      cache.set(token, decoded);
      setTimeout(() => cache.delete(token), 300000); // 5 minutes
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Session management with Redis support
 */
export class SessionManager {
  private sessions: Map<string, any> = new Map();
  private redisClient: any;

  constructor(redisClient?: any) {
    this.redisClient = redisClient;
  }

  /**
   * Create new session
   */
  async createSession(userId: string, userAgent: string): Promise<string> {
    const sessionId = `sess_${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const session = {
      userId,
      userAgent,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + (authConfig.session.sessionTTL * 1000)
    };

    if (this.redisClient) {
      // Store in Redis for distributed sessions
      await this.redisClient.setex(
        `session:${sessionId}`,
        authConfig.session.sessionTTL,
        JSON.stringify(session)
      );
    } else {
      // Fallback to memory
      this.sessions.set(sessionId, session);
    }

    return sessionId;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<boolean> {
    if (this.redisClient) {
      const session = await this.redisClient.get(`session:${sessionId}`);
      return session !== null;
    }
    return this.sessions.has(sessionId);
  }

  /**
   * Extend session expiry on activity
   */
  async extendSession(sessionId: string): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.expire(
        `session:${sessionId}`,
        authConfig.session.sessionTTL
      );
    } else {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.lastActivity = Date.now();
      }
    }
  }

  /**
   * Revoke session (logout)
   */
  async revokeSession(sessionId: string): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.del(`session:${sessionId}`);
    } else {
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    let count = 0;
    const now = Date.now();

    if (!this.redisClient) {
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.expiresAt < now) {
          this.sessions.delete(sessionId);
          count++;
        }
      }
    }

    return count;
  }
}

export default authConfig;
