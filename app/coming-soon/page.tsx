'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CS_CSS = `
.homy-cs{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
html.dark .homy-cs{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F}
.homy-cs *{box-sizing:border-box}
.homy-cs .cnav{position:sticky;top:0;display:flex;align-items:center;gap:14px;padding:12px 22px;background:color-mix(in srgb,var(--surface) 93%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-cs .lg{font-weight:800;font-size:16px;color:var(--ink);text-decoration:none}.homy-cs .lg .m{color:var(--em)}
.homy-cs .estate{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 26px}
.homy-cs .big{width:84px;height:84px;border-radius:24px;display:flex;align-items:center;justify-content:center;margin-bottom:22px;background:color-mix(in srgb,var(--em) 14%,transparent);color:var(--em)}
.homy-cs h1{font-size:28px;font-weight:800;letter-spacing:-.02em}
.homy-cs p{font-size:13.5px;color:var(--muted);margin-top:10px;line-height:1.6;max-width:420px}
.homy-cs .emailrow{display:flex;gap:10px;margin-top:22px;max-width:420px;width:100%}
.homy-cs .inp{flex:1;display:flex;align-items:center;background:var(--surface2);border:1px solid var(--hair);border-radius:12px;padding:12px 14px}
.homy-cs .inp input{flex:1;background:none;border:0;outline:none;font-family:inherit;font-size:13.5px;color:var(--ink);min-width:0}
.homy-cs .inp:focus-within{border-color:var(--em)}
.homy-cs .em3d{color:#fff;border:0;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 8px rgba(4,40,28,.24);font-weight:700;font-size:13.5px;padding:12px 20px;border-radius:12px;cursor:pointer;font-family:inherit;white-space:nowrap}
.homy-cs .em3d:disabled{opacity:.55;pointer-events:none}
.homy-cs .ok{margin-top:20px;font-size:13.5px;font-weight:600;color:var(--em)}
.homy-cs .sec{margin-top:22px;background:none;border:0;color:var(--soft);font-weight:700;font-size:13.5px;cursor:pointer;font-family:inherit}
.homy-cs .sec:hover{color:var(--em)}
@media(max-width:520px){.homy-cs .emailrow{flex-direction:column}}
`;

export default function ComingSoonPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const v = email.trim();
    if (!/.+@.+\..+/.test(v)) return;
    setBusy(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v }),
      }).catch(() => {});
      setSent(true);
    } finally { setBusy(false); }
  };

  return (
    <div className="homy-cs">
      <style dangerouslySetInnerHTML={{ __html: CS_CSS }} />
      <div className="cnav"><Link href="/" className="lg">Ho<span className="m">m</span>y</Link></div>
      <div className="estate">
        <div className="big"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></svg></div>
        <h1>Скоро запуск</h1>
        <p>Мы готовим ИИ-разбор новостроек Еревана. Оставьте email — сообщим первым, когда откроем.</p>
        {sent ? (
          <div className="ok">Спасибо! Сообщим на {email}, когда откроем.</div>
        ) : (
          <div className="emailrow">
            <div className="inp"><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} /></div>
            <button className="em3d" disabled={busy} onClick={submit}>{busy ? 'Отправляем…' : 'Уведомить меня'}</button>
          </div>
        )}
        <button className="sec" onClick={() => router.push('/')}>На главную</button>
      </div>
    </div>
  );
}
