'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** 1:1 F2–F4 content-page shell + styles from Homy-Batch7. Scoped under .homy-content. */
export const CONTENT_CSS = `
.homy-content{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
html.dark .homy-content{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B}
.homy-content *{box-sizing:border-box}
.homy-content .cnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:14px;padding:12px 22px;background:color-mix(in srgb,var(--surface) 93%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-content .lg{font-weight:800;font-size:16px;letter-spacing:-.02em;color:var(--ink);text-decoration:none}.homy-content .lg .m{color:var(--em)}
.homy-content .cbk{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--em);background:none;border:0;font-family:inherit;cursor:pointer;padding:0}
.homy-content .links{display:flex;gap:4px;margin-left:6px}
.homy-content .links a{font-size:12.5px;font-weight:600;color:var(--muted);padding:7px 10px;border-radius:9px;text-decoration:none;cursor:pointer}
.homy-content .links a:hover,.homy-content .links a.on{color:var(--em)}
.homy-content .links a.on{box-shadow:inset 0 -2.5px 0 0 var(--em);border-radius:0;font-weight:700}
.homy-content .right{margin-left:auto;display:flex;align-items:center;gap:12px}
.homy-content .em3d{position:relative;overflow:hidden;color:#fff;border:0;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 8px rgba(4,40,28,.24),inset 0 1px 0 rgba(255,255,255,.2);font-weight:700;font-size:13px;padding:11px 20px;border-radius:12px;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-block}
.homy-content .cwrap{padding:30px 26px 46px;max-width:900px;margin:0 auto}
.homy-content .chero{text-align:center;padding:14px 0 6px}
.homy-content .chero .kick{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--em);margin-bottom:12px}
.homy-content .chero h1{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.12}
.homy-content .chero p{font-size:14px;color:var(--soft);margin-top:12px;line-height:1.6;max-width:560px;margin-left:auto;margin-right:auto}
.homy-content .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:30px}
@media(max-width:820px){.homy-content .steps{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.homy-content .steps{grid-template-columns:1fr}}
.homy-content .step{background:var(--surface);border:1px solid var(--hair);border-radius:16px;padding:20px 18px;text-align:left}
.homy-content .step .n{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em));margin-bottom:14px}
.homy-content .step h3{font-size:15px;font-weight:700}.homy-content .step p{font-size:12.5px;color:var(--muted);margin-top:7px;line-height:1.55}
.homy-content .feats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}
@media(max-width:720px){.homy-content .feats{grid-template-columns:1fr}}
.homy-content .feat{background:var(--surface);border:1px solid var(--hair);border-radius:16px;padding:20px}
.homy-content .feat .ic{width:42px;height:42px;border-radius:12px;background:color-mix(in srgb,var(--em) 14%,transparent);color:var(--em);display:flex;align-items:center;justify-content:center;margin-bottom:13px}
.homy-content .feat h3{font-size:14.5px;font-weight:700}.homy-content .feat p{font-size:12.5px;color:var(--muted);margin-top:7px;line-height:1.55}
.homy-content .aud{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:26px}
@media(max-width:720px){.homy-content .aud{grid-template-columns:1fr}}
.homy-content .audc{background:var(--surface);border:1px solid var(--hair);border-radius:18px;padding:24px}
.homy-content .audc .ph{height:150px;border-radius:12px;background-size:cover;background-position:center;margin-bottom:16px;background-color:var(--surface2)}
.homy-content .audc h3{font-size:18px;font-weight:700}
.homy-content .audc ul{list-style:none;margin-top:12px;display:flex;flex-direction:column;gap:9px;padding:0}
.homy-content .audc li{font-size:12.5px;color:var(--soft);display:flex;gap:9px;align-items:flex-start}.homy-content .audc li svg{color:var(--em);flex:none;margin-top:1px}
.homy-content .statrow{display:flex;gap:14px;margin-top:26px;flex-wrap:wrap}
.homy-content .statrow .s{flex:1;min-width:120px;background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:18px;text-align:center}
.homy-content .statrow .s b{font-size:26px;font-weight:800;letter-spacing:-.02em;display:block}.homy-content .statrow .s span{font-size:11.5px;color:var(--muted)}
.homy-content .team{display:flex;gap:20px;margin-top:20px;flex-wrap:wrap;justify-content:center}
.homy-content .tm{text-align:center}.homy-content .tm .av{width:72px;height:72px;border-radius:50%;background-size:cover;background-position:center;margin:0 auto 10px;background-color:var(--surface2)}
.homy-content .tm b{font-size:13px;font-weight:600;display:block}.homy-content .tm span{font-size:11.5px;color:var(--muted)}
.homy-content .center{text-align:center;margin-top:26px}
`;

export default function ContentPage({ active, children }: { active?: 'how' | 'who' | 'about'; children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/users/me', { credentials: 'include' }).then((r) => { if (alive) setAuthed(r.ok); }).catch(() => { if (alive) setAuthed(false); });
    return () => { alive = false; };
  }, []);
  return (
    <div className="homy-content">
      <style dangerouslySetInnerHTML={{ __html: CONTENT_CSS }} />
      <div className="cnav">
        <a href="/" className="lg">Ho<span className="m">m</span>y</a>
        <button className="cbk" onClick={() => router.back()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>Назад
        </button>
        <div className="links">
          <a href="/how-it-works" className={active === 'how' ? 'on' : ''}>Как это работает</a>
          <a href="/for-buyers" className={active === 'who' ? 'on' : ''}>Для кого</a>
          <a href="/about" className={active === 'about' ? 'on' : ''}>О нас</a>
        </div>
        <div className="right">
          <a href={authed ? '/dashboard' : '/login'} className="em3d">{authed ? 'Личный кабинет' : 'Войти'}</a>
        </div>
      </div>
      <div className="cwrap">{children}</div>
    </div>
  );
}
