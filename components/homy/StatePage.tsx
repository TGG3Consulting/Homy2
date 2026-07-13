'use client';

import React, { useState } from 'react';

/** 1:1 F5–F7 centered "state" pages (404 / error / coming-soon) from Homy-Batch7. */
const STATE_CSS = `
.homy-state{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}
html.dark .homy-state{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B}
.homy-state *{box-sizing:border-box}
.homy-state .cnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:14px;padding:12px 22px;background:color-mix(in srgb,var(--surface) 93%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-state .lg{font-weight:800;font-size:16px;letter-spacing:-.02em;color:var(--ink);text-decoration:none}
.homy-state .lg .m{color:var(--em)}
.homy-state .links{display:flex;gap:4px;margin-left:8px}
.homy-state .links a{font-size:12.5px;font-weight:600;color:var(--muted);padding:7px 10px;border-radius:9px;text-decoration:none;cursor:pointer}
.homy-state .links a:hover{color:var(--em)}
.homy-state .right{margin-left:auto;display:flex;align-items:center;gap:12px}
.homy-state .estate{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 26px}
.homy-state .big{width:84px;height:84px;border-radius:24px;display:flex;align-items:center;justify-content:center;margin-bottom:22px}
.homy-state .big.em{background:color-mix(in srgb,var(--em) 14%,transparent);color:var(--em)}
.homy-state .big.amber{background:color-mix(in srgb,var(--amber) 15%,transparent);color:var(--amber)}
.homy-state .code{font-size:56px;font-weight:800;letter-spacing:-.03em;color:var(--em);line-height:1}
.homy-state .estate h1{font-size:23px;font-weight:700;margin-top:16px}
.homy-state .estate p{font-size:13.5px;color:var(--muted);margin-top:10px;line-height:1.6;max-width:400px}
.homy-state .acts{display:flex;gap:18px;align-items:center;margin-top:24px;flex-wrap:wrap;justify-content:center}
.homy-state .emailrow{display:flex;gap:10px;margin-top:22px;max-width:400px;width:100%}
.homy-state .emailrow .inp{flex:1;display:flex;align-items:center;background:var(--surface2);border:1px solid var(--hair);border-radius:12px;padding:11px 13px}
.homy-state .emailrow .inp input{flex:1;background:none;border:0;outline:none;font-family:inherit;font-size:13.5px;color:var(--ink);min-width:0}
.homy-state .emailrow .inp:focus-within{border-color:var(--em)}
.homy-state .em3d{position:relative;overflow:hidden;color:#fff;border:0;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 8px rgba(4,40,28,.28),inset 0 1px 0 rgba(255,255,255,.2);font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px;cursor:pointer;font-family:inherit}
.homy-state .sec{position:relative;background:none;border:0;color:var(--soft);font-weight:700;font-size:14px;padding:11px 4px;cursor:pointer;font-family:inherit;overflow:visible}
.homy-state .sec::after{content:'';position:absolute;left:3px;bottom:1px;width:0;height:2px;border-radius:2px;background:var(--em);transition:width .28s cubic-bezier(.22,1,.36,1)}
.homy-state .sec:hover{color:var(--em)}.homy-state .sec:hover::after{width:calc(100% - 6px)}
/* mobile nav dropdown (вместо скролл-полосы ссылок) */
.homy-state .cmenu{display:none;position:relative}
.homy-state .cmenu-btn{display:inline-flex;align-items:center;gap:0;font-weight:800;font-size:16px;letter-spacing:-.02em;color:var(--ink);background:none;border:0;font-family:inherit;cursor:pointer;padding:2px}
.homy-state .cmenu-btn .m{color:var(--em)}
.homy-state .cmenu-btn svg{color:var(--muted);margin-left:6px}
.homy-state .cmenu-back{position:fixed;inset:0;z-index:40;display:none}
.homy-state .cmenu.open .cmenu-back{display:block}
.homy-state .cmenu-pop{position:absolute;top:calc(100% + 8px);left:0;z-index:50;min-width:210px;background:var(--surface);border:1px solid var(--hair);border-radius:14px;box-shadow:0 18px 46px rgba(0,0,0,.28);padding:8px;display:none}
html.dark .homy-state .cmenu-pop{box-shadow:0 18px 46px rgba(0,0,0,.55)}
.homy-state .cmenu.open .cmenu-pop{display:block}
.homy-state .cmenu-pop a{display:block;font-size:13.5px;font-weight:500;color:var(--ink);text-decoration:none;padding:10px 12px;border-radius:10px}
.homy-state .cmenu-pop a:hover{background:color-mix(in srgb,var(--muted) 14%,transparent)}
.homy-state .cmenu-pop a.acc{color:var(--em);font-weight:700}
.homy-state .cmenu-sep{height:1px;background:var(--hair);margin:6px 4px}
@media(max-width:640px){
  .homy-state .cnav{padding:11px 16px;gap:10px}
  .homy-state .cnav .lg,.homy-state .cnav .links,.homy-state .cnav .right{display:none}
  .homy-state .cmenu{display:inline-block}
  .homy-state .code{font-size:48px}
  .homy-state .estate{padding:32px 20px}
}
`;

interface Action { label: string; onClick: () => void; kind?: 'primary' | 'sec'; }

export default function StatePage({
  code, icon, iconTone = 'em', title, text, actions, children,
}: {
  code?: string;
  icon?: React.ReactNode;
  iconTone?: 'em' | 'amber';
  title: string;
  text: string;
  actions?: Action[];
  children?: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="homy-state">
      <style dangerouslySetInnerHTML={{ __html: STATE_CSS }} />
      <div className="cnav">
        <a href="/" className="lg">Ho<span className="m">m</span>y</a>
        <div className="links">
          <a href="/how-it-works">Как это работает</a>
          <a href="/for-buyers">Для кого</a>
          <a href="/about">О нас</a>
        </div>
        {/* mobile: навигация в выпадающем меню Homy */}
        <div className={`cmenu${navOpen ? ' open' : ''}`}>
          <button className="cmenu-btn" onClick={() => setNavOpen((o) => !o)} aria-haspopup="true" aria-expanded={navOpen}>
            Ho<span className="m">m</span>y
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div className="cmenu-back" onClick={() => setNavOpen(false)} />
          <div className="cmenu-pop">
            <a href="/how-it-works">Как это работает</a>
            <a href="/for-buyers">Для кого</a>
            <a href="/about">О нас</a>
            <div className="cmenu-sep" />
            <a href="/login" className="acc">Войти</a>
            <a href="/">Главная</a>
          </div>
        </div>
        <div className="right"><a href="/login" className="em3d" style={{ textDecoration: 'none', padding: '8px 16px' }}>Войти</a></div>
      </div>
      <div className="estate">
        {code ? <div className="code">{code}</div> : icon ? <div className={`big ${iconTone}`}>{icon}</div> : null}
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
        {actions && actions.length > 0 && (
          <div className="acts">
            {actions.map((a, i) => (
              <button key={i} className={a.kind === 'sec' ? 'sec' : 'em3d'} onClick={a.onClick}>{a.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
