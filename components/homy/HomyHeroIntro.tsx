'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * "Homy face" hero — INTRO variant (/hero-intro).
 * Same as HomyHero, plus an opening animation: the "y" (a house roof) starts
 * upside-down above the "m" (the house base), then jumps, flips and lands into
 * place → forming "Homy". Everything else is identical to the base hero.
 */
const HERO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800;900&display=swap');
@font-face{font-family:'The Naturel Std';src:url('/fonts/the-naturel-std.ttf') format('truetype');font-weight:normal;font-style:normal;font-display:block}
.homy-hero{position:relative;width:100%;height:100vh;min-height:640px;overflow:hidden;background:#2f7fc4;font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased;perspective:1300px}
.homy-hero *{box-sizing:border-box}
.homy-hero .layer{position:absolute;inset:-10% -10% -10% -10%;background-position:center;will-change:transform}
.homy-hero .sky{background:radial-gradient(130% 105% at 50% 2%, #cfe9f8 0%, #7cbcec 30%, #3f95df 60%, #1f6cc0 100%);z-index:0}
.homy-hero .clouds{background-image:url('/hero-clouds.png');background-size:cover;background-repeat:repeat;z-index:1;opacity:.96}
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

.homy-hero .wm{position:absolute;left:50%;top:24%;transform:translateX(-50%);z-index:5;font-family:'The Naturel Std','M PLUS Rounded 1c',sans-serif;font-weight:normal;letter-spacing:.01em;line-height:.9;white-space:nowrap;font-size:clamp(80px,16vw,250px);color:#fff;user-select:none;will-change:transform;filter:drop-shadow(0 6px 16px rgba(20,28,45,.22))}
/* до готовности (шрифт + картинки) видно только ровный фон; затем вся сцена проявляется разом */
.homy-hero>*{opacity:0;transition:opacity .45s ease-out}
.homy-hero.ready>*{opacity:1}
.homy-hero .wm .m{color:#2BC091;display:inline-block;transform-origin:50% 100%;vertical-align:baseline;will-change:transform}
/* intro (JS-driven @60fps, одна непрерывная кривая — без «шагов»): "y" = крыша над "m" → плавно ПО ЧАСОВОЙ съезжает на место */
/* стартовое положение "y" = крыша (совпадает с 0-м кадром JS-интро) — чтобы до старта JS не мелькало собранное "Homy" */
.homy-hero .wm .y{display:inline-block;transform-origin:50% 58%;will-change:transform;transform:translate(-0.83em,-0.95em) rotate(180deg) scaleX(1.38) scaleY(1.16)}
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
@media(max-width:640px){.homy-hero .nav a{display:none}.homy-hero .nav .cta{display:inline-block}.homy-hero .wm{font-size:clamp(52px,15vw,96px)}.homy-hero .eyes{gap:clamp(34px,9vw,64px)}}
`;

// Cursor-follow matrix params (MoneyCat "Vl" handler, front layer): each of the 16
// matrix3d cells eases between MMIN (pointer at 0%), DEF (center 50%) and MMAX (100%)
// along the axis in COORD. Carries both rotation and a ~76px translate → the wordmark
// visibly "leans" toward the cursor.
const COORD: (string | null)[] = ['x', null, 'x', null, 'y', 'y', 'y', null, 'x', 'y', 'x', null, 'x', 'y', null, null];
const DEF = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const MMAX = [0.975, 0, -0.221, 0, -0.018, 0.996, -0.08, 0, 0.221, 0.08, 0.974, 0, 76.72, 28.08, 0, 1];
const MMIN = [0.975, 0, 0.221, 0, 0.018, 0.996, 0.08, 0, -0.221, -0.08, 0.974, 0, -76.72, -28.08, 0, 1];

export default function HomyHeroIntro() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false); // reveal wordmark + start intro only once the font is loaded (no FOUT)
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
  const yF = useRef<HTMLSpanElement>(null); // front "y" (roof)
  const yB = useRef<HTMLSpanElement>(null); // back "y" (visible, behind buildings)
  const mF = useRef<HTMLSpanElement>(null); // front "m" (kicks the y)
  const introActive = useRef(true);         // gate cursor-follow off the pupils during intro

  const cur = useRef({ x: 0, y: 0 }); // smoothed pointer (px)
  const tgt = useRef({ x: 0, y: 0 }); // raw pointer target (px)
  const blink = useRef({ next: 2600, t: 0 });

  useEffect(() => {
    let alive = true;
    fetch('/api/users/me', { credentials: 'include' }).then((r) => { if (alive) setAuthed(r.ok); }).catch(() => { if (alive) setAuthed(false); });
    return () => { alive = false; };
  }, []);

  // Reveal the wordmark and start the intro only once the custom font has loaded,
  // so the letters never flash in a fallback font/size (FOUT). Fallback timeout so it never hangs.
  useEffect(() => {
    let done = false;
    const go = () => { if (!done) { done = true; setReady(true); } };
    const fonts = (document as unknown as { fonts?: { load?: (f: string) => Promise<unknown> } }).fonts;
    const loadImg = (src: string) => new Promise<void>((res) => { const im = new Image(); im.onload = im.onerror = () => res(); im.src = src; });
    // load OUR font + the hero background images, THEN reveal the whole scene at once
    const fontP = fonts && fonts.load ? fonts.load('80px "The Naturel Std"') : Promise.resolve();
    Promise.all([fontP, loadImg('/hero-clouds.png'), loadImg('/hero-city.png'), loadImg('/hero-plants.png')]).then(go, go);
    const t = setTimeout(go, 2000);  // safety cap so it never hangs
    return () => clearTimeout(t);
  }, []);

  // INTRO — full character choreography, one 60fps controller.
  // Beats: (1) "y" holds as a roof on "m"; the "m" winds up (anticipation, squash);
  //        (2) the "m" KICKS (stretch + snap) and punts the "y";
  //        (3) the "y" flies off as a BOOMERANG — spins 1.5× clockwise on an arc —
  //            and SLAMS into place with a squash-bounce (Yeralash-style);
  //        (4) the "m" springs back to rest (elastic overshoot — alive, not mechanical);
  //        (5) the eyes look UP during the wind-up, then track the flying "y", then release.
  useEffect(() => {
    if (!ready) return;                            // wait for the font so the roof shows in the right font
    const ys = [yF.current, yB.current].filter(Boolean) as HTMLElement[];
    const m = mF.current, pl = pupilL.current, pr = pupilR.current;
    if (!ys.length) { introActive.current = false; return; }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ys.forEach((el) => { el.style.transform = 'none'; });
      introActive.current = false;
      return;
    }
    const c01 = (x: number) => Math.min(1, Math.max(0, x));
    const smoother = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
    const outCubic = (u: number) => 1 - Math.pow(1 - u, 3);
    const inOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
    const outBack = (u: number, s = 1.5) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
    const outElastic = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * (2 * Math.PI / 3)) + 1);

    const ENTER = 0.45, HOLDAFTER = 0.35, WIND = 0.22, KICK = 0.14;   // s
    const kickT = ENTER + HOLDAFTER;               // launch moment (~0.8s — snappier start)
    const windStart = kickT - WIND;                // m anticipation begins
    const FLIGHT = 2.42;                           // boomerang flight (+20% speed after the kick)
    const flightEnd = kickT + FLIGHT;
    const mSettle = 0.9;                           // m spring-back
    const END = flightEnd + 0.3;                   // release
    const pd = 27;

    let raf = 0, start = 0;
    const frame = (ts: number) => {
      if (!start) start = ts;
      const t = (ts - start) / 1000;

      // ---- M: anticipation → kick → elastic settle (pivots at its feet) ----
      let mrot = 0, msx = 1, msy = 1;
      if (t >= windStart && t < kickT) {
        const p = inOut(c01((t - windStart) / WIND));       // wind up: squat + lean back
        msy = 1 - 0.16 * p; msx = 1 + 0.08 * p; mrot = -2 * p;
      } else if (t >= kickT && t < kickT + KICK) {
        const q = outCubic(c01((t - kickT) / KICK));        // KICK: stretch + snap right
        msy = 0.84 + 0.34 * q; msx = 1.08 - 0.16 * q; mrot = -2 + 8 * q;
      } else if (t >= kickT + KICK && t < kickT + KICK + mSettle) {
        const el = outElastic(c01((t - (kickT + KICK)) / mSettle));  // springy return
        msy = 1.18 - 0.18 * el; msx = 0.92 + 0.08 * el; mrot = 6 - 6 * el;
      }
      if (m) m.style.transform = (t >= kickT + KICK + mSettle)
        ? 'none' : `rotate(${mrot.toFixed(2)}deg) scale(${msx.toFixed(3)},${msy.toFixed(3)})`;

      // ---- Y: roof → boomerang spin → slam ----
      let ytf: string;
      if (t < ENTER) {
        const e = outCubic(c01(t / ENTER));                 // graceful entrance: roof glides down into place
        const ty = -0.95 + (-0.63 - -0.95) * e;
        ytf = `translate(-0.83em, ${ty.toFixed(4)}em) rotate(180deg) scaleX(1.38) scaleY(1.16)`;
      } else if (t < kickT) {
        ytf = 'translate(-0.83em, -0.63em) rotate(180deg) scaleX(1.38) scaleY(1.16)';
      } else {
        let uf = c01((t - kickT) / FLIGHT);
        if (uf > 0.55) uf = Math.min(1, 0.55 + (uf - 0.55) * 1.2); // +20% only on the ending — earlier stays untouched
        const rot = 180 + 540 * outCubic(uf);               // 1.5 CW turns → upright (720°)
        const tx = -0.83 + 0.83 * outBack(uf, 0.6);         // gentle slam, settles at the very end
        const base = outCubic(uf);                          // fast right after the kick, decays to the end (like a throw)
        const arc = -0.6 * Math.pow(Math.sin(Math.PI * Math.pow(uf, 0.8)), 1.6); // thrown up fast, eases down
        const ty = -0.63 * (1 - base) + arc;
        let sx = 1.38 - 0.38 * base, sy = 1.16 - 0.16 * base;
        const ul = c01((uf - 0.82) / 0.18);                 // impact squash tied to landing progress
        if (ul > 0) { const b = Math.sin(Math.PI * ul) * (1 - ul); sx += 0.22 * b; sy -= 0.2 * b; }
        ytf = `translate(${tx.toFixed(4)}em, ${ty.toFixed(4)}em) rotate(${rot.toFixed(2)}deg) scaleX(${sx.toFixed(4)}) scaleY(${sy.toFixed(4)})`;
      }
      for (const el of ys) el.style.transform = ytf;

      // ---- Pupils (lower eyes): look UP during wind-up, then track the flying "y" ----
      if (pl && pr) {
        let px = 0, py = 0;
        if (t < kickT) {
          const p = inOut(c01(t / kickT));
          px = -0.15 * pd * p; py = -0.8 * pd * p;           // glance up at the roof
        } else {
          const uf = c01((t - kickT) / FLIGHT);
          px = -0.15 * pd + 1.1 * pd * outCubic(uf);         // sweep left→right after the y
          py = -0.8 * pd * (1 - outCubic(uf)) - 0.25 * pd * Math.sin(Math.PI * uf);
          if (t > flightEnd) { const rel = inOut(c01((t - flightEnd) / 0.3)); px *= (1 - rel); py *= (1 - rel); }
        }
        const ptf = `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;
        pl.style.transform = ptf; pr.style.transform = ptf;
      }

      if (t < END) raf = requestAnimationFrame(frame);
      else {
        for (const el of ys) el.style.transform = 'none';
        if (m) m.style.transform = 'none';
        introActive.current = false;                          // hand pupils back to cursor-follow
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // MoneyCat "Vl" cursor-follow, reproduced exactly:
  //  - smooth currentX/Y toward the raw pointer px by /stepCoef(10) every 30ms,
  //    snapping to rest below minDelta(5) — a slow ~300ms trail, no spring/overshoot.
  //  - build the wordmark's matrix3d by easing each of 16 cells between
  //    MMIN(0%) → DEF(center) → MMAX(100%) along the mouse-% axis in COORD.
  //    This carries both the 3D turn AND a translate, so it clearly leans to the cursor.
  useEffect(() => {
    cur.current.x = tgt.current.x = window.innerWidth / 2;
    cur.current.y = tgt.current.y = window.innerHeight / 2;
    const driftT0 = Date.now();

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
      // clouds: parallax via transform (small, within the layer's overscan), continuous drift via
      // background-position on a REPEAT tile → clouds never "end", scroll seamlessly forever
      if (cloudsRef.current) {
        cloudsRef.current.style.transform = `translate(${nx * -10}px, ${ny * -8}px)`;
        cloudsRef.current.style.backgroundPositionX = `${((Date.now() - driftT0) * 0.02).toFixed(1)}px`;
      }
      if (cityRef.current) cityRef.current.style.transform = `translate(${nx * -30}px, ${ny * -20}px)`;
      if (plantsRef.current) plantsRef.current.style.transform = `translate(${nx * -52}px, ${ny * -26}px)`;
      if (eyesRef.current) eyesRef.current.style.transform = `translateX(-50%) rotateY(${nx * 10}deg) rotateX(${-ny * 8}deg)`;

      const pd = 27;
      if (!introActive.current) {
        if (pupilL.current) pupilL.current.style.transform = `translate(${nx * 0.9 * pd}px, ${ny * 0.9 * pd}px)`;
        if (pupilR.current) pupilR.current.style.transform = `translate(${nx * 0.9 * pd}px, ${ny * 0.9 * pd}px)`;
      }

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
    <div className={`homy-hero${ready ? ' ready' : ''}`} ref={rootRef}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onTouchMove={(e) => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); }}>
      <link rel="preload" href="/fonts/the-naturel-std.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />

      <div className="layer sky" />
      <div className="layer clouds" ref={cloudsRef} />

      {/* back copy: only the "y" is visible, sits behind the buildings (z below cityfront) */}
      <div className="wm wm-back" ref={wmBackRef} aria-hidden="true">Ho<span className="m">m</span><span className="y" ref={yB}>y</span></div>
      {/* front copy: everything except the "y" (its "y" is transparent) */}
      <div className="wm" ref={wmRef}>Ho<span className="m" ref={mF}>m</span><span className="y" ref={yF}>y</span></div>

      <div className="layer cityfront" ref={cityRef} />
      <div className="layer plants" ref={plantsRef} />
      <div className="grad" />

      <div className="nav">
        <a href="/" className="brand">Ho<span className="m">m</span>y</a>
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
