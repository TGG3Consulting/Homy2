# Security Audit Report — Homly (Re-Audit)

**Project:** Homly Real Estate Platform
**Date:** 2026-07-18
**Auditor:** Claude Cybersecurity Skill (8 specialist agents)
**Stack:** Next.js 15 / React 19 / TypeScript / Prisma / PostgreSQL / Socket.io
**Mode:** READ-ONLY (no modifications, no commits, no package installs)
**Note:** This is a **re-audit** after a remediation pass. The previous run scored **52/100 (D)** with 3 CRITICAL. All 16 prior fixes were **verified genuinely present** (see "Verified Fixed"). Findings below are residual/newly-surfaced issues.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Security Score** | **79/100 (Grade: B)** — up from 52/100 |
| **Findings** | Critical: 0 \| High: 3 \| Medium: 19 \| Low: 14 \| Info: 3 |
| **Scope** | Full codebase — 536 source files, 84 API routes, 33 pages, IaC, no CI/CD |
| **Agents Completed** | 8/8 |
| **Auto-CRITICAL gate** | Not triggered (0 critical) |

No malware, backdoors, C2, or exfiltration found (Threat Intel 96/100). No SQL injection, no SSRF, no IDOR, no self-service privilege escalation. Authorization model is strong and consistent. Residual risk concentrates in: two unprotected paid-LLM endpoints, business-logic validation gaps (listing price sign, review authenticity, agent↔property authorization), edge/IaC defense-in-depth, dependency hygiene (stale lockfile), and unrotated secrets sitting at-rest in `.env` (rotation intentionally deferred by the owner).

---

## Remediation Status (applied 2026-07-18, local commits, not yet pushed)

**Fixed & tsc-verified:** VULN-001 (LLM rate-limit+cap), 002+CHAIN-001 (listing price validation + approve re-check), 004 (virtual-tour token_version), 005 (removed export scripts), 006 (WS Origin), 007 (XFF trust), 008 (socket.io CORS), 010+CHAIN-003 (review broker+interaction), 011+CHAIN-002 (agent must own property), 012 (agent slot conflict), 013 (HSTS), 015 (prod app loopback), 016 (adminer/mailhog loopback), 019 (drop unused MCP sdk), 020 (drop @svgr rule), 021 (declare zod), 023 (JWT alg pin), 024 (error detail), 025 (compare cap), 026 (voice rate-limit), 028 (.gitignore), 029 (pin image tags), 030 (nginx static headers), 032 (no localhost CORS in prod), 036 (SMTP requireTLS). Bonus: fixed prod-compose env var names (SMTP_PASS/EMAIL_FROM/JWT_REFRESH_SECRET/CRON_SECRET/ANTHROPIC_API_KEY).

**Deferred (owner / needs care):** VULN-003 (secret rotation — owner's final step); VULN-009 (CSP `unsafe-inline` → needs nonce-based CSP via Next middleware; no active XSS sink today); VULN-014 (nginx edge CSP — covered by app middleware); VULN-017 (run `npm install` to sync lockfile); VULN-018 (ESLint 9 flat-config migration); VULN-022 (wire zod into remaining write routes — critical ones already validate); VULN-027/031 (dev-only compose creds, DB loopback-bound); VULN-033 (Redis-backed limiter + account lockout — needs Redis); VULN-034/035 (dep version review); VULN-038 (remove stray vendor assets — owner to confirm).

---

## Category Scores

| Category | Score | Grade | Weight | Key Finding |
|----------|-------|-------|--------|-------------|
| Vulnerability Detection | 78 | B | 20% | WebSocket origin not validated (CSWSH) |
| Authorization & Access Control | 88 | B | 15% | Virtual-tour writes bypass session revocation |
| Secret Management | 74 | C | 10% | Live unrotated secrets in `.env` + committed export script |
| Dependency Security | 74 | C | 10% | Stale lockfile reintroduces node-pty/bcryptjs; ESLint 8 EOL |
| Infrastructure Security | 80 | B | 10% | Missing HSTS; prod app port published bypassing nginx |
| Threat Intelligence | 96 | A | 15% | Clean — only stray vendor assets |
| AI Code Patterns | 72 | C | 10% | 2 of 4 LLM endpoints unprotected; unused zod layer |
| Logic & Design | 62 | C | 10% | Negative price on listing; review/viewing authz gaps |

---

## Top 5 High Findings

### 1. [VULN-001] Two paid-LLM endpoints have no auth, rate-limit, or input cap
**HIGH** | CWE-770 | OWASP A04:2021 | `app/api/properties/[id]/opinion/route.ts:11-18`, `app/api/properties/[id]/chat/route.ts:16-19`
Of the 4 endpoints calling Claude, `chat` and `chat/compare` are rate-limited but these two per-property ones are not — public, unbounded `conversationHistory`/`message` fed straight into paid LLM calls. Denial-of-wallet + prompt-injection surface.
**Fix:** add `checkRateLimit(..., RATE_LIMITS.ai)` + 4000-char input cap (mirror `chat/route.ts`).

### 2. [VULN-002] Negative / zero price, area, rooms accepted on listing create
**HIGH** | CWE-20 / CWE-841 | OWASP A04:2021 | `app/api/properties/list/route.ts:40,59-61`
Validation runs on raw strings before `parseFloat`/`parseInt`, so `"0"`/`"-5000"` are truthy and pass, storing negative/zero price. Corrupts sort/filter/statistics; chains through the approve route into the live catalogue (CHAIN-001).
**Fix:** validate the parsed numbers: `price > 0`, `area > 0`, `rooms >= 0`, reject `NaN`, add upper bounds; re-validate in approve route.

### 3. [VULN-003] Live, unrotated secrets stored at rest in `.env`
**HIGH** | CWE-798 / CWE-312 | OWASP A02:2021 | `.env:11,14,15,18,21`
Real values: `ANTHROPIC_API_KEY sk-a****gAAA`, `JWT_SECRET jqP5****1GQ==`, `JWT_REFRESH_SECRET 7hFM****TVw==`, `CRON_SECRET 72fb****00cd`. `.env` is correctly gitignored and never committed (verified) — exposure is at-rest only. A leaked `JWT_SECRET` permits token forgery.
**Fix:** rotate all four (owner's deferred final step). Accepted-risk until launch per owner decision.

### 4. [VULN-004] Virtual-tour write handlers bypass session revocation & block checks
**MEDIUM** | CWE-613 / CWE-287 | OWASP A07:2021 | `app/api/properties/[id]/virtual-tour/route.ts:7-21,71`, `.../[roomId]/route.ts:6-19`
These POST/PATCH/DELETE roll their own `verifyAccessToken` + `canManage` (owner/role only) and never check `token_version`/`is_blocked` — the sole mutating routes that skip the shared middleware. A revoked/blocked user's still-valid 15-min token can keep editing tours.
**Fix:** route through `withAuth` (+ownership check) or add `token_version`/`is_blocked` checks inline.

### 5. [VULN-005] `export-data.js` dumps full user table incl. password hashes — committed
**MEDIUM** | CWE-312 / CWE-532 | OWASP A02:2021 | `export-data.js:8,17` (git-tracked)
Runs `prisma.user.findMany()` (bcrypt hashes + PII) and writes unencrypted JSON to temp. A committed data-exfiltration helper.
**Fix:** remove from repo, or exclude `passwordHash` + write to a secured/gitignored path.

---

## Detailed Findings by Severity

### HIGH

| ID | Title | Location | CWE | OWASP |
|----|-------|----------|-----|-------|
| VULN-001 | LLM endpoints (opinion/chat) unprotected — denial-of-wallet | app/api/properties/[id]/opinion:11, /chat:16 | 770 | A04 |
| VULN-002 | Negative/zero price·area·rooms on listing create | app/api/properties/list/route.ts:40 | 20/841 | A04 |
| VULN-003 | Live unrotated secrets at rest in .env | .env:11,14,15,18,21 | 798/312 | A02 |

### MEDIUM

| ID | Title | Location | CWE | OWASP |
|----|-------|----------|-----|-------|
| VULN-004 | Virtual-tour writes bypass token_version/is_blocked | app/api/properties/[id]/virtual-tour/route.ts:7 | 613/287 | A07 |
| VULN-005 | export-data.js dumps users+hashes (committed) | export-data.js:8 | 312/532 | A02 |
| VULN-006 | WebSocket /ws/chat no Origin validation (CSWSH) | server.ts:362-376 | 1385 | A05 |
| VULN-007 | Rate-limit bypass via spoofable X-Forwarded-For (leftmost) | lib/rateLimiter.ts:69-83 | 807/770 | A07 |
| VULN-008 | Socket.io CORS `*` fallback with credentials:true | server.ts:47-54 | 942 | A05 |
| VULN-009 | Prod CSP keeps script-src 'unsafe-inline' | middleware.ts:43 | 79 | A05 |
| VULN-010 | Reviews: no transaction relationship + any user_type reviewable | app/api/agents/[id]/reviews/route.ts:82-105 | 639 | A04 |
| VULN-011 | Agent-typed user creates viewings for arbitrary clientId on unowned property | app/api/viewings/route.ts:127-180 | 639/770 | A04 |
| VULN-012 | Double-booking tx guards per-client dup only; agent time-slot conflicts unguarded | app/api/viewings/route.ts:191-200 | 362 | A04 |
| VULN-013 | Missing HSTS header (nginx 443) | docker/nginx/conf.d/default.conf:36-41 | 16 | A05 |
| VULN-014 | No CSP at nginx edge (mitigated: app middleware sets it) | docker/nginx/conf.d/default.conf:35 | 16 | A05 |
| VULN-015 | Prod app port 3000 published to host (bypasses nginx TLS/rate-limits) | docker-compose.prod.yml:31 | 200 | A05 |
| VULN-016 | Adminer (+Mailhog) exposed on 0.0.0.0 in dev | docker-compose.yml:54-59,74 | 306 | A05 |
| VULN-017 | Stale lockfile still resolves node-pty (PTY, install script) + bcryptjs | package-lock.json:8129,3612 | 1104/1395 | A06 |
| VULN-018 | ESLint 8 end-of-life | package.json:78 | 1104 | A06 |
| VULN-019 | @modelcontextprotocol/sdk ^0.5.0 majors behind (verify used) | package.json:24 | 1104 | A06 |
| VULN-020 | @svgr/webpack referenced in next.config but not installed | next.config.ts:122-125 | 1104/20 | A06 |
| VULN-021 | zod imported but not declared in package.json (transitive only) | lib/validations/*.ts:1 | 1104 | A06 |
| VULN-022 | zod schema layer used by 1/84 routes — manual validation gaps | app/api/properties/list/route.ts:59 | 20 | A03 |

### LOW

| ID | Title | Location | CWE | OWASP |
|----|-------|----------|-----|-------|
| VULN-023 | JWT verify does not pin `algorithms:['HS256']` | lib/services/jwtService.ts:49-63 | 347 | A02 |
| VULN-024 | Verbose error `details` leaked on chat route | app/api/chat/route.ts:108,146 | 209 | A09 |
| VULN-025 | chat/compare: no input-length cap; client-supplied systemContext | app/api/chat/compare/route.ts:13-23 | 20/770 | A03 |
| VULN-026 | search/voice: no rate-limit / transcript cap | app/api/search/voice/route.ts:7-19 | 770 | A04 |
| VULN-027 | Weak default creds committed in .env.docker | .env.docker:11,13,21,23 | 798 | A02 |
| VULN-028 | .gitignore gaps (`*.key`, `.env.*` catch-all, dump patterns) | .gitignore | 312 | A02 |
| VULN-029 | Unpinned/mutable base image tags (:latest on adminer/mailhog) | Dockerfile:7; docker-compose*.yml | 16 | A05 |
| VULN-030 | Security headers dropped on cached static nginx locations | docker/nginx/conf.d/default.conf:65-76 | 16 | A05 |
| VULN-031 | Weak dev fallback creds in compose (homy_dev_password/redis) | docker-compose.yml:17,44 | 798 | A05 |
| VULN-032 | CORS allowlist hardcodes localhost origins in production | middleware.ts:64-68 | 942 | A05 |
| VULN-033 | In-memory rate limiter (not distributed) + no per-account lockout | lib/rateLimiter.ts:11; app/api/auth/login:12 | 770/307 | A04 |
| VULN-034 | uuid@^14.0.0 unusual major; @types/uuid@10 mismatch — verify | package.json:64,75 | 1357 | A06 |
| VULN-035 | Loose caret ranges on security-critical deps (jwt/bcrypt/ws/next) | package.json:42,47,50,65 | 1104 | A06 |
| VULN-036 | SMTP `secure:false` without `requireTLS:true` (STARTTLS downgrade) | lib/services/emailService.ts:6 | 693 | A05 |

### INFO

| ID | Title | Location |
|----|-------|----------|
| VULN-037 | 7 packages with install scripts / native builds (bcrypt/sharp expected; node-pty not) | package-lock.json |
| VULN-038 | Stray non-app assets in repo (HambarcumMC/*, VectorStock_files/ GTM dump) | repo root |
| VULN-039 | Native SVG/analytics obfuscation hits are all vendored libs — benign | vendored |

---

## Threat Intelligence Report (96/100 — CLEAN)

No backdoors, C2, data exfiltration, cryptominers, or malicious obfuscation in application code. MITRE ATT&CK screen negative (T1059/T1027/T1071/T1005/T1041/T1496). `eval`/`exec` hits are `regex.exec()` or vendored library codegen. Outbound calls are all legitimate: internal `/api/*`, OpenStreetMap/Overpass geocoding, and `api.anthropic.com` (keyed from env — the intended AI feature). Telegram `t.me/` links are property-share buttons. No prompt-injection payloads in any scanned file (including this report and `.md` files). `check_server.py` (prior CRITICAL SSH creds) confirmed removed from working tree.

---

## Attack Path Analysis

- **[CHAIN-001] Price manipulation → live catalogue** — VULN-002 (negative/zero price passes create validation) + approve route copies `listing.price` into live `Property` with no re-validation and `verified:true`. A moderator eyeballing photos publishes a `-1`/`0` AMD listing that corrupts platform-wide sort/filter/stats. **Combined: HIGH.**
- **[CHAIN-002] Notification/CRM spam** — VULN-011 (agent-typed account creates viewings naming arbitrary clientId on any property) + generous `RATE_LIMITS.api` (60/min) → thousands of forged "viewing proposed" notifications/leads into arbitrary users' feeds. **Combined: MEDIUM.**
- **[CHAIN-003] Reputation manipulation** — VULN-010 (no interaction check, any user reviewable) + no per-target review rate limit + registration bypassable across IPs → review-bomb/inflate any broker. **Combined: MEDIUM.**

---

## Verified Fixed (prior remediation — confirmed present)

AI chat rate-limiting · upload magic-byte sniffing + extension-from-sniffed-type · avatar delete path-traversal guard · `token_version` revocation (withAuth/withOptionalAuth/withBroker/withAdmin/withModerator/refresh/reset-password/password-change) · cookie Secure-in-prod + HttpOnly + SameSite=lax · CSP `unsafe-eval` gated to dev · public listing GET no longer leaks owner PII · viewing double-booking Serializable tx · rate limits (viewings/messages/waitlist) · admin approve atomic `updateMany` claim + adminActionLog · no direct Property create bypassing moderation · dev Postgres/Redis loopback-bound + Redis `--requirepass` · prod DB/Redis internal-only · nginx `X-XSS-Protection "0"` (correct modern setting) · Dockerfile non-root + healthcheck + `.dockerignore` blocking `.env` · leaked secret files removed from working tree · mass-assignment blocked on `users/me` (role not self-assignable) · cron routes fail-closed without `CRON_SECRET`.

---

## Remediation Priority Queue

**Fix now (High):**
1. VULN-001 — rate-limit + input-cap `properties/[id]/opinion` & `properties/[id]/chat`.
2. VULN-002 — validate parsed price/area/rooms (>0) on create + re-validate in approve (breaks CHAIN-001).
3. VULN-003 — rotate `.env` secrets (owner's deferred step).

**Fix this sprint (Medium):**
4. VULN-004 — virtual-tour writes → `withAuth` / token_version check.
5. VULN-006/008 — WebSocket Origin validation; drop socket.io `*` CORS fallback.
6. VULN-007 — trust `x-real-ip` (rightmost hop), not leftmost XFF.
7. VULN-010/011/012 — review relationship+broker check; agent must own property; agent time-slot conflict check.
8. VULN-005 — remove/neuter `export-data.js`.
9. VULN-013/015/016 — HSTS header; drop prod `app` host port; loopback-bind Adminer/Mailhog.
10. VULN-017/020/021 — `npm install` to sync lockfile; declare `zod` + `@svgr/webpack` (or remove).
11. VULN-009/022 — nonce-based CSP (drop `unsafe-inline`); wire zod schemas into write routes.

**Fix this month (Low):** VULN-023..036 — algorithm pinning, generic errors, input caps on compare/voice, `.env.docker` placeholders, `.gitignore` hardening, image digest pinning, static-location headers, prod CORS allowlist, Redis-backed rate limiter + account lockout, dep version verification, `requireTLS` on SMTP.

**Backlog (Info):** VULN-037..039 — CI `--ignore-scripts`, remove stray vendor assets.

---

## Methodology

OWASP Top 10:2021 · CWE Top 25:2024 · STRIDE per trust boundary · MITRE ATT&CK v15 · framework-aware false-positive suppression (Prisma parameterization, React auto-escaping) · 4-tier confidence · 8 specialist agents with weighted scoring. Deduplicated cross-agent findings (AI endpoints, CSP, secrets) and renumbered.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built by agricidaniel — Join the AI Marketing Hub community
🆓 Free  → https://www.skool.com/ai-marketing-hub
⚡ Pro   → https://www.skool.com/ai-marketing-hub-pro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
