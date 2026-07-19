# Production Rate-Limiting & Account-Lockout Design (VULN-033)

**Date:** 2026-07-18 · **Owner decision needed:** yes (infra: Redis) · **Risk if unaddressed:** brute-force / credential-stuffing / denial-of-wallet resistance is weaker than it appears at scale.

---

## 1. What we have today (`lib/rateLimiter.ts`)

- **In-memory `Map`**, fixed-window counter, per-process.
- Used on: `login` (5/15m), `register` (3/h), OTP verify, password-reset, AI routes (15/m), viewings/messages/waitlist/voice (api 60/m, contactAgent 10/h).
- `getClientIP` now trusts `x-real-ip`/rightmost XFF (VULN-007 fixed).
- nginx also has edge zones (`auth` 5r/m, `api` 10r/s) — a real second layer.

### Concrete weaknesses (why the audit flags it)

| # | Problem | Impact |
|---|---|---|
| W1 | **Per-process memory** | With ≥2 app instances (or serverless), each has its own counter → effective limit = N×configured. Cold start wipes counters. |
| W2 | **No account lockout** | Login is throttled per-**IP** only. A distributed run (1000 IPs) against ONE account is unthrottled → credential stuffing succeeds. |
| W3 | **Fixed-window burst** | An attacker can send `max` at the end of window T and `max` again at the start of T+1 → 2× burst across the boundary. |
| W4 | **Shared `unknown` bucket** | If IP can't be derived, all such requests share one key → either false lockouts or a bypass, depending on volume. |
| W5 | **No observability / no distributed unlock** | Can't see who's being limited; can't manually clear a lock; SOC-blind. |

---

## 2. Target design (production, best-practice)

### 2.1 Backend: Redis (single shared store)
Redis is already provisioned in `docker-compose.prod.yml` (internal-only + `--requirepass`) but **the app never connects to it**. Wire it in. Use **`ioredis`** (mature, cluster-ready, TLS support).

- Connection from `REDIS_URL` (+ password). One shared client module `lib/redis.ts` (singleton, lazy).
- All counters live in Redis → correct across every instance (solves **W1**).

### 2.2 Algorithm: sliding-window log (atomic via Lua)
Fixed windows allow boundary bursts (**W3**). Use a **sliding window** implemented as an atomic Lua script (one round-trip, no race):

```
-- KEYS[1]=bucket  ARGV[1]=now_ms  ARGV[2]=window_ms  ARGV[3]=max  ARGV[4]=member
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1]-ARGV[2])   -- drop old
local count = redis.call('ZCARD', KEYS[1])
if count >= tonumber(ARGV[3]) then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  return {0, oldest[2]}                                        -- blocked + retry hint
end
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return {1, 0}                                                  -- allowed
```
Atomic → no check-then-act race even under concurrency. Alternative acceptable: token-bucket (`redis-cell`/`CL.THROTTLE`) if the Redis build has the module; sliding-log needs no modules.

### 2.3 Account lockout (separate axis — solves W2)
IP throttling and account lockout are **two different controls**; keep both.

- On **failed** login: `INCR loginfail:<userId>` with `EXPIRE` = lockout window (e.g. 15 min sliding).
- Thresholds (tunable): 5 fails → soft lock 15 min; escalate (exponential backoff) on repeat: 10 → 1 h.
- On **successful** login: `DEL loginfail:<userId>` (reset).
- Key by **account**, not IP, so distributed stuffing against one account is caught regardless of source IP.
- Return a **generic** message ("too many attempts, try later") — never reveal whether the account exists or is locked (avoids user enumeration).
- **Important:** track by userId only *after* the email resolves to a real user; for unknown emails, rely on the IP limiter (don't create lock keys for arbitrary attacker-supplied emails → memory/DoS of the lock store).

### 2.4 Key design
```
rl:<scope>:<identifier>          e.g. rl:login:ip:1.2.3.4 , rl:ai:user:<uuid>
loginfail:<userId>
```
- Prefix `rl:` so all limiter keys are greppable/flushable.
- Include the **subject type** (`ip`/`user`) so an authenticated user gets a per-user bucket (better UX than shared-IP behind CGNAT).

### 2.5 Fail-open vs fail-closed (Redis outage policy)
Decide per-scope — this is the nuance most implementations get wrong:
- **General API / AI** → **fail-open** (allow) if Redis is unreachable, but log loudly + alert. Availability > strictness for read/product traffic. (nginx edge limits still apply as backstop.)
- **Auth (login/otp/reset)** → **fail-closed-ish**: if Redis is down, fall back to the in-memory limiter (degraded, per-instance) rather than allowing unlimited attempts. Never fully open on auth.
Make the policy explicit per call, not implicit.

### 2.6 W4 fix
If `getClientIP` returns `unknown`, treat as its own hard-limited bucket AND log — never let it become a shared bypass. Prefer failing the request in auth scope when no trustworthy IP is derivable behind the known proxy.

### 2.7 Response & observability
- Keep 429 + `Retry-After` + `X-RateLimit-*` (already present).
- Emit a structured log/metric on every block (`scope`, masked identifier, count) → feeds SOC / dashboards.
- Add an admin-only endpoint or CLI to inspect/clear a lock (support unblocking a legit locked-out user).

---

## 3. Migration path (zero route churn)

Keep the **exact public interface** so no endpoint changes:

```ts
// lib/rateLimiter.ts  (async version — same names)
export async function checkRateLimit(id: string, cfg: RateLimitConfig): Promise<RateLimitResult>
export function getClientIP(request: Request): string          // unchanged
export function rateLimitResponse(result: RateLimitResult): Response  // unchanged
export const RATE_LIMITS = { ... }                              // unchanged
```
- Only change: `checkRateLimit` becomes **async** (Redis is async). Call sites already `await`-able (they're in async handlers) — add `await`. Mechanical, ~20 edits, each tsc-checked.
- Internally: try Redis Lua; on Redis error apply the §2.5 policy (auth → in-memory fallback; others → fail-open+log).
- Add `recordLoginFailure(userId)` / `clearLoginFailures(userId)` / `isAccountLocked(userId)` for the lockout axis; call them in `auth/login`.

### Files touched
- **new** `lib/redis.ts` (ioredis singleton).
- **rewrite** `lib/rateLimiter.ts` (Redis Lua + in-memory fallback + lockout helpers).
- **edit** `app/api/auth/login/route.ts` (account-lockout check + record/clear).
- **edit** ~20 call sites: `checkRateLimit(...)` → `await checkRateLimit(...)`.
- **deps**: add `ioredis`; wire `REDIS_URL`/`REDIS_PASSWORD` (already in compose; add to `.env`).

## 4. Effort & sequencing
1. `lib/redis.ts` + health check (½ day).
2. Rewrite limiter with Lua + fallback; keep interface (½ day).
3. Account lockout in login (¼ day).
4. `await` the call sites + `next build` + load test with 2 instances (¼ day).
Total ≈ **1.5 dev-days**, medium risk (touches auth hot path — needs load test before prod).

## 5. Why deferred (honest)
This is **not a one-line fix** and **not currently exploitable on a single instance** (the in-memory limiter works correctly for one process, and nginx adds an edge layer). It becomes real when you (a) run >1 app instance / autoscale, or (b) face distributed credential stuffing. It requires standing up Redis as a **runtime dependency** and a load test — an infra decision, hence flagged for you rather than done blind.

## 6. Interim hardening available now (no Redis, low risk)
If you want an improvement before the full Redis work:
- Add **account-based failed-login counting in-memory** (same Map) → closes the worst gap (W2, distributed stuffing of one account) on a single instance today.
- Switch the fixed window to a **rolling** timestamp list in-memory → removes the boundary-burst (W3).
Both are single-instance-only but meaningfully raise the bar until Redis lands. Say the word and I'll implement these as a stopgap.
