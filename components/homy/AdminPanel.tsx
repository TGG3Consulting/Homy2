'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/components/homy/ThemeProvider';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import { BROKER_CSS } from '@/components/homy/brokerStyles';

const ADMIN_EXTRA = `
.homy-broker .role{font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:999px;color:var(--soft);background:color-mix(in srgb,var(--muted) 16%,transparent);white-space:nowrap}
.homy-broker .role.broker{color:var(--em);background:color-mix(in srgb,var(--em) 14%,transparent)}
.homy-broker .role.admin{color:var(--amber);background:color-mix(in srgb,var(--amber) 15%,transparent)}
.homy-broker .ust{font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.homy-broker .ust.active{color:var(--em)}.homy-broker .ust.blocked{color:var(--danger)}
.homy-broker .ust::before{content:'●';font-size:9px}
.homy-broker .utable{width:100%;border:1px solid var(--hair);border-radius:14px;overflow:hidden;background:var(--surface)}
.homy-broker .urow{display:flex;align-items:center;gap:13px;padding:13px 16px;border-bottom:1px solid var(--hair)}
.homy-broker .urow:last-child{border-bottom:0}
.homy-broker .urow .av{width:36px;height:36px;border-radius:50%;flex:none;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px}
.homy-broker .urow .ui{flex:1;min-width:0}
.homy-broker .urow .nm{font-size:13px;font-weight:600}.homy-broker .urow .em{font-size:11.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.homy-broker .mod{display:flex;gap:14px;padding:14px;border:1px solid var(--hair);border-radius:14px;background:var(--surface);margin-bottom:11px;align-items:center}
.homy-broker .mod .ph{width:120px;height:90px;border-radius:11px;background-size:cover;background-position:center;flex:none;background-color:var(--surface2)}
.homy-broker .mod .mi{flex:1;min-width:0}
.homy-broker .mod .mi b{font-size:14px;font-weight:700}
.homy-broker .mod .mi .mt{font-size:11.5px;color:var(--muted);margin-top:4px}
.homy-broker .flags{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap}
.homy-broker .flag{font-size:10.5px;font-weight:600;display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:7px}
.homy-broker .flag.ok{color:var(--em);background:color-mix(in srgb,var(--em) 13%,transparent)}
.homy-broker .flag.warn{color:var(--amber);background:color-mix(in srgb,var(--amber) 15%,transparent)}
.homy-broker .macts{display:flex;flex-direction:column;gap:9px;justify-content:center;flex:none}
.homy-broker .btn-danger{background:none;border:1px solid color-mix(in srgb,var(--danger) 40%,transparent);color:var(--danger);font-weight:700;font-size:12px;padding:8px 14px;border-radius:10px;cursor:pointer;font-family:inherit}
.homy-broker .btn-danger:hover{background:color-mix(in srgb,var(--danger) 10%,transparent)}
@media(max-width:640px){
  .homy-broker .mod{flex-wrap:wrap}.homy-broker .mod .ph{width:100%;height:130px}.homy-broker .macts{flex-direction:row;flex:1 1 100%}
  /* каждый пользователь — отдельная карточка (без общего контейнера с разделителями) */
  .homy-broker .utable{border:0;border-radius:0;overflow:visible;background:none;display:flex;flex-direction:column;gap:10px}
  .homy-broker .urow{flex-wrap:wrap;gap:8px 10px;padding:14px;border:1px solid var(--hair);border-radius:14px;background:var(--surface);margin:0}
  .homy-broker .urow:last-child{border:1px solid var(--hair)}
  .homy-broker .urow .ui{flex:1 1 auto;min-width:130px}
  .homy-broker .urow .role{order:3}
  .homy-broker .urow .ust{order:4;width:auto!important;flex:1 1 100%}
  .homy-broker .urow .lact{order:5;flex:1 1 100%;justify-content:flex-start;gap:16px;margin-top:2px}
}
`;

const initials = (s: string) => (s || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const nfmt = (n: any) => (n != null ? Number(n).toLocaleString('ru-RU').replace(/,/g, ' ') : '—');

const TABS = [
  { id: 'overview', label: 'Обзор' },
  { id: 'moderation', label: 'Модерация' },
  { id: 'users', label: 'Пользователи' },
];

function roleInfo(u: any): { label: string; cls: string } {
  if (u.role === 'admin') return { label: 'Админ', cls: 'admin' };
  if (u.role === 'moderator') return { label: 'Модератор', cls: 'admin' };
  if (u.user_type === 'agent' || u.user_type === 'owner') return { label: 'Брокер', cls: 'broker' };
  if (u.user_type === 'renter') return { label: 'Арендатор', cls: '' };
  if (u.user_type === 'buyer') return { label: 'Покупатель', cls: '' };
  return { label: 'Пользователь', cls: '' };
}

export default function AdminPanel({ user }: { user: any }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const curTab = TABS.find((t) => t.id === tab) || TABS[0];
  const goTab = useCallback((id: string) => router.push(id === 'overview' ? '/dashboard' : `/dashboard?tab=${id}`, { scroll: false }), [router]);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const showToast = useCallback((ok: boolean, text: string) => { setToast({ ok, text }); window.setTimeout(() => setToast(null), 3000); }, []);

  return (
    <div className="homy-broker">
      <style dangerouslySetInnerHTML={{ __html: BROKER_CSS + ADMIN_EXTRA }} />
      <div className="bnav">
        <HomyLogoMenu align="left" />
        <div className="btabs">{TABS.map((t) => <button key={t.id} className={`btab${tab === t.id ? ' on' : ''}`} onClick={() => goTab(t.id)}>{t.label}</button>)}</div>
        <span className="bcur">· {curTab.label}</span>
        <div className="right">
          <div className="themebtn">
            <button className={`o${theme === 'light' ? ' on' : ''}`} title="Светлая" onClick={() => setTheme('light')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5" /></svg></button>
            <button className={`o${theme === 'dark' ? ' on' : ''}`} title="Тёмная" onClick={() => setTheme('dark')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg></button>
          </div>
        </div>
      </div>

      <div className="bwrap">
        {tab === 'overview' && <OverviewView goTab={goTab} router={router} />}
        {tab === 'moderation' && <ModerationView showToast={showToast} />}
        {tab === 'users' && <UsersView showToast={showToast} currentUserId={user?.id} canRole={user?.role === 'admin' || user?.user_type === 'admin'} />}
      </div>

      {toast && <div className={`toast ${toast.ok ? 'ok' : 'err'}`}>{toast.text}</div>}
    </div>
  );
}

/* ---------- E1 Overview ---------- */
function OverviewView({ goTab, router }: any) {
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const [s, l, u] = await Promise.all([
          fetch('/api/admin/dashboard', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
          fetch('/api/admin/listings?status=pending', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
          fetch('/api/admin/users', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
        ]);
        setStats(s?.stats || null);
        setPending(l?.listings || l?.data?.listings || []);
        setUsers(u?.data?.users || u?.users || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <div className="fspin" />;
  const s = stats || {};
  return (
    <>
      <div className="bhd"><div><h1>Обзор платформы</h1><div className="sub">Ереван · последние 30 дней</div></div></div>
      <div className="mrow">
        <div className="mtile"><b>{nfmt(s.users?.total)}</b><div className="lbl">Пользователей</div></div>
        <div className="mtile"><b>{nfmt(s.properties?.total)}</b><div className="lbl">Объявлений</div></div>
        <div className="mtile"><b>{nfmt(s.listings?.pending)}</b><div className="lbl">На модерации</div></div>
        <div className="mtile"><b>{nfmt(s.deals?.won_this_month)}</b><div className="lbl">Сделок за месяц</div></div>
      </div>

      <div className="bsec">
        <div className="sh"><h3>Требуют внимания</h3><button className="a" onClick={() => goTab('moderation')}>Вся модерация</button></div>
        {pending.length === 0 ? <div className="empty"><h3>Очередь пуста</h3><p>Нет объявлений на модерации.</p></div> :
          pending.slice(0, 4).map((l: any) => (
            <div key={l.id} className="lrow">
              <div className="th" style={{ backgroundImage: `url('${(l.photos && l.photos[0]) || ''}')` }} />
              <div className="ti"><b>{l.location || l.property_type || 'Объявление'}</b><div className="mt">Агент: {l.owner?.name || l.owner?.email || '—'} · {timeAgo(l.created_at)}</div></div>
              <span className="stat pend">На модерации</span>
            </div>
          ))}
      </div>

      <div className="bsec">
        <div className="sh"><h3>Новые пользователи</h3><button className="a" onClick={() => goTab('users')}>Все пользователи</button></div>
        {users.slice(0, 5).map((u: any) => {
          const ri = roleInfo(u);
          const name = u.name || u.email;
          return (
            <div key={u.id} className="lead">
              <div className="av">{initials(name)}</div>
              <div className="ti"><div className="nm">{name}</div><div className="mt">{ri.label} · {timeAgo(u.createdAt)}</div></div>
              <span className={`role ${ri.cls}`}>{ri.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- E2 Moderation ---------- */
function ModerationView({ showToast }: any) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async (st: string) => {
    setLoading(true);
    try { const r = await fetch(`/api/admin/listings?status=${st}`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setItems(d.listings || d.data?.listings || []); } } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(status); }, [status, load]);

  const act = async (l: any, kind: 'approve' | 'reject') => {
    setBusy(l.id);
    try {
      const r = await fetch(`/api/admin/listings/${l.id}/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(kind === 'reject' ? { reason: 'Отклонено модератором' } : {}) });
      if (r.status === 409) {
        setItems((prev) => prev.filter((x) => x.id !== l.id));
        showToast(false, 'Уже обработано другим модератором');
        return;
      }
      if (!r.ok) { showToast(false, 'Не удалось выполнить'); return; }
      setItems((prev) => prev.filter((x) => x.id !== l.id));
      showToast(true, kind === 'approve' ? 'Объявление одобрено и опубликовано' : 'Объявление отклонено');
    } catch { showToast(false, 'Ошибка сети'); } finally { setBusy(null); }
  };

  return (
    <>
      <div className="bhd"><div><h1>Модерация объявлений</h1><div className="sub">Проверьте факты и фото</div></div></div>
      <div className="chips">
        <span className={`chip${status === 'pending' ? ' active' : ''}`} onClick={() => setStatus('pending')}>В очереди</span>
        <span className={`chip${status === 'approved' ? ' active' : ''}`} onClick={() => setStatus('approved')}>Одобренные</span>
        <span className={`chip${status === 'rejected' ? ' active' : ''}`} onClick={() => setStatus('rejected')}>Отклонённые</span>
      </div>
      {loading ? <div className="fspin" /> : items.length === 0 ? <div className="empty"><h3>Пусто</h3><p>{status === 'pending' ? 'Очередь модерации пуста.' : 'Нет объявлений в этом статусе.'}</p></div> :
        items.map((l) => {
          const photos = Array.isArray(l.photos) ? l.photos : [];
          return (
            <div key={l.id} className="mod">
              <div className="ph" style={{ backgroundImage: `url('${photos[0] || ''}')` }} />
              <div className="mi">
                <b>{l.location || l.property_type || 'Объявление'}</b>
                <div className="mt">{[l.property_type, l.area ? `${l.area} м²` : '', l.price ? `${nfmt(l.price)} ${l.currency || 'AMD'}` : ''].filter(Boolean).join(' · ')}</div>
                <div className="mt" style={{ marginTop: 5 }}>Агент: {l.owner?.name || l.owner?.email || '—'} · {timeAgo(l.created_at)}</div>
                <div className="flags">
                  <span className={`flag ${photos.length >= 3 ? 'ok' : 'warn'}`}>{photos.length >= 3 ? '✓ Фото полные' : `⚠ Фото: ${photos.length}`}</span>
                  <span className={`flag ${l.description ? 'ok' : 'warn'}`}>{l.description ? '✓ Есть описание' : '⚠ Нет описания'}</span>
                  <span className={`flag ${l.contact ? 'ok' : 'warn'}`}>{l.contact ? '✓ Контакт указан' : '⚠ Нет контакта'}</span>
                </div>
              </div>
              {status === 'pending' && (
                <div className="macts">
                  <button className="em3d" disabled={busy === l.id} onClick={() => act(l, 'approve')}>Одобрить</button>
                  <button className="btn-danger" disabled={busy === l.id} onClick={() => act(l, 'reject')}>Отклонить</button>
                </div>
              )}
              {status !== 'pending' && <span className={`stat ${status === 'approved' ? 'ok' : 'rej'}`}>{status === 'approved' ? 'Одобрено' : 'Отклонено'}</span>}
            </div>
          );
        })}
    </>
  );
}

/* ---------- E3 Users ---------- */
function UsersView({ showToast, currentUserId, canRole }: any) {
  const [filter, setFilter] = useState<'all' | 'buyer' | 'broker' | 'blocked'>('all');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    let q = '';
    if (filter === 'buyer') q = '?user_type=buyer';
    else if (filter === 'blocked') q = '?is_blocked=true';
    try { const r = await fetch(`/api/admin/users${q}`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); let list = d.data?.users || d.users || []; if (filter === 'broker') list = list.filter((u: any) => u.user_type === 'agent' || u.user_type === 'owner'); setItems(list); } } catch {} finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const toggleBlock = async (u: any) => {
    const action = u.is_blocked ? 'unblock' : 'block';
    setBusy(u.id);
    setItems((prev) => prev.map((x) => x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x));
    try {
      const r = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ user_id: u.id, action, reason: action === 'block' ? 'Заблокирован админом' : undefined }) });
      if (!r.ok) { load(); showToast(false, 'Не удалось изменить'); return; }
      showToast(true, action === 'block' ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    } catch { load(); showToast(false, 'Ошибка сети'); } finally { setBusy(null); }
  };

  const toggleMod = async (u: any) => {
    const next = u.role === 'moderator' ? 'user' : 'moderator';
    setBusy(u.id);
    setItems((prev) => prev.map((x) => x.id === u.id ? { ...x, role: next } : x));
    try {
      const r = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ user_id: u.id, action: 'change_role', new_role: next }) });
      if (!r.ok) { load(); showToast(false, 'Не удалось изменить роль'); return; }
      showToast(true, next === 'moderator' ? 'Назначен модератором' : 'Снят с модератора');
    } catch { load(); showToast(false, 'Ошибка сети'); } finally { setBusy(null); }
  };

  return (
    <>
      <div className="bhd"><div><h1>Пользователи</h1><div className="sub">Роли и доступ</div></div></div>
      <div className="chips">
        <span className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Все</span>
        <span className={`chip${filter === 'buyer' ? ' active' : ''}`} onClick={() => setFilter('buyer')}>Покупатели</span>
        <span className={`chip${filter === 'broker' ? ' active' : ''}`} onClick={() => setFilter('broker')}>Брокеры</span>
        <span className={`chip${filter === 'blocked' ? ' active' : ''}`} onClick={() => setFilter('blocked')}>Заблокированные</span>
      </div>
      {loading ? <div className="fspin" /> : items.length === 0 ? <div className="empty"><h3>Нет пользователей</h3><p>В этой категории пусто.</p></div> :
        <div className="utable">
          {items.map((u) => {
            const ri = roleInfo(u);
            const name = u.name || u.email;
            const isAdmin = u.role === 'admin';
            const isSelf = u.id === currentUserId;
            return (
              <div key={u.id} className="urow">
                <div className="av">{initials(name)}</div>
                <div className="ui"><div className="nm">{name}</div><div className="em">{u.email}</div></div>
                <span className={`role ${ri.cls}`}>{ri.label}</span>
                <span className={`ust ${u.is_blocked ? 'blocked' : 'active'}`} style={{ width: 96 }}>{u.is_blocked ? 'Заблокирован' : 'Активен'}</span>
                <div className="lact" style={{ gap: 14 }}>
                  {canRole && !isAdmin && !isSelf && (
                    <button className="sec" disabled={busy === u.id} onClick={() => toggleMod(u)}>{u.role === 'moderator' ? 'Снять модер.' : 'В модераторы'}</button>
                  )}
                  {isAdmin || isSelf ? <span className="sec" style={{ opacity: .4 }}>—</span> :
                    <button className="sec danger" disabled={busy === u.id} onClick={() => toggleBlock(u)}>{u.is_blocked ? 'Разблокировать' : 'Заблокировать'}</button>}
                </div>
              </div>
            );
          })}
        </div>}
    </>
  );
}

function timeAgo(d: any): string {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'только что';
  if (h < 24) return `${h} ч назад`;
  const days = Math.floor(h / 24);
  return `${days} дн назад`;
}
