# Security Audit Report — Homly

**Project:** Homly Real Estate Platform
**Date:** 2026-07-17
**Auditor:** Claude Cybersecurity Skill
**Stack:** Next.js 15 / React 19 / TypeScript / Socket.io / Prisma / PostgreSQL
**Mode:** READ-ONLY (no modifications, no commits, no package installs)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Security Score** | **52/100 (Grade: D)** |
| **Findings** | Critical: 3 \| High: 8 \| Medium: 12 \| Low: 10 \| Info: 4 |
| **Scope** | Full codebase audit |
| **Files Analyzed** | 120+ source files |
| **Agents Completed** | 8/8 |

**⚠️ AUTO-CRITICAL GATE TRIGGERED:** Multiple CRITICAL findings detected. Immediate action required before deployment.

---

## Category Scores

| Category | Score | Grade | Weight | Key Finding |
|----------|-------|-------|--------|-------------|
| Vulnerability Detection | 72/100 | C | 20% | Missing auth on AI endpoints |
| Authorization & Access Control | 82/100 | B | 15% | Good middleware, minor gaps |
| Secret Management | **20/100** | **F** | 10% | **CRITICAL: Production secrets committed** |
| Dependency Security | 62/100 | D | 10% | Duplicate bcrypt, deprecated packages |
| Infrastructure Security | 62/100 | D | 10% | Hardcoded secrets in .env, exposed ports |
| Threat Intelligence | 85/100 | B | 15% | No backdoors, AI prompt injection risk |
| AI Code Patterns | 72/100 | C | 10% | Missing validation on some endpoints |
| Logic & Design | 68/100 | D | 10% | Race conditions, missing rate limits |

---

## Top 5 Critical/High Findings

### 1. [VULN-001] Production Anthropic API Key Committed
**Severity: CRITICAL** | CWE-798 | OWASP A02:2021
**Location:** `.env:8`
**Description:** Live Anthropic API key `sk-ant-api03-****-wZyVugAA` is committed to repository.
**Impact:** Financial damage, API abuse, data exfiltration via AI service.
**Recommendation:** Revoke key immediately in Anthropic console, rotate, remove from git history.

### 2. [VULN-002] Production JWT Secrets Committed
**Severity: CRITICAL** | CWE-798 | OWASP A02:2021
**Location:** `.env:4-5`
**Description:** JWT_SECRET and JWT_REFRESH_SECRET are committed to repository.
**Impact:** Attackers can forge valid tokens, impersonate any user including admin.
**Recommendation:** Generate new secrets (`openssl rand -base64 64`), invalidate all sessions.

### 3. [VULN-003] Hardcoded SSH Root Password
**Severity: CRITICAL** | CWE-798 | OWASP A02:2021
**Location:** `check_server.py:5`
**Description:** SSH root credentials for production server `45.32.62.87` hardcoded.
**Impact:** Complete server compromise, ransomware, data theft.
**Recommendation:** Change password immediately, disable root SSH, use key-based auth.

### 4. [VULN-004] Unauthenticated AI Chat Endpoint
**Severity: HIGH** | CWE-306 | OWASP A01:2021
**Location:** `app/api/chat/route.ts:19`
**Description:** `/api/chat` accepts requests without authentication or rate limiting.
**Impact:** Denial-of-wallet attack, API credit exhaustion, prompt injection.
**Recommendation:** Add `withAuth` or `withOptionalAuth` middleware with rate limiting.

### 5. [VULN-005] Password Change Does Not Invalidate Sessions
**Severity: HIGH** | CWE-613 | OWASP A07:2021
**Location:** `app/api/users/me/route.ts:256-270`
**Description:** When user changes password, `token_version` is not incremented.
**Impact:** Attacker sessions remain valid after password change.
**Recommendation:** Add `token_version: { increment: 1 }` when password changes.

---

## Detailed Findings by Severity

### CRITICAL Severity

| ID | Title | Location | CWE | OWASP |
|----|-------|----------|-----|-------|
| VULN-001 | Production Anthropic API Key Committed | .env:8 | CWE-798 | A02:2021 |
| VULN-002 | Production JWT Secrets Committed | .env:4-5 | CWE-798 | A02:2021 |
| VULN-003 | Hardcoded SSH Root Password | check_server.py:5 | CWE-798 | A02:2021 |

### HIGH Severity

| ID | Title | Location | CWE | OWASP |
|----|-------|----------|-----|-------|
| VULN-004 | Unauthenticated AI Chat Endpoint | app/api/chat/route.ts:19 | CWE-306 | A01:2021 |
| VULN-005 | Password Change No Session Invalidation | app/api/users/me/route.ts:256 | CWE-613 | A07:2021 |
| VULN-006 | Unauthenticated Compare Chat Endpoint | app/api/chat/compare/route.ts:5 | CWE-306 | A01:2021 |
| VULN-007 | Database Password in Committed .env | .env:1 | CWE-798 | A02:2021 |
| VULN-008 | Weak Default Password in Seed Data | prisma/seed.ts:1109 | CWE-798 | A07:2021 |
| VULN-009 | Password Hash Files Committed | update_admin_pass.sql | CWE-798 | A02:2021 |
| VULN-010 | User Data Dump with Password Hashes | homly_data.json:6 | CWE-312 | A02:2021 |
| VULN-011 | Duplicate bcrypt Libraries | package.json:42-43 | CWE-1395 | A06:2021 |

### MEDIUM Severity

| ID | Title | Location | CWE | OWASP |
|----|-------|----------|-----|-------|
| VULN-012 | AI Prompt Injection Vulnerability | lib/anthropicClient.ts:287 | CWE-74 | A03:2021 |
| VULN-013 | Viewing Double-Booking Race Condition | app/api/viewings/route.ts:176 | CWE-362 | A04:2021 |
| VULN-014 | Missing Rate Limiting on Viewings | app/api/viewings/route.ts | CWE-770 | A04:2021 |
| VULN-015 | Missing Rate Limiting on Chat Messages | app/api/chats/[id]/messages/route.ts | CWE-770 | A04:2021 |
| VULN-016 | Missing Rate Limiting on Waitlist | app/api/waitlist/route.ts:8 | CWE-770 | A06:2021 |
| VULN-017 | Session Cleanup Without Authentication | app/api/chat/route.ts:108 | CWE-306 | A01:2021 |
| VULN-018 | File Extension Bypass in Upload | app/api/upload/route.ts:64 | CWE-434 | A04:2021 |
| VULN-019 | Path Traversal in Avatar Deletion | app/api/users/me/avatar/route.ts:65 | CWE-22 | A01:2021 |
| VULN-020 | Missing CSRF Token Validation | middleware.ts, lib/cookies.ts | CWE-352 | A01:2021 |
| VULN-021 | CSP Allows unsafe-eval | middleware.ts:42 | CWE-1021 | A05:2021 |
| VULN-022 | Database Port Exposed to All Interfaces | docker-compose.yml:19-20 | CWE-200 | A05:2021 |
| VULN-023 | Redis Exposed Without Authentication | docker-compose.yml:38-39 | CWE-306 | A05:2021 |

### LOW Severity

| ID | Title | Location | CWE | OWASP |
|----|-------|----------|-----|-------|
| VULN-024 | In-Memory Rate Limiter Not Distributed | lib/rateLimiter.ts:11 | CWE-770 | A04:2021 |
| VULN-025 | Cookie Secure Flag Config-Dependent | lib/cookies.ts:11 | CWE-614 | A05:2021 |
| VULN-026 | Deprecated PostCSS in Next.js | package-lock.json:8047 | CWE-1395 | A06:2021 |
| VULN-027 | Deprecated Transitive Dependencies | package-lock.json | CWE-1395 | A06:2021 |
| VULN-028 | Unused node-pty Dependency | package.json:52 | CWE-1104 | A06:2021 |
| VULN-029 | Loose Version Ranges (Caret Versions) | package.json | CWE-1395 | A06:2021 |
| VULN-030 | ESLint v8 End of Life | package.json:80 | CWE-1395 | A06:2021 |
| VULN-031 | Unprotected Cron Endpoints in Dev | app/api/cron/*.ts | CWE-306 | A01:2021 |
| VULN-032 | Missing Audit Logging for User Actions | app/api/users/me/route.ts | CWE-778 | A09:2021 |
| VULN-033 | Listing Endpoint Leaks Owner PII | app/api/properties/listings/[id]/route.ts:19 | CWE-200 | A01:2021 |

### INFO Severity

| ID | Title | Location | CWE | OWASP |
|----|-------|----------|-----|-------|
| VULN-034 | Health Endpoint Exposes Memory Metrics | app/api/health/route.ts:4 | CWE-200 | A01:2021 |
| VULN-035 | dangerouslySetInnerHTML for Static CSS | Multiple frontend files | CWE-79 | A03:2021 |
| VULN-036 | Deprecated X-XSS-Protection Header | docker/nginx/conf.d/default.conf:38 | CWE-1021 | A05:2021 |
| VULN-037 | Missing Content-Security-Policy in nginx | docker/nginx/conf.d/default.conf | CWE-1021 | A05:2021 |

---

## Attack Path Analysis

### [CHAIN-001] Complete Infrastructure Compromise
**Path:** VULN-003 (SSH credentials) → Full server access
**Combined Severity: CRITICAL**

With hardcoded root SSH credentials, an attacker gains complete control of the production server, enabling:
- Database dump (including password hashes)
- Environment variable extraction (all secrets)
- Ransomware deployment
- Cryptomining installation

### [CHAIN-002] API Key Abuse + Financial Damage
**Path:** VULN-001 (API key) + VULN-004 (unauthenticated endpoint) → Wallet drain
**Combined Severity: CRITICAL**

Attacker can:
1. Use exposed Anthropic API key directly
2. Abuse unauthenticated `/api/chat` endpoint
3. Exhaust API credits causing significant financial damage

### [CHAIN-003] Account Takeover Persistence
**Path:** VULN-005 (session not invalidated) + Initial compromise → Persistent access
**Combined Severity: HIGH**

If attacker gains initial access (phishing, credential stuffing):
1. Victim discovers compromise and changes password
2. Attacker's session remains valid
3. Attacker maintains persistent access

### [CHAIN-004] Authentication Bypass
**Path:** VULN-002 (JWT secrets) → Token forgery → Admin impersonation
**Combined Severity: CRITICAL**

With exposed JWT secrets, attacker can:
1. Generate valid tokens for any user ID
2. Impersonate admin accounts
3. Access all user data, approve/reject listings, block users

---

## Remediation Priority Queue

### Fix Now (CRITICAL) — within hours

| Priority | Finding | Action |
|----------|---------|--------|
| 1 | VULN-001 | Revoke Anthropic API key in console, generate new key |
| 2 | VULN-002 | Generate new JWT secrets: `openssl rand -base64 64` |
| 3 | VULN-003 | Change SSH root password, disable root login, use SSH keys |
| 4 | All secrets | Remove `.env` and sensitive files from git history (BFG Repo Cleaner) |

### Fix This Sprint (HIGH) — within days

| Priority | Finding | Action |
|----------|---------|--------|
| 5 | VULN-004, VULN-006 | Add `withAuth` to AI chat endpoints |
| 6 | VULN-005 | Add `token_version: { increment: 1 }` on password change |
| 7 | VULN-007-010 | Remove committed password hash files, reset affected passwords |
| 8 | VULN-011 | Remove duplicate bcryptjs, use only bcrypt |

### Fix This Month (MEDIUM)

| Priority | Finding | Action |
|----------|---------|--------|
| 9 | VULN-012 | Implement AI prompt input sanitization |
| 10 | VULN-013 | Add database-level unique constraint for viewings |
| 11 | VULN-014-016 | Add rate limiting to viewings, chat, waitlist |
| 12 | VULN-018-019 | Fix file upload extension validation, path traversal |
| 13 | VULN-020-023 | Add CSRF tokens, fix CSP, secure Docker ports |

### Backlog (LOW/INFO)

- VULN-024: Implement Redis-based rate limiting for production
- VULN-025: Default cookies to secure in production
- VULN-026-030: Update deprecated dependencies
- VULN-031-037: Fix minor security hygiene issues

---

## Positive Security Findings

The codebase demonstrates several security best practices:

1. **JWT Implementation:** Proper secret validation (fail-fast), token versioning for revocation
2. **Password Handling:** bcrypt with 12 rounds
3. **HttpOnly Cookies:** Auth tokens protected from XSS
4. **Security Headers:** Comprehensive CSP, X-Frame-Options, HSTS in middleware
5. **Rate Limiting:** Present on auth endpoints (login, register, OTP)
6. **Prisma ORM:** No raw SQL injection risks found
7. **Admin Authorization:** Proper `withAdmin`/`withModerator` middleware
8. **Input Validation:** Zod schemas for auth endpoints
9. **Docker Production Config:** Non-root user, multi-stage builds, health checks
10. **nginx Configuration:** Modern TLS, rate limiting, security headers

---

## Methodology

- **Standards:** OWASP Top 10:2021, CWE Top 25:2024, OWASP API Security Top 10:2023
- **Threat Modeling:** STRIDE analysis per trust boundary
- **Attack Surface:** MITRE ATT&CK v15 mapping
- **False Positive Suppression:** Framework-aware (Next.js, Prisma, React auto-escaping)
- **Confidence Scoring:** 4-tier (HIGH/MEDIUM/LOW/INFO)
- **Agent Architecture:** 8 specialist agents with weighted scoring

---

## Files Analyzed

```
app/api/auth/**/*.ts        (8 files)
app/api/admin/**/*.ts       (12 files)
app/api/properties/**/*.ts  (15 files)
app/api/viewings/**/*.ts    (7 files)
app/api/chat/**/*.ts        (3 files)
app/api/chats/**/*.ts       (5 files)
app/api/users/**/*.ts       (10 files)
app/api/upload/**/*.ts      (1 file)
lib/middleware/**/*.ts      (3 files)
lib/services/**/*.ts        (12 files)
lib/*.ts                    (15 files)
prisma/seed.ts              (1 file)
server.ts                   (1 file)
middleware.ts               (1 file)
.env, .env.*                (4 files)
Dockerfile                  (1 file)
docker-compose*.yml         (2 files)
docker/nginx/**/*           (3 files)
package.json, package-lock.json (2 files)
+ Additional SQL, JSON files
```

---

## Disclaimer

This audit was conducted in READ-ONLY mode. No files were modified, no commits were made, and no packages were installed. The findings are based on static code analysis and require verification in a controlled environment before remediation.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built by agricidaniel — Join the AI Marketing Hub community
🆓 Free  → https://www.skool.com/ai-marketing-hub
⚡ Pro   → https://www.skool.com/ai-marketing-hub-pro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
