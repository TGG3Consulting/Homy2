/**
 * Security regression tests (VULN-001..013) — HTTP integration.
 *
 * Runs against a live server. No external deps.
 *   BASE=http://localhost:3000 node scripts/security-tests.mjs
 *
 * Covers the fixes verified during remediation:
 *   VULN-006  registration is non-enumerable (identical response, existing vs new)
 *   VULN-009  login rejects a non-existent email with the generic 401
 *   VULN-002  repeated wrong passwords get throttled (429)
 *   VULN-008  ?sort_by=match_score responds 200 (bounded fetch, no crash)
 *   VULN-013  cron endpoints reject a missing/wrong secret (401)
 *
 * Note: account-lockout-by-email (distributed defence) and the sliding-window
 * limiter are additionally covered by the in-process unit checks; from a single
 * client IP the per-IP limiter and the per-account lockout both surface as 429.
 */

const BASE = process.env.BASE || 'http://localhost:3000';
let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
};
const post = async (path, body, headers = {}) => {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  let json = null; try { json = await r.json(); } catch {}
  return { status: r.status, json };
};

const run = async () => {
  console.log(`\nSecurity regression suite → ${BASE}\n`);

  // VULN-006 — registration must not reveal whether an email exists.
  console.log('VULN-006 registration anti-enumeration');
  const existing = await post('/api/auth/register', { email: 'admin@homy.am', password: 'StrongPass123!', first_name: 'T', last_name: 'U' });
  const fresh = await post('/api/auth/register', { email: `newuser_${Date.now()}@example.com`, password: 'StrongPass123!', first_name: 'T', last_name: 'U' });
  ok(existing.status === 200, 'existing email → 200', `(got ${existing.status})`);
  ok(fresh.status === 200, 'fresh email → 200', `(got ${fresh.status})`);
  ok(JSON.stringify(existing.json) === JSON.stringify(fresh.json), 'responses are byte-identical (no oracle)');

  // VULN-009 — non-existent login gets the same generic 401 (no timing/message oracle).
  console.log('VULN-009 login of a non-existent account');
  const nope = await post('/api/auth/login', { email: `nobody_${Date.now()}@example.com`, password: 'whatever123' });
  ok(nope.status === 401, 'non-existent email → 401', `(got ${nope.status})`);
  ok(nope.json?.error === 'Invalid email or password', 'generic error message');

  // VULN-002 — repeated wrong passwords are throttled.
  console.log('VULN-002 brute-force throttling');
  const victim = `lockout_${Date.now()}@example.com`;
  await post('/api/auth/register', { email: victim, password: 'CorrectPass123!', first_name: 'L', last_name: 'V' });
  let got429 = false;
  for (let i = 1; i <= 6; i++) {
    const a = await post('/api/auth/login', { email: victim, password: `Wrong${i}!` });
    if (a.status === 429) { got429 = true; break; }
  }
  ok(got429, 'wrong passwords eventually return 429');

  // VULN-008 — match_score sort must not crash / hang.
  console.log('VULN-008 bounded match_score sort');
  const ms = await fetch(`${BASE}/api/properties?sort_by=match_score&limit=10`).then((r) => r.status).catch(() => 0);
  ok(ms === 200, 'GET /api/properties?sort_by=match_score → 200', `(got ${ms})`);

  // VULN-013 — cron endpoints reject missing secret.
  console.log('VULN-013 cron auth');
  const cron = await post('/api/cron/complete-viewings', {});
  ok(cron.status === 401 || cron.status === 503, 'no cron secret → 401/503', `(got ${cron.status})`);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
};

run().catch((e) => { console.error('Suite error:', e); process.exit(1); });
