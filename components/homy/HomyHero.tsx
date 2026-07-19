'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * "Homy face" hero — true multi-layer parallax using real cut-out layers:
 *   sky (gradient) → clouds.png (drifts on its own) → "Homy" wordmark →
 *   city.png (buildings with transparent center, occlude the letters) →
 *   plants.png (foreground bokeh). Each layer parallaxes at its own depth.
 *   Flat white cloud-style letters; eyes track the cursor and blink.
 */
const HERO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800;900&display=swap');
@font-face{font-family:'The Naturel Std';src:url('/fonts/the-naturel-std.ttf') format('truetype');font-weight:normal;font-style:normal;font-display:swap}
.homy-hero{position:relative;width:100%;height:100vh;min-height:640px;overflow:hidden;background:#2f7fc4;font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased;perspective:1300px}
.homy-hero *{box-sizing:border-box}
.homy-hero .layer{position:absolute;inset:-10% -10% -10% -10%;background-position:center;will-change:transform}
.homy-hero .sky{background:radial-gradient(130% 105% at 50% 2%, #cfe9f8 0%, #7cbcec 30%, #3f95df 60%, #1f6cc0 100%);z-index:0}
.homy-hero .clouds{background-image:url('/hero-clouds.png');background-size:cover;z-index:1;opacity:.96}
.homy-hero .cityfront{background-image:url('/hero-city.png');background-size:cover;background-position:center 46%;z-index:4}
.homy-hero .plants{background-image:url('/hero-plants.png');background-size:cover;background-position:center bottom;z-index:5}
.homy-hero .grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,20,.14),rgba(6,10,20,0) 22%,rgba(6,10,20,0) 56%,rgba(6,10,20,.6));z-index:6;pointer-events:none}

.homy-hero .nav{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;gap:22px;padding:20px 34px}
.homy-hero .nav .brand{font-size:19px;font-weight:800;letter-spacing:-.02em;color:#fff;text-decoration:none}
.homy-hero .nav .brand .m{color:#2BC091}
.homy-hero .nav a{font-size:13px;font-weight:600;color:rgba(255,255,255,.85);text-decoration:none}
.homy-hero .nav a:hover{color:#fff}
.homy-hero .nav .sp{margin-left:auto}
.homy-hero .nav .cta{color:#fff;font-weight:700;font-size:13px;padding:9px 18px;border-radius:11px;background:radial-gradient(135% 175% at 50% 14%,#2BC091,#0B6E4F);text-decoration:none;box-shadow:0 6px 20px rgba(4,40,28,.4)}

.homy-hero .wm{position:absolute;left:50%;top:24%;transform:translateX(-50%);z-index:5;font-family:'The Naturel Std','M PLUS Rounded 1c',sans-serif;font-weight:normal;letter-spacing:.01em;line-height:.9;font-size:clamp(80px,16vw,250px);color:#fff;user-select:none;will-change:transform;filter:drop-shadow(0 6px 16px rgba(20,28,45,.22))}
.homy-hero .wm .m{color:#2BC091}
.homy-hero .wm:not(.wm-back) .y{color:transparent}
.homy-hero .wm-back{z-index:3;color:transparent}
.homy-hero .wm-back .m{color:transparent}
.homy-hero .wm-back .y{color:#fff}

.homy-hero .eyes{position:absolute;left:50%;top:51%;transform:translateX(-50%);z-index:7;display:flex;gap:clamp(48px,8vw,128px);will-change:transform;transform-style:preserve-3d}
.homy-hero .eye{width:clamp(62px,8.6vw,124px);height:clamp(62px,8.6vw,124px);border-radius:50%;background:radial-gradient(60% 60% at 42% 34%,#fff,#e7eef0 66%,#c4d1d4);box-shadow:0 18px 42px rgba(0,0,0,.34),inset 0 -7px 15px rgba(0,0,0,.15),inset 0 5px 9px rgba(255,255,255,.95);position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.homy-hero .pupil{width:44%;height:44%;border-radius:50%;background:radial-gradient(50% 50% at 40% 34%,#33413f,#0c1211 66%,#000);position:relative;will-change:transform;box-shadow:inset 0 2px 5px rgba(255,255,255,.18)}
.homy-hero .pupil::after{content:'';position:absolute;top:16%;left:20%;width:30%;height:30%;border-radius:50%;background:#fff;opacity:.92}
.homy-hero .lid{position:absolute;left:0;right:0;top:0;height:100%;border-radius:50%;background:radial-gradient(60% 60% at 42% 34%,#f2f6f7,#dbe4e6);transform-origin:top;transform:scaleY(0);will-change:transform}

.homy-hero .mouth{position:absolute;left:50%;top:70%;transform:translateX(-50%);z-index:7;width:min(560px,86vw);display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.95);border:1px solid rgba(255,255,255,.6);border-radius:16px;padding:12px 14px;box-shadow:0 18px 50px rgba(4,20,14,.44)}
.homy-hero .mouth .ic{width:30px;height:30px;border-radius:9px;flex:none;display:flex;align-items:center;justify-content:center;background:radial-gradient(135% 175% at 50% 14%,#2BC091,#0B6E4F);color:#fff}
.homy-hero .mouth input{flex:1;border:0;outline:none;background:none;font-family:inherit;font-size:15px;color:#14181F;min-width:0}
.homy-hero .mouth input::placeholder{color:#6A7382}
.homy-hero .mouth .go{width:44px;height:44px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;cursor:pointer;border:0;background:radial-gradient(135% 175% at 50% 14%,#2BC091,#0B6E4F);box-shadow:0 8px 20px rgba(4,40,28,.35)}
.homy-hero .sub{position:absolute;left:50%;top:79%;transform:translateX(-50%);z-index:7;font-size:13.5px;color:rgba(255,255,255,.92);text-align:center;width:min(520px,86vw)}
.homy-hero .scrollhint{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);z-index:7;color:rgba(255,255,255,.85);font-size:11px;font-weight:700;letter-spacing:.14em;display:flex;flex-direction:column;align-items:center;gap:7px}
.homy-hero .scrollhint .mo{width:18px;height:28px;border:2px solid rgba(255,255,255,.75);border-radius:12px;position:relative}
.homy-hero .scrollhint .mo::after{content:'';position:absolute;top:5px;left:50%;transform:translateX(-50%);width:3px;height:6px;border-radius:2px;background:#fff;animation:sc 1.4s ease-in-out infinite}
@keyframes sc{0%,100%{opacity:0;transform:translate(-50%,0)}50%{opacity:1;transform:translate(-50%,7px)}}
@media(max-width:640px){.homy-hero .nav a{display:none}.homy-hero .nav .cta{display:inline-block}}
`;

// Cursor-follow matrix params (MoneyCat "Vl" handler, front layer): each of the 16
// matrix3d cells eases between MMIN (pointer at 0%), DEF (center 50%) and MMAX (100%)
// along the axis in COORD. Carries both rotation and a ~76px translate → the wordmark
// visibly "leans" toward the cursor.
const COORD: (string | null)[] = ['x', null, 'x', null, 'y', 'y', 'y', null, 'x', 'y', 'x', null, 'x', 'y', null, null];
const DEF = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const MMAX = [0.975, 0, -0.221, 0, -0.018, 0.996, -0.08, 0, 0.221, 0.08, 0.974, 0, 76.72, 28.08, 0, 1];
const MMIN = [0.975, 0, 0.221, 0, 0.018, 0.996, 0.08, 0, -0.221, -0.08, 0.974, 0, -76.72, -28.08, 0, 1];

export default function HomyHero() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const wmRef = useRef<HTMLDivElement>(null);
  const wmBackRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const plantsRef = useRef<HTMLDivElement>(null);
  const pupilL = useRef<HTMLDivElement>(null);
  const pupilR = useRef<HTMLDivElement>(null);
  const lidL = useRef<HTMLDivElement>(null);
  const lidR = useRef<HTMLDivElement>(null);

  const cur = useRef({ x: 0, y: 0 }); // smoothed pointer (px)
  const tgt = useRef({ x: 0, y: 0 }); // raw pointer target (px)
  const blink = useRef({ next: 2600, t: 0 });

  useEffect(() => {
    let alive = true;
    fetch('/api/users/me', { credentials: 'include' }).then((r) => { if (alive) setAuthed(r.ok); }).catch(() => { if (alive) setAuthed(false); });
    return () => { alive = false; };
  }, []);

  // MoneyCat "Vl" cursor-follow, reproduced exactly:
  //  - smooth currentX/Y toward the raw pointer px by /stepCoef(10) every 30ms,
  //    snapping to rest below minDelta(5) — a slow ~300ms trail, no spring/overshoot.
  //  - build the wordmark's matrix3d by easing each of 16 cells between
  //    MMIN(0%) → DEF(center) → MMAX(100%) along the mouse-% axis in COORD.
  //    This carries both the 3D turn AND a translate, so it clearly leans to the cursor.
  useEffect(() => {
    cur.current.x = tgt.current.x = window.innerWidth / 2;
    cur.current.y = tgt.current.y = window.innerHeight / 2;

    const cell = (i: number, px: number, py: number) => {
      const ax = COORD[i];
      if (ax == null) return DEF[i];
      const l = ax === 'x' ? px : py; // 0..100
      let a: number, b: number, f: number;
      if (l < 50) { a = MMIN[i]; b = DEF[i]; f = (l * 100) / 50; }
      else { a = DEF[i]; b = MMAX[i]; f = ((l - 50) * 100) / 50; }
      return ((b - a) * f) / 100 + a;
    };

    const id = window.setInterval(() => {
      const dx = tgt.current.x - cur.current.x, dy = tgt.current.y - cur.current.y;
      if (Math.abs(dx) >= 5 || Math.abs(dy) >= 5) { cur.current.x += dx / 10; cur.current.y += dy / 10; }

      const sw = window.innerWidth || 1, sh = window.innerHeight || 1;
      const px = (cur.current.x * 100) / sw, py = (cur.current.y * 100) / sh; // 0..100
      const nx = px / 50 - 1, ny = py / 50 - 1; // -1..1 for secondary layers

      if (wmRef.current) {
        const m = DEF.map((_, i) => cell(i, px, py));
        const tf = `translateX(-50%) matrix3d(${m.join(',')})`;
        wmRef.current.style.transform = tf;
        if (wmBackRef.current) wmBackRef.current.style.transform = tf;
      }
      const drift = ((Date.now() * 0.009) % 400) - 40; // independent slow cloud drift
      if (cloudsRef.current) cloudsRef.current.style.transform = `translate(${nx * -10 + drift}px, ${ny * -8}px)`;
      if (cityRef.current) cityRef.current.style.transform = `translate(${nx * -30}px, ${ny * -20}px)`;
      if (plantsRef.current) plantsRef.current.style.transform = `translate(${nx * -52}px, ${ny * -26}px)`;
      if (eyesRef.current) eyesRef.current.style.transform = `translateX(-50%) rotateY(${nx * 10}deg) rotateX(${-ny * 8}deg)`;

      const pd = 27;
      if (pupilL.current) pupilL.current.style.transform = `translate(${nx * 0.9 * pd}px, ${ny * 0.9 * pd}px)`;
      if (pupilR.current) pupilR.current.style.transform = `translate(${nx * 0.9 * pd}px, ${ny * 0.9 * pd}px)`;

      const bl = blink.current; bl.t += 30;
      let lid = 0;
      if (bl.t > bl.next) { const p = (bl.t - bl.next) / 150; lid = p < 1 ? Math.sin(p * Math.PI) : 0; if (p >= 1) { bl.t = 0; bl.next = 2600 + Math.random() * 3800; } }
      const ls = `scaleY(${lid.toFixed(3)})`;
      if (lidL.current) lidL.current.style.transform = ls;
      if (lidR.current) lidR.current.style.transform = ls;
    }, 30);
    return () => clearInterval(id);
  }, []);

  const onMove = (clientX: number, clientY: number) => {
    tgt.current.x = clientX; tgt.current.y = clientY;
  };

  useEffect(() => {
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const sw = window.innerWidth, sh = window.innerHeight;
      tgt.current.x = sw / 2 + Math.max(-1, Math.min(1, e.gamma / 30)) * (sw / 2);
      tgt.current.y = sh / 2 + Math.max(-1, Math.min(1, (e.beta - 45) / 30)) * (sh / 2);
    };
    window.addEventListener('deviceorientation', onTilt);
    return () => window.removeEventListener('deviceorientation', onTilt);
  }, []);

  const go = () => { const v = q.trim(); router.push(v ? `/results?query=${encodeURIComponent(v)}` : '/results'); };

  return (
    <div className="homy-hero" ref={rootRef}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onTouchMove={(e) => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); }}>
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />

      <div className="layer sky" />
      <div className="layer clouds" ref={cloudsRef} />

      {/* back copy: only the "y" is visible, sits behind the buildings (z below cityfront) */}
      <div className="wm wm-back" ref={wmBackRef} aria-hidden="true">Ho<span className="m">m</span><span className="y">y</span></div>
      {/* front copy: everything except the "y" (its "y" is transparent) */}
      <div className="wm" ref={wmRef}>Ho<span className="m">m</span><span className="y">y</span></div>

      <div className="layer cityfront" ref={cityRef} />
      <div className="layer plants" ref={plantsRef} />
      <div className="grad" />

      <div className="nav">
        <Link href="/" className="brand">Ho<span className="m">m</span>y</Link>
        <a href="/results">Купить</a>
        <a href="/results">Снять</a>
        <a href="/for-owners">Владельцам</a>
        <a href="/how-it-works">Как это работает</a>
        <span className="sp" />
        <a href={authed ? '/dashboard' : '/login'} className="cta">{authed ? 'Личный кабинет' : 'Войти'}</a>
      </div>

      <div className="eyes" ref={eyesRef}>
        <div className="eye"><div className="pupil" ref={pupilL} /><div className="lid" ref={lidL} /></div>
        <div className="eye"><div className="pupil" ref={pupilR} /><div className="lid" ref={lidR} /></div>
      </div>

      <form className="mouth" onSubmit={(e) => { e.preventDefault(); go(); }}>
        <span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Опишите, какой дом ищете…" />
        <button className="go" type="submit" aria-label="Искать"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      </form>
      <div className="sub">Homy разбирает каждый объект по фактам — честно о плюсах и рисках.</div>
      <div className="scrollhint"><div className="mo" />SCROLL</div>
    </div>
  );
}
