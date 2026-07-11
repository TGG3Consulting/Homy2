'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const N_CSS = `
.homy-notif{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;--danger:#D8434B;
  min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Montserrat',sans-serif;-webkit-font-smoothing:antialiased}
html.dark .homy-notif{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B;--danger:#F0616A}
.homy-notif *{box-sizing:border-box}
.homy-notif .cnav{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:14px;padding:12px 22px;background:color-mix(in srgb,var(--surface) 93%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.homy-notif .lg{font-weight:800;font-size:16px;color:var(--ink);text-decoration:none}.homy-notif .lg .m{color:var(--em)}
.homy-notif .bk{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--em);background:none;border:0;cursor:pointer;font-family:inherit}
.homy-notif .readall{margin-left:auto;background:none;border:0;color:var(--em);font-weight:600;font-size:12.5px;cursor:pointer;font-family:inherit}
.homy-notif .wrap{max-width:720px;margin:0 auto;padding:24px 20px 60px}
.homy-notif h1{font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:16px}
.homy-notif .nrow{display:flex;gap:13px;align-items:flex-start;background:var(--surface);border:1px solid var(--hair);border-radius:13px;padding:14px;margin-bottom:10px;cursor:pointer;transition:.15s}
.homy-notif .nrow:hover{border-color:color-mix(in srgb,var(--em) 40%,transparent)}
.homy-notif .nrow.unread{background:color-mix(in srgb,var(--em) 5%,var(--surface))}
.homy-notif .nrow .ic{width:38px;height:38px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--em) 13%,transparent);color:var(--em)}
.homy-notif .nrow .ic.amber{background:color-mix(in srgb,var(--amber) 15%,transparent);color:var(--amber)}
.homy-notif .nrow .ic.danger{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.homy-notif .nrow .b{flex:1;min-width:0}
.homy-notif .nrow .t{font-size:13.5px;font-weight:700}
.homy-notif .nrow .bd{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.5}
.homy-notif .nrow .tm{font-size:11px;color:var(--muted);margin-top:5px}
.homy-notif .nrow .dot{width:8px;height:8px;border-radius:50%;background:var(--em);flex:none;margin-top:6px}
.homy-notif .empty{text-align:center;padding:70px 20px}
.homy-notif .empty .ec{width:60px;height:60px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--em) 12%,transparent);color:var(--em)}
.homy-notif .empty h3{font-size:16px;font-weight:700}.homy-notif .empty p{font-size:13px;color:var(--muted);margin-top:6px}
.homy-notif .fspin{width:34px;height:34px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homynspin .9s linear infinite;margin:60px auto}
@keyframes homynspin{to{transform:rotate(360deg)}}
`;

function iconFor(type: string): { tone: string; svg: React.ReactNode } {
  const s = (p: React.ReactNode) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
  if (type === 'saved_search_match') return { tone: '', svg: s(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>) };
  if (type?.startsWith('viewing')) return { tone: '', svg: s(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>) };
  if (type === 'listing_approved') return { tone: '', svg: s(<path d="M20 6 9 17l-5-5" />) };
  if (type === 'listing_rejected') return { tone: 'danger', svg: s(<><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></>) };
  if (type === 'message') return { tone: '', svg: s(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />) };
  return { tone: '', svg: s(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>) };
}

// Some older notifications embed a raw i18n-JSON title in the body — show the ru value.
function cleanText(s: string): string {
  return String(s || '')
    .replace(/\{"en":"[^"]*","ru":"([^"]*)","hy":"[^"]*"\}/g, '$1')
    .replace(/""/g, '"');
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.floor(h / 24);
  return `${days} дн назад`;
}

function targetFor(n: any): string | null {
  const d = n.data || {};
  if (d.propertyId) return `/properties/${d.propertyId}`;
  if (d.viewingId) return '/dashboard?tab=viewings';
  if (d.savedSearchId) return '/dashboard?tab=searches';
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications', { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setItems(d.notifications || []); }
      else if (r.status === 401) { router.push('/login?redirect=/notifications'); return; }
    } catch {} finally { setLoading(false); }
  }, [router]);
  useEffect(() => { load(); }, [load]);

  const open = async (n: any) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      fetch(`/api/notifications/${n.id}/read`, { method: 'POST', credentials: 'include' }).catch(() => {});
    }
    const t = targetFor(n);
    if (t) router.push(t);
  };

  const readAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="homy-notif">
      <style dangerouslySetInnerHTML={{ __html: N_CSS }} />
      <div className="cnav">
        <a href="/" className="lg">Ho<span className="m">m</span>y</a>
        <button className="bk" onClick={() => router.back()}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>Назад</button>
        {unread > 0 && <button className="readall" onClick={readAll}>Прочитать всё</button>}
      </div>
      <div className="wrap">
        <h1>Уведомления{unread > 0 ? ` · ${unread} новых` : ''}</h1>
        {loading ? <div className="fspin" /> : items.length === 0 ? (
          <div className="empty">
            <div className="ec"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg></div>
            <h3>Пока нет уведомлений</h3>
            <p>Здесь появятся новые совпадения, просмотры и статусы объявлений.</p>
          </div>
        ) : (
          items.map((n) => {
            const ic = iconFor(n.type);
            return (
              <div key={n.id} className={`nrow${n.read ? '' : ' unread'}`} onClick={() => open(n)}>
                <div className={`ic ${ic.tone}`}>{ic.svg}</div>
                <div className="b">
                  <div className="t">{cleanText(n.title)}</div>
                  <div className="bd">{cleanText(n.body)}</div>
                  <div className="tm">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <div className="dot" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
