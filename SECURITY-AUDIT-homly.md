# Security Audit Report — Homy

> ## Remediation status — applied 2026-07-19
> Все находки обработаны. Кодовые/конфиг-фиксы применены и верифицированы (tsc app+server + eslint чисто); несколько пунктов — сознательные решения или действия владельца на этапе деплоя (отмечено ✎).
>
> **High** — VULN-001 ✅ (гейт отзыва: только `confirmed`/`completed` просмотр в прошлом).
> **Medium** — VULN-002 ✅ (OTP: сверка новейшего кода constant-time + account-lockout по email) · VULN-003 ✅ (AI-сессия привязана к userId/opaque HttpOnly-cookie) · VULN-004 ✅ (WS `clientIpOf` → x-real-ip/правый XFF) · VULN-005 ✅ (approve в Serializable-tx + обработка P2034) · VULN-006 ✅ (регистрация: единый generic-ответ + письмо «account exists») · VULN-007 ✎ (осознанно оставлен `unsafe-inline` для скриптов; остальной CSP дожат: object-src/frame-src/worker-src/upgrade-insecure-requests).
> **Low** — VULN-008 ✅ (`take:500` на match_score) · VULN-009 ✅ (constant-time bcrypt при отсутствии юзера) · VULN-010 ✅ (generic AI-ошибки, без утечки) · VULN-011 ✅ (WS-сообщение cap 5000) · VULN-012 ✅ (rate-limit на создание листинга) · VULN-013 ✅ (reset-pw лимитер + constant-time cron через `lib/cronAuth.ts`) · VULN-014 ✅ (удалён мёртвый `corsHelper.ts`) · VULN-015 ✅ (убран вводящий в заблуждение edge-гейд) · VULN-016 ✅ (`getCurrentUser` проверяет token_version+is_blocked) · VULN-017 ✅ (nginx сбрасывает XFF на `$remote_addr`) · VULN-019 ✅ (migrate под non-root uid 1000 + лимиты) · VULN-020 ✅ (redis healthcheck через `REDISCLI_AUTH`) · VULN-018 ✎ (пин образов по digest — деплой-действие владельца, команда ниже) · VULN-021 ✎ (dev-креды: оставлены рабочими — dev-only, loopback; prod-compose чист) · VULN-022 ✎ / VULN-023 ✎ (npm-гигиена: `@types/uuid`, `npm ci` — уже в Dockerfile).
> **Info** — INFO-1 (Redis-лимитер при масштабировании — по `SECURITY-RATELIMIT-DESIGN.md`), INFO-3 (nginx OCSP/dhparam), INFO-4 (CI/CD), INFO-5/6 (uuid@14, strip-ansi — подтверждение), INFO-7 (seed — уже защищён) — действия/подтверждения владельца.
>
> ✎ **VULN-018 (пин образов, выполнить при деплое):** `docker pull node:20-alpine && docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine` — подставить полученный `image@sha256:...` в Dockerfile/compose (аналогично для postgres/redis/nginx). Пинить вслепую нельзя — цифра берётся из реестра.

**Project:** Homy Real Estate Platform
**Date:** 2026-07-19
**Auditor:** Claude Cybersecurity Skill (8 specialist agents, weighted scoring)
**Mode:** READ-ONLY (no edits, no commits, no installs)
**Stack:** Next.js 15 (app-router) · React 19 · TypeScript · custom `server.ts` (WebSocket `/ws/chat` + Socket.io) · Prisma 5 / PostgreSQL · Docker + nginx

---

## Executive Summary

- **Overall Security Score: 88 / 100 — Grade B** (good posture; no Critical, one High)
- **Agents completed:** 8 / 8
- **Findings (deduplicated):** Critical 0 · High 1 · Medium 6 · Low 16 · Info 7
- **Scope:** full — `app/**`, `lib/**`, `components/**`, `server.ts`, `middleware.ts`, `prisma/**`, `docker/**`, `package.json`/lockfile. Excluded by owner decision: `homly-search-flow*`, `HambarcumMC`, `VectorStock`, `test-arm*.txt` (stray prototypes, not in build).
- **No prompt-injection** content found in scanned code. **No malware / backdoor / C2 / exfiltration / cryptominer** indicators (Agent 6 clean, score 100). **No leaked production secrets** in tracked source (`.env` untracked, `.gitignore` correct, JWT secrets fail-fast, Docker uses `${VAR}` injection).

This is a heavily and repeatedly remediated codebase. The classic vulnerability classes are closed: Prisma is fully parameterized (no raw SQL), JWT pins `HS256` with DB-backed `token_version` revocation, uploads sniff magic bytes with server-generated names, IDOR/ownership checks are present on essentially every `[id]` route, mass-assignment is blocked by zod `.strict()`, and every AI endpoint is rate-limited + length-capped. The residual findings cluster in **business-logic trust rules** (review gate), the **custom WebSocket/Socket.io layer** (which wasn't held to the HTTP layer's standard), and **defense-in-depth** (CSP, image pinning). None require halting the launch except VULN-001, which should be fixed first.

> **Priority-1 (fix before launch):** VULN-001 — the broker-review "real interaction" gate is bypassable, and reputation is the marketplace's core trust primitive.

---

## Category Scores

| # | Category | Score | Weight | Key finding |
|---|----------|-------|--------|-------------|
| 1 | Vulnerability Detection | 88 | 20% | OTP verify has no per-account cap |
| 2 | Authorization & Access Control | 91 | 15% | AI chat session keyed on client-supplied id |
| 3 | Secret Management | 93 | 10% | Functional dev password committed in `.env.docker` |
| 4 | Dependency Security | 90 | 10% | All deps on patched versions; caret ranges (lockfile-mitigated) |
| 5 | Infrastructure Security | 82 | 10% | Floating image tags; migrate runs as root |
| 6 | Threat Intelligence | 100 | 15% | No malicious indicators |
| 7 | AI Code Patterns | 84 | 10% | WS anon limiter trusts spoofable XFF |
| 8 | Logic & Design | 70 | 10% | Review-gate bypass; approve-path double-booking race |

**Weighted total: 88.15 → 88/100 (B).**

---

## Detailed Findings

### HIGH

#### [VULN-001] Broker-review "real interaction" gate accepts an unconfirmed/self-created viewing
- **Severity:** HIGH (72/100) · **Confidence:** HIGH · **CWE-840 / CWE-863** · **OWASP A04:2021**
- **Location:** `app/api/agents/[id]/reviews/route.ts` (POST, interaction check) ← `app/api/viewings/route.ts` (POST create)
- **WHAT:** The anti-review-bombing control requires only that *some* viewing row links reviewer→broker, with **no status filter**: `prisma.viewing.findFirst({ where: { clientId: req.user!.id, agentId } })`. But any authenticated user unilaterally creates a viewing row via `POST /api/viewings` with `{ propertyId, scheduledAt }` (status `pending_agent`, `agentId` = property owner) — the broker never has to confirm it (a cancelled row still matches).
- **WHY:** To review broker X, an attacker requests a viewing on any property X owns (then optionally cancels it) and immediately posts a review. The one-review-per-author cap only limits to 1 fake review per broker per account; throwaway accounts scale it. This defeats the reputation system — the core trust primitive of the marketplace.
- **FIX:** Require `status: 'completed'` (or at minimum `'confirmed'`) in the interaction lookup, ideally with `scheduledAt < now`. A viewing the broker never accepted is not an interaction.

---

### MEDIUM

#### [VULN-002] OTP verification has no per-account attempt lockout (brute-forceable)
- **Severity:** MEDIUM (58/100) · **Confidence:** MEDIUM · **CWE-307** · **OWASP A07:2021** · *(confirmed by Agents 1 & 8)*
- **Location:** `app/api/auth/verify-otp/route.ts`, `lib/services/otpService.ts:42-69`
- **WHAT:** OTP is a 6-digit code (`crypto.randomInt(100000,999999)`, 10-min validity). `verifyOtp` matches `(email, code, used:false)` with no per-record `attempts` counter; account lockout (`lib/rateLimiter.ts`) is wired to **login only**. The sole verification throttle is per-IP (`otpVerify`: 5/15min).
- **WHY:** 900k keyspace + 10-min window + IP-only throttle → a distributed/rotating-IP attacker can brute an active code and obtain session cookies for a pending account. Chains with VULN-006 (see CHAIN-001).
- **FIX:** Add an `attempts` column on the OTP record, invalidate after ~5 wrong tries; and/or extend the account-lockout axis (keyed by email/userId) to OTP verification, mirroring login.

#### [VULN-003] AI chat session resumable via client-supplied `sessionId` (BOLA)
- **Severity:** MEDIUM (55/100) · **Confidence:** HIGH · **CWE-639** · **OWASP A01:2021**
- **Location:** `app/api/chat/route.ts` (POST, unauthenticated) + `lib/sessionManager.ts:32-58`
- **WHAT:** The chat POST is unauthenticated (rate-limited only) and passes the client-supplied `sessionId` straight to `sessionManager.sendMessage`. `SessionManager` keys its in-memory map solely on that id, with no binding to a user or IP; supplying another id resumes that session and returns its retained `messageHistory` (last 20 messages).
- **WHY:** The only thing protecting one conversation from another is the secrecy/entropy of the client-generated id — a classic user-controlled-key authorization gap.
- **FIX:** Namespace the session key with `req.user.id` for authenticated users; for anonymous, issue a server-generated opaque id in an HttpOnly cookie rather than trusting a body value. Reject ids not owned by the caller.

#### [VULN-004] WebSocket anon AI rate-limit bypass via X-Forwarded-For spoofing (denial-of-wallet)
- **Severity:** MEDIUM (55/100) · **Confidence:** HIGH · **CWE-770 / CWE-348** · **OWASP A04:2021**
- **Location:** `server.ts:357-361` (`clientIpOf`), consumed at `:392`, `:422`
- **WHAT:** The anonymous allowance for `/ws/chat` (2 free Anthropic calls per IP) keys off `clientIpOf`, which trusts the **leftmost** `x-forwarded-for` value (`xff.split(',')[0]`) — fully client-controlled. The HTTP limiter was explicitly hardened for this (`getClientIP` prefers `x-real-ip`/rightmost XFF, VULN-007 in prior audit) but the WS path was not updated.
- **WHY:** Rotating a spoofed header per connection yields unlimited free paid-LLM calls (billing abuse).
- **FIX:** In `clientIpOf`, mirror `getClientIP`: prefer `x-real-ip` (set by trusted nginx), else rightmost XFF entry, else `socket.remoteAddress`.

#### [VULN-005] TOCTOU double-booking on viewing approval
- **Severity:** MEDIUM (52/100) · **Confidence:** HIGH · **CWE-367** · **OWASP A04:2021**
- **Location:** `app/api/viewings/[id]/approve/route.ts`
- **WHAT:** The slot-conflict guard is a non-atomic check-then-act (`findFirst` confirmed-conflict → `update` to confirmed), not wrapped in a transaction and with no unique constraint. Two pending viewings for the same agent+`scheduledAt` approved concurrently both read zero conflicts and both write `confirmed`.
- **WHY:** Inconsistent with the *creation* path, which correctly uses a `Serializable` transaction. Approval is where `confirmed` slots are actually produced, so the guarantee matters most here.
- **FIX:** Wrap check+update in a `Serializable` transaction, or add a partial unique index on `(agentId, scheduledAt) WHERE status='confirmed'` and handle the conflict.

#### [VULN-006] Account enumeration on registration
- **Severity:** MEDIUM (48/100) · **Confidence:** HIGH · **CWE-204** · **OWASP A07:2021**
- **Location:** `app/api/auth/register/route.ts`
- **WHAT:** Existing verified email → `400 { error: 'Email already registered' }`; new email → `200 { success: true }`. Distinct status+body reveals which emails have verified accounts. Login and password-reset are correctly generic; register is the lone oracle.
- **WHY:** Enables user enumeration for targeted phishing / credential stuffing.
- **FIX:** Return an identical generic response ("If this email can be registered, a verification code has been sent") for both cases; drive the distinction only via emailed content.

#### [VULN-007] Production CSP allows `script-src 'unsafe-inline'`
- **Severity:** MEDIUM (50/100) · **Confidence:** MEDIUM · **CWE-1021 / CWE-79 (defense-in-depth)** · **OWASP A05:2021** · *(confirmed by Agents 1, 5 & 8)*
- **Location:** `middleware.ts:42-57`
- **WHAT:** Prod `script-src` = `'self' 'unsafe-inline'`. `'unsafe-eval'` is correctly stripped in prod, but `'unsafe-inline'` remains, so CSP provides no script-XSS containment.
- **WHY:** App XSS surface is low today (JSX auto-escaping; all `dangerouslySetInnerHTML` inject static CSS constants), but there is no backstop if an injection is ever introduced. This is a known Next.js tradeoff — nonce-based CSP costs static-page caching.
- **FIX (if adopted):** per-request nonce in middleware → `script-src 'self' 'nonce-<random>' 'strict-dynamic'`, attach nonce to first-party inline scripts. Accepting the tradeoff and keeping `unsafe-inline` is a defensible engineering decision given no active sink.

---

### LOW

#### [VULN-008] Unbounded `findMany` on public `/api/properties?sort_by=match_score`
- **Severity:** LOW (40/100) · **Confidence:** MEDIUM · **CWE-770** · **OWASP A04:2021**
- **Location:** `app/api/properties/route.ts:149-159`
- **WHAT:** With `sort_by=match_score` the handler runs `findMany` with **no `take`**, then AI-enriches the entire matching set before slicing the page (all other sorts paginate in the DB).
- **WHY:** A public caller with a broad filter forces loading + CPU-scoring the whole `Property` table each request. Bounded today by catalog size; grows with data.
- **FIX:** Cap the pre-scoring fetch (`take: 500`) or precompute match ranking; never fan out an unbounded `findMany` on an anonymous endpoint.

#### [VULN-009] Login timing side-channel enables email enumeration
- **Severity:** LOW (30/100) · **Confidence:** MEDIUM · **CWE-208 / CWE-203** · **OWASP A07:2021**
- **Location:** `app/api/auth/login/route.ts:32-56`
- **WHAT:** Non-existent email returns immediately; existing account runs `bcrypt.compare` (~100ms). Bodies are identical but timing distinguishes registered emails.
- **FIX:** Always compare against a constant dummy bcrypt hash when the user is absent, so both branches take the same time.

#### [VULN-010] Upstream AI error message relayed to client
- **Severity:** LOW (25/100) · **Confidence:** MEDIUM · **CWE-209** · **OWASP A05:2021** · *(confirmed by Agents 1 & 7)*
- **Location:** `app/api/chat/route.ts:77`, `server.ts:461`
- **WHAT:** Anthropic SDK `error.message` forwarded verbatim over SSE / `/ws/chat` (`{ type:'error', error: apiError.message }`). Every other route returns a generic string — this is the lone inconsistency.
- **FIX:** Log detail server-side; emit a fixed generic message to the client.

#### [VULN-011] Socket.io live-chat message has no length bound
- **Severity:** LOW (30/100) · **Confidence:** HIGH · **CWE-770** · **OWASP A04:2021**
- **Location:** `server.ts:133-173`
- **WHAT:** The `message` socket event checks only `content?.trim()` truthiness, then persists + broadcasts. The HTTP twin (`chats/[id]/messages`) enforces a zod length cap; the realtime path bypasses it.
- **FIX:** Reject `content.length > N` (align with the message schema) before persisting.

#### [VULN-012] Listing creation has no rate limit
- **Severity:** LOW (28/100) · **Confidence:** HIGH · **CWE-770** · **OWASP A04:2021**
- **Location:** `app/api/properties/list/route.ts`
- **WHAT:** `POST /api/properties/list` has no per-user rate limit (unlike viewing-create). An authenticated account can flood the moderation queue.
- **FIX:** `checkRateLimit(\`listing-create:${userId}\`, RATE_LIMITS.api)`.

#### [VULN-013] `reset-password` not rate-limited; cron secret compared non-constant-time
- **Severity:** LOW (25/100) · **Confidence:** MEDIUM · **CWE-307 / CWE-208**
- **Location:** `app/api/auth/reset-password/route.ts` (no limiter); `app/api/cron/*` (`header !== secret`)
- **WHAT:** The token-consumption endpoint is unlimited (request endpoint is limited). Token is 256-bit one-time/1h so brute-force is infeasible (hence Low). Cron auth uses non-constant-time `!==`.
- **FIX:** Add IP limiter to `reset-password`; compare cron secret with `crypto.timingSafeEqual`.

#### [VULN-014] Dead duplicate security helper with weaker primitives
- **Severity:** LOW (20/100) · **Confidence:** HIGH · **CWE-1041** · **OWASP A04:2021**
- **Location:** `lib/middleware/corsHelper.ts` (no importers in `app/**`)
- **WHAT:** Contains a second, weaker fixed-window rate limiter and a `getClientIp` trusting leftmost XFF — the exact patterns the real `rateLimiter.ts` was rewritten to avoid.
- **WHY:** Latent trap — a future route could import this and silently reintroduce spoofable/weaker limiting.
- **FIX:** Delete the file (or strip the duplicated helpers).

#### [VULN-015] Edge middleware API guard incomplete (defense-in-depth)
- **Severity:** LOW (18/100) · **Confidence:** HIGH · **CWE-284** · **OWASP A01:2021**
- **Location:** `middleware.ts:126-154`
- **WHAT:** `protectedApiRoutes` lists only 5 prefixes and merely checks a token is *present* (no signature/version/block verify). Most protected routes aren't listed. Real enforcement lives in the route wrappers (correct), so this is not exploitable — but it misleads.
- **FIX:** Either remove the partial edge block (rely on wrappers) or make it a complete signature-verifying gate. Don't leave a half-list that looks authoritative.

#### [VULN-016] `getCurrentUser()` helper skips revocation/block checks
- **Severity:** LOW (18/100) · **Confidence:** MEDIUM · **CWE-613** · **OWASP A01:2021**
- **Location:** `lib/middleware/authMiddleware.ts:156-172`
- **WHAT:** Verifies JWT signature but not `token_version`/`is_blocked` (unlike the wrappers). No current caller in `app/api/**` (all use wrappers), so impact is latent.
- **FIX:** Add the same checks, or delete the helper to force wrapper use.

#### [VULN-017] nginx appends (does not reset) client-supplied X-Forwarded-For
- **Severity:** LOW (25/100) · **Confidence:** MEDIUM · **CWE-348** · **OWASP A05:2021**
- **Location:** `docker/nginx/conf.d/default.conf:53`
- **WHAT:** `$proxy_add_x_forwarded_for` appends the real client IP to any client-sent XFF, so a spoofed leftmost value survives to the app. `X-Real-IP` is correctly `$remote_addr` and nginx zones key on `$binary_remote_addr` (not bypassable), so risk is only if app code trusts XFF — which VULN-004 does on the WS path.
- **FIX:** Single trusted proxy → reset it: `proxy_set_header X-Forwarded-For $remote_addr;` and have the app read `X-Real-IP`. (Fixing VULN-004 also closes the practical impact.)

#### [VULN-018] Unpinned container images
- **Severity:** LOW (22/100) · **Confidence:** HIGH · **CWE-1104 / CWE-829** · **OWASP A08:2021**
- **Location:** `Dockerfile:7,22,40`; `docker-compose.prod.yml:65,96,122`; `docker-compose.yml:12,36`
- **WHAT:** Floating tags (`node:20-alpine`, `postgres:16-alpine`, `redis:7-alpine`, `nginx:alpine`). Adminer/Mailhog are correctly pinned exactly.
- **FIX:** Pin by digest or exact patch tag; bump deliberately.

#### [VULN-019] `migrate` service runs as root from the builder stage
- **Severity:** LOW (25/100) · **Confidence:** HIGH · **CWE-250**
- **Location:** `docker-compose.prod.yml:150-164`
- **WHAT:** `migrate` builds `target: builder` — no `USER` (root), full source + devDeps, no resource limits, holds `DATABASE_URL`, runs `prisma migrate deploy`.
- **FIX:** Run migrations from a non-root stage (reuse `runner`'s `USER nextjs`); add resource limits.

#### [VULN-020] Redis password passed on command line in healthcheck
- **Severity:** LOW (18/100) · **Confidence:** MEDIUM · **CWE-214**
- **Location:** `docker-compose.prod.yml:108` (`redis-cli -a ${REDIS_PASSWORD} ping`)
- **WHAT:** Password visible via `ps` inside the container.
- **FIX:** Use `REDISCLI_AUTH` env var for the healthcheck instead of `-a`.

#### [VULN-021] Functional dev credentials committed in `.env.docker` / dev compose
- **Severity:** LOW (20/100) · **Confidence:** HIGH · **CWE-798 / CWE-1188** · **OWASP A05:2021** · *(confirmed by Agents 3 & 5)*
- **Location:** `.env.docker:11,17,20`; `docker-compose.yml:17,44`
- **WHAT:** Working dev Postgres/Redis passwords (`homy****word`, `homy****edis`) committed as functional values / `${VAR:-default}` fallbacks. Bounded: dev-only, all dev services bind loopback (`127.0.0.1`), prod never uses them.
- **FIX:** Replace with non-functional placeholders (`CHANGE_ME`) so no working credential lands in git history.

#### [VULN-022] `@types/uuid` a major version behind runtime `uuid`
- **Severity:** LOW (12/100) · **Confidence:** HIGH · **CWE-1104** · **OWASP A06:2021**
- **Location:** `package.json:60` (`@types/uuid ^10` vs `uuid ^14`)
- **WHAT:** Type-definition drift; dev-time only, no runtime impact.
- **FIX:** Bump or drop `@types/uuid` (modern `uuid` ships its own types).

#### [VULN-023] Caret (`^`) version ranges on all dependencies
- **Severity:** LOW (15/100) · **Confidence:** HIGH · **CWE-1104** · **OWASP A06:2021**
- **Location:** `package.json` (all deps)
- **WHAT:** Fresh `npm install` could pull newer minors/patches than audited. **Already mitigated** by the committed integrity-pinned lockfile + `npm ci` in `Dockerfile:18`.
- **FIX:** Keep `npm ci` everywhere (CI + docs), never `npm install` on deploy paths.

---

### Informational

- **INFO-1 — In-memory rate limiter / account lockout are per-process.** `lib/rateLimiter.ts` — with N app instances effective limits become N×; restart clears state. Already documented; Redis design in `SECURITY-RATELIMIT-DESIGN.md`. Weakens the practical efficacy of the IP-based throttles above at scale.
- **INFO-2 — No explicit JSON body-size limit on route handlers.** `req.json()` is unbounded (`serverActions.bodySizeLimit` is 2mb but doesn't cover App-Router routes). Low-priority DoS; consider a guard on non-AI POST bodies.
- **INFO-3 — nginx TLS hardening gaps.** Strong protocols/ciphers + `server_tokens off` present; missing OCSP stapling and custom `dhparam`; deprecated `listen 443 ssl http2;` syntax (functional).
- **INFO-4 — No CI/CD pipeline.** `.github/workflows` absent — no automated SAST/dependency/secret-scan gate. Consider adding Trivy/Grype + secret scanning.
- **INFO-5 — `uuid@14` is an unusually high major.** Verified genuine (official registry, real maintainers, integrity hash). Owner should confirm the bump was intentional.
- **INFO-6 — `strip-ansi` declared as a direct dependency** (usually transitive). Confirm it's imported by app code, else drop.
- **INFO-7 — Dev seed password fallback** (`prisma/seed.ts:1101`, `SEED_PASSWORD || 'devpassword123'`) — guarded by `NODE_ENV=production` + `ALLOW_PROD_SEED` gate. No action.

---

## Threat Intelligence Report (Agent 6 — score 100/100)

No backdoors, C2, exfiltration, cryptominers, or logic bombs in the production codebase.
- No dynamic code execution (`eval`/`new Function`/`child_process`) in `app/**` or `lib/**`; all `.exec(` hits are JS regex.
- Outbound network is expected and hardcoded: `api.anthropic.com` (AI), `nominatim.openstreetmap.org` + `overpass-api.de` (geocoding), relative `/api/*`. No IPs, no Telegram/Discord/Pastebin/webhook channels. The `*.ngrok` entries are legit `allowedDevOrigins` in `next.config.ts`.
- Upload path is not a web shell: `withAuth`-gated, magic-byte sniffed, UUID names, extension derived from sniffed type, 5MB/10-file caps, writes only under `public/uploads`.
- `server.ts` WS/Socket.io handshakes are JWT-verified with an origin allowlist (anti-CSWSH) and participant checks.
- MITRE ATT&CK: no techniques observed.

---

## Attack Path Analysis

#### [CHAIN-001] Pending-account takeover
**Path:** VULN-006 (register enumeration → confirm an email has an unverified pending account) **+** VULN-002 (OTP verify has no per-account lockout → brute the 6-digit code from rotating IPs) **→** attacker verifies and receives session cookies for a pending account.
**Combined severity:** HIGH (individual: MEDIUM + MEDIUM). Fixing either link breaks the chain; fix both.

---

## Remediation Priority Queue

### Fix Now (before launch)
1. **VULN-001** — Require `status:'completed'`/`'confirmed'` in the review interaction check.

### Fix This Sprint (High-value Medium)
2. **VULN-002** — OTP per-account attempt lockout (also breaks CHAIN-001).
3. **VULN-004** — WS `clientIpOf` → prefer `x-real-ip`/rightmost XFF (denial-of-wallet).
4. **VULN-003** — Bind AI chat session to user/cookie, not client-supplied id.
5. **VULN-005** — Serializable tx / unique index on viewing approval.
6. **VULN-006** — Generic registration response (also breaks CHAIN-001).

### Fix This Month (Medium/Low)
7. **VULN-007** — Decide nonce-CSP vs. accept `unsafe-inline` tradeoff (documented).
8. VULN-008..VULN-014 — unbounded match-score query, timing enum, AI error leak, Socket.io length cap, listing rate limit, reset-password limiter + timing-safe cron compare, delete dead `corsHelper.ts`.

### Backlog (Low/Infra hygiene)
- VULN-015..VULN-023 — edge-guard cleanup, `getCurrentUser` hardening, nginx XFF reset, image pinning, non-root migrate, Redis healthcheck auth, dev-cred placeholders, type/dep hygiene.
- INFO-1..INFO-7 — Redis limiter at scale, body-size guard, TLS stapling, CI/CD pipeline.

---

## Methodology

- OWASP Top 10:2021, CWE Top 25:2024, STRIDE per trust boundary, MITRE ATT&CK v15.
- 8 specialist agents (vuln, authz, secrets, deps, IaC, threat-intel, AI-code, logic) in parallel, READ-ONLY (Read/Grep/Glob + read-only shell only).
- Framework-aware false-positive suppression (Prisma parameterization, JSX auto-escaping, static-CSS `dangerouslySetInnerHTML`).
- 4-tier confidence (HIGH/MEDIUM/LOW/INFO); cross-agent confirmations raise confidence.
- Weighted category scoring; findings deduplicated and renumbered VULN-001…023.

---
_READ-ONLY audit — no files other than this report were created or modified; nothing was committed or installed._
