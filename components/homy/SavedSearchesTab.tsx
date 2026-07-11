'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';

/** 1:1 A10 «Сохранённые поиски» styles from Homy-Batch2 mockup. Scoped under .homy-ssearch. */
const SS_CSS = `
.homy-ssearch{--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;color:var(--ink);font-family:'Montserrat',sans-serif}
html.dark .homy-ssearch{--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F}
.homy-ssearch *{box-sizing:border-box}
.homy-ssearch .hd{display:flex;align-items:center;gap:12px;padding-bottom:18px;border-bottom:1px solid var(--hair);margin-bottom:20px}
.homy-ssearch .hd h2{font-size:20px;font-weight:800;letter-spacing:-.02em}
.homy-ssearch .hd .n{font-size:12px;color:var(--muted)}
.homy-ssearch .list{display:flex;flex-direction:column;gap:12px}
.homy-ssearch .srow{display:flex;align-items:center;gap:16px;background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:16px}
.homy-ssearch .srow .q{flex:1;min-width:0}
.homy-ssearch .srow .q b{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}
.homy-ssearch .srow .q .new{font-size:10px;font-weight:700;color:#fff;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em));border-radius:999px;padding:2px 7px}
.homy-ssearch .srow .q .cr{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.homy-ssearch .srow .q .cr .c{font-size:11px;color:var(--soft);background:var(--surface2);border:1px solid var(--hair);border-radius:6px;padding:3px 8px}
.homy-ssearch .srow .cnt{text-align:center;flex:none}
.homy-ssearch .srow .cnt b{font-size:20px;font-weight:700;color:var(--em)}
.homy-ssearch .srow .cnt span{display:block;font-size:10px;color:var(--muted)}
.homy-ssearch .ntog{text-align:center;flex:none}
.homy-ssearch .toggle{width:40px;height:22px;border-radius:999px;background:var(--em);position:relative;cursor:pointer;margin:0 auto}
.homy-ssearch .toggle::after{content:'';position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.18s}
.homy-ssearch .toggle.off{background:color-mix(in srgb,var(--muted) 30%,transparent)}
.homy-ssearch .toggle.off::after{right:auto;left:2px}
.homy-ssearch .ntog span{font-size:10px;color:var(--muted);display:block;margin-top:4px}
.homy-ssearch .open{position:relative;flex:none;background:none;border:0;color:var(--ink);font-weight:600;font-size:12.5px;padding:9px 4px;cursor:pointer;font-family:inherit;overflow:visible}
.homy-ssearch .open::after{content:'';position:absolute;left:3px;bottom:1px;width:0;height:2px;border-radius:2px;background:var(--em);transition:width .28s cubic-bezier(.22,1,.36,1)}
.homy-ssearch .open:hover{color:var(--em)}
.homy-ssearch .open:hover::after{width:calc(100% - 6px)}
.homy-ssearch .empty{text-align:center;padding:60px 20px}
.homy-ssearch .empty .ec{width:60px;height:60px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--em) 12%,transparent);color:var(--em)}
.homy-ssearch .empty h3{font-size:16px;font-weight:700}
.homy-ssearch .empty p{font-size:13px;color:var(--muted);margin-top:6px}
.homy-ssearch .empty .go{margin-top:16px;background:none;border:0;color:var(--em);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
.homy-ssearch .fspin{width:34px;height:34px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homysspin .9s linear infinite;margin:60px auto}
@keyframes homysspin{to{transform:rotate(360deg)}}
@media(max-width:640px){.homy-ssearch .srow{flex-wrap:wrap;gap:10px}.homy-ssearch .srow .q{flex:1 1 100%}}
`;

function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) { try { const o = JSON.parse(s); return o[lang] || o.ru || o.en || s; } catch { return v; } }
  return v;
}
function matchWord(n: number): string {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return 'совпадение';
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 'совпадения';
  return 'совпадений';
}

export default function SavedSearchesTab() {
  const { lang } = useT();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch('/api/users/me/saved-searches', { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setItems(d.searches || d.savedSearches || []); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const toggleNotify = useCallback(async (id: string, next: boolean) => {
    setItems((prev) => prev.map((s) => s.id === id ? { ...s, notify: next } : s));
    try {
      await fetch(`/api/users/me/saved-searches/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ notify: next }),
      });
    } catch { fetchList(); }
  }, [fetchList]);

  const openSearch = useCallback(async (s: any) => {
    // clear the "new" badge, then open the search
    if (s.newCount > 0) {
      setItems((prev) => prev.map((x) => x.id === s.id ? { ...x, newCount: 0 } : x));
      try {
        await fetch(`/api/users/me/saved-searches/${s.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ markSeen: true }),
        });
      } catch {}
    }
    router.push(`/results?query=${encodeURIComponent(loc(s.query, lang) || s.name || '')}`);
  }, [router, lang]);

  const notifOn = items.filter((s) => s.notify).length;

  return (
    <div className="homy-ssearch">
      <style dangerouslySetInnerHTML={{ __html: SS_CSS }} />

      <div className="hd">
        <h2>Сохранённые поиски</h2>
        <span className="n">{items.length} · {notifOn} с уведомлениями</span>
      </div>

      {loading ? (
        <div className="fspin" />
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="ec"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></div>
          <h3>Нет сохранённых поисков</h3>
          <p>Сохраняйте поиски, чтобы быстро к ним возвращаться и получать новые совпадения.</p>
          <button className="go" onClick={() => router.push('/')}>Начать поиск →</button>
        </div>
      ) : (
        <div className="list">
          {items.map((s) => {
            const count = Array.isArray(s.properties) ? s.properties.length : 0;
            const chips = (s.criteriaChips || []).map((c: any) => loc(c, lang)).filter(Boolean).slice(0, 5);
            const name = loc(s.name, lang) || loc(s.query, lang) || 'Ваш поиск';
            return (
              <div key={s.id} className="srow">
                <div className="q">
                  <b>{name}{s.newCount > 0 && <span className="new">{s.newCount} новых</span>}</b>
                  {chips.length > 0 && <div className="cr">{chips.map((c: string, i: number) => <span className="c" key={i}>{c}</span>)}</div>}
                </div>
                <div className="cnt"><b>{count}</b><span>{matchWord(count)}</span></div>
                <div className="ntog">
                  <div className={`toggle${s.notify ? '' : ' off'}`} title={s.notify ? 'Уведомления включены' : 'Уведомления выключены'} onClick={() => toggleNotify(s.id, !s.notify)} />
                  <span>уведомл.</span>
                </div>
                <button className="open" onClick={() => openSearch(s)}>Открыть</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
