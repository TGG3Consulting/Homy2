/**
 * Simple in-memory rate limiter for auth endpoints
 * For production, consider Redis-based solution
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = store.get(key);

  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  entry.count++;
  store.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    success: entry.count <= config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check various headers for proxy/load balancer setups
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return 'unknown';
}

// Preset configurations
export const RATE_LIMITS = {
  // Auth endpoints - strict limits
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },  // 5 per 15 min
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 },  // 3 per hour
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 },  // 3 per hour
  otpVerify: { windowMs: 15 * 60 * 1000, maxRequests: 5 },  // 5 per 15 min

  // API endpoints - moderate limits
  api: { windowMs: 60 * 1000, maxRequests: 60 },  // 60 per minute

  // Strict endpoints
  contactAgent: { windowMs: 60 * 60 * 1000, maxRequests: 10 },  // 10 per hour
};

/**
 * Create rate limit response with headers
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    }
  );
}
