/**
 * In-memory rate limiter (interim hardening, VULN-033).
 *
 * - Sliding-window log instead of a fixed window: no 2x burst on window
 *   boundaries (W3 in SECURITY-RATELIMIT-DESIGN.md).
 * - Account-lockout axis for login, keyed by userId — catches distributed
 *   credential stuffing of one account from many IPs (W2).
 *
 * Limitation (accepted until the Redis limiter lands): counters are
 * per-process. Correct for a single app instance; with N instances the
 * effective limit is N x configured. See SECURITY-RATELIMIT-DESIGN.md for
 * the production Redis design; the public interface here already matches it.
 */

// ---------------------------------------------------------------------------
// Sliding-window rate limiter
// ---------------------------------------------------------------------------

/** Per-key log of request timestamps (ms), oldest first. */
const store = new Map<string, number[]>();

export interface RateLimitConfig {
  windowMs: number;   // Sliding window size in milliseconds
  maxRequests: number; // Max requests within any window of that size
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // When the client may retry (ms epoch)
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.).
 * Sliding-window log: a request is allowed if fewer than maxRequests
 * were allowed in the last windowMs. Rejected requests are not recorded,
 * so each key stores at most maxRequests timestamps.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  let log = store.get(identifier);
  if (log) {
    // Drop timestamps that slid out of the window.
    let firstLive = 0;
    while (firstLive < log.length && log[firstLive] <= cutoff) firstLive++;
    if (firstLive > 0) log.splice(0, firstLive);
  } else {
    log = [];
    store.set(identifier, log);
  }

  if (log.length >= config.maxRequests) {
    // Blocked. Retry when the oldest in-window request slides out.
    return {
      success: false,
      remaining: 0,
      resetAt: log[0] + config.windowMs,
    };
  }

  log.push(now);
  return {
    success: true,
    remaining: config.maxRequests - log.length,
    resetAt: now + config.windowMs,
  };
}

// ---------------------------------------------------------------------------
// Account lockout (login brute-force / credential-stuffing defense)
// ---------------------------------------------------------------------------

interface LockoutEntry {
  failures: number[]; // Timestamps of failed attempts within the window
  lockedUntil: number; // 0 = not locked
}

const lockouts = new Map<string, LockoutEntry>();

const LOCKOUT = {
  windowMs: 15 * 60 * 1000,   // Failures are counted over a 15-min sliding window
  softThreshold: 5,           // 5 failures -> lock 15 min
  softLockMs: 15 * 60 * 1000,
  hardThreshold: 10,          // 10 failures -> lock 1 h (escalation)
  hardLockMs: 60 * 60 * 1000,
};

/**
 * Record a failed login for a REAL user (call only after the email resolved
 * to an existing account — never create entries for attacker-supplied
 * unknown emails, or the lock store itself becomes a DoS vector).
 */
export function recordLoginFailure(userId: string): void {
  const now = Date.now();
  const entry = lockouts.get(userId) ?? { failures: [], lockedUntil: 0 };

  entry.failures = entry.failures.filter((t) => t > now - LOCKOUT.windowMs);
  entry.failures.push(now);

  if (entry.failures.length >= LOCKOUT.hardThreshold) {
    entry.lockedUntil = now + LOCKOUT.hardLockMs;
  } else if (entry.failures.length >= LOCKOUT.softThreshold) {
    entry.lockedUntil = now + LOCKOUT.softLockMs;
  }

  lockouts.set(userId, entry);
}

/** Clear the failure counter after a successful login. */
export function clearLoginFailures(userId: string): void {
  lockouts.delete(userId);
}

export interface AccountLockResult {
  locked: boolean;
  retryAt: number; // ms epoch; 0 when not locked
}

/** Is this account currently locked out? */
export function isAccountLocked(userId: string): AccountLockResult {
  const entry = lockouts.get(userId);
  if (!entry) return { locked: false, retryAt: 0 };

  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { locked: true, retryAt: entry.lockedUntil };
  }

  // Lock expired (or never set) — keep recent failures, drop stale entries.
  entry.failures = entry.failures.filter((t) => t > now - LOCKOUT.windowMs);
  if (entry.failures.length === 0) lockouts.delete(userId);
  return { locked: false, retryAt: 0 };
}

/**
 * Generic 429 for a locked account. Deliberately identical wording to the
 * IP-based limiter and no account details — does not confirm the account
 * exists or that a lock (vs plain rate limit) fired (anti-enumeration).
 */
export function accountLockResponse(result: AccountLockResult): Response {
  const retryAfterSec = Math.max(1, Math.ceil((result.retryAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Housekeeping
// ---------------------------------------------------------------------------

// Drop empty/stale entries every 5 minutes so the maps stay bounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, log] of store.entries()) {
    if (log.length === 0 || log[log.length - 1] < now - 60 * 60 * 1000) {
      store.delete(key);
    }
  }
  for (const [key, entry] of lockouts.entries()) {
    const stale =
      entry.lockedUntil < now &&
      entry.failures.every((t) => t <= now - LOCKOUT.windowMs);
    if (stale) lockouts.delete(key);
  }
}, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// Client IP + presets + 429 response (unchanged interface)
// ---------------------------------------------------------------------------

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // X-Real-IP is set by our nginx from the actual peer ($remote_addr) and is NOT
  // client-controllable — prefer it (VULN-007).
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP.trim();

  // X-Forwarded-For: a client can prepend arbitrary values on the LEFT; the trusted
  // proxy appends the real peer on the RIGHT ($proxy_add_x_forwarded_for). Take the
  // rightmost (last) entry, never the leftmost, so per-IP limits can't be reset by spoofing.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }

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

  // Expensive AI endpoints (denial-of-wallet protection) - strict
  ai: { windowMs: 60 * 1000, maxRequests: 15 },  // 15 per minute

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
