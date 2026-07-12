'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import ViewingCreateForm from '@/components/dashboard/ViewingCreateForm';

/** 1:1 A12 «Мои просмотры» styles from Homy-Batch2 mockup. Scoped under .homy-view. */
const VIEW_CSS = `
.homy-view{--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--amber:#B9822A;--danger:#D8434B;color:var(--ink);font-family:'Montserrat',sans-serif}
html.dark .homy-view{--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--amber:#E0A83B;--danger:#F0616A}
.homy-view *{box-sizing:border-box}
.homy-view .hd{display:flex;align-items:center;gap:12px;padding-bottom:18px;border-bottom:1px solid var(--hair);margin-bottom:20px}
.homy-view .hd h2{font-size:20px;font-weight:800;letter-spacing:-.02em}
.homy-view .chips{margin-left:auto;display:flex;gap:8px}
.homy-view .chip{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid var(--hair);background:var(--surface);color:var(--soft);cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
.homy-view .chip.active{color:#fff;border-color:transparent;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}
.homy-view .chip .c{font-size:10px;font-weight:700;background:rgba(255,255,255,.25);border-radius:999px;padding:0 6px}
.homy-view .list{display:flex;flex-direction:column;gap:12px}
.homy-view .vrow{display:flex;gap:14px;background:var(--surface);border:1px solid var(--hair);border-radius:14px;padding:14px;align-items:center}
.homy-view .vrow .th{width:80px;height:70px;border-radius:10px;background-size:cover;background-position:center;background-color:var(--surface2);flex:none}
.homy-view .vrow .info{flex:1;min-width:0}
.homy-view .vrow .info b{font-size:14px;font-weight:600}
.homy-view .vrow .info .dt{font-size:12.5px;color:var(--soft);margin-top:6px;display:flex;gap:12px;align-items:center}
.homy-view .vrow .info .cl{font-size:11.5px;color:var(--muted);margin-top:4px}
.homy-view .vrow .act{display:flex;flex-direction:column;gap:7px;align-items:flex-end;flex:none}
.homy-view .sig{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:5px 9px;border-radius:7px;white-space:nowrap}
.homy-view .sig.ok{background:color-mix(in srgb,var(--em) 16%,transparent);color:var(--em)}
.homy-view .sig.warn{background:color-mix(in srgb,var(--amber) 18%,transparent);color:var(--amber)}
.homy-view .sig.err{background:color-mix(in srgb,var(--danger) 16%,transparent);color:var(--danger)}
.homy-view .sig.mut{background:color-mix(in srgb,var(--muted) 14%,transparent);color:var(--muted)}
.homy-view .em3d{position:relative;overflow:hidden;color:#fff;border:0;background:radial-gradient(135% 175% at 50% 14%,var(--em-hi),var(--em));box-shadow:0 2px 6px rgba(4,40,28,.25),inset 0 1px 0 rgba(255,255,255,.2);font-weight:700;font-size:12.5px;padding:9px 16px;border-radius:11px;cursor:pointer;font-family:inherit;white-space:nowrap}
.homy-view .em3d:disabled{opacity:.55;pointer-events:none}
.homy-view .sec{position:relative;background:none;border:0;color:var(--soft);font-weight:600;font-size:12px;padding:8px 4px;cursor:pointer;font-family:inherit;white-space:nowrap;overflow:visible}
.homy-view .sec::after{content:'';position:absolute;left:3px;bottom:1px;width:0;height:2px;border-radius:2px;background:var(--em);transition:width .28s cubic-bezier(.22,1,.36,1)}
.homy-view .sec:hover{color:var(--em)}.homy-view .sec:hover::after{width:calc(100% - 6px)}
.homy-view .sec.danger:hover{color:var(--danger)}.homy-view .sec.danger::after{background:var(--danger)}
.homy-view .empty{text-align:center;padding:60px 20px}
.homy-view .empty .ec{width:60px;height:60px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--em) 12%,transparent);color:var(--em)}
.homy-view .empty h3{font-size:16px;font-weight:700}.homy-view .empty p{font-size:13px;color:var(--muted);margin-top:6px}
.homy-view .empty .go{margin-top:16px;background:none;border:0;color:var(--em);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
.homy-view .fspin{width:34px;height:34px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homyvspin .9s linear infinite;margin:60px auto}
@keyframes homyvspin{to{transform:rotate(360deg)}}
/* propose-time modal */
.homy-view .pmback{position:fixed;inset:0;z-index:120;background:rgba(18,22,30,.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:20px}
.homy-view .pmodal{width:100%;max-width:440px;background:var(--surface);border:1px solid var(--hair);border-radius:18px;padding:22px;box-shadow:0 24px 64px rgba(20,24,31,.22)}
.homy-view .pmodal h3{font-size:17px;font-weight:800;letter-spacing:-.02em}
.homy-view .pmodal .sub{font-size:12.5px;color:var(--muted);margin-top:4px}
.homy-view .pmodal label{display:block;font-size:11.5px;font-weight:600;color:var(--soft);margin:14px 0 6px}
.homy-view .pmin{width:100%;background:var(--surface2);border:1px solid var(--hair);border-radius:11px;padding:11px 12px;font-size:13px;color:var(--ink);font-family:inherit;outline:none}
.homy-view .pmin:focus{border-color:var(--em)}
.homy-view .pmslots{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.homy-view .pmslots .slot{font-size:12.5px;font-weight:600;text-align:center;padding:9px 0;border-radius:9px;border:1px solid var(--hair);background:var(--surface);color:var(--soft);cursor:pointer}
.homy-view .pmslots .slot.sel{color:#fff;border-color:transparent;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}
.homy-view .pmact{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
.homy-view .toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:130;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;color:#fff;box-shadow:0 14px 40px rgba(0,0,0,.3)}
.homy-view .toast.ok{background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}
.homy-view .toast.err{background:var(--danger)}
@media(max-width:640px){.homy-view .vrow{flex-wrap:wrap}.homy-view .vrow .act{flex-direction:row;flex:1 1 100%;justify-content:flex-start}}
`;

const DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MON_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) { try { const o = JSON.parse(s); return o[lang] || o.ru || o.en || s; } catch { return v; } }
  return v;
}
function fmtDt(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
  return `${DOW[d.getDay()]}, ${d.getDate()} ${MON_GEN[d.getMonth()]} · ${hh}:${mm}`;
}

interface Viewing {
  id: string; propertyId: string; clientId: string; agentId: string;
  lastProposedById: string; cancelledById: string | null;
  scheduledAt: string; status: string; comment: string | null;
  property: any; client: any; agent: any; lastProposedBy: any;
}

export default function ViewingsTab() {
  const { lang } = useT();
  const router = useRouter();
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [me, setMe] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [proposeFor, setProposeFor] = useState<Viewing | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(false);
  const [userType, setUserType] = useState<string>('');

  const showToast = useCallback((ok: boolean, text: string) => {
    setToast({ ok, text }); window.setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchAll = useCallback(async () => {
    setError(false);
    try {
      const [vRes, uRes] = await Promise.all([
        fetch('/api/viewings', { credentials: 'include' }),
        fetch('/api/users/me', { credentials: 'include' }),
      ]);
      if (uRes.ok) { const u = await uRes.json(); setMe(u.id || u.user?.id || ''); setUserType(u.user_type || u.user?.user_type || ''); }
      if (vRes.ok) { const d = await vRes.json(); setViewings(d.viewings || []); }
      else setError(true);
    } catch { setError(true); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const act = useCallback(async (v: Viewing, kind: 'approve' | 'cancel', ) => {
    setBusy(v.id);
    try {
      const res = await fetch(`/api/viewings/${v.id}/${kind}`, {
        method: kind === 'cancel' ? 'PATCH' : 'POST', credentials: 'include',
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(false, e.error || 'Не удалось выполнить'); return; }
      showToast(true, kind === 'approve' ? 'Просмотр подтверждён' : 'Просмотр отменён');
      await fetchAll();
    } catch { showToast(false, 'Ошибка сети'); }
    finally { setBusy(null); }
  }, [fetchAll, showToast]);

  const propose = useCallback(async (v: Viewing, scheduledAt: string, comment: string) => {
    setBusy(v.id);
    try {
      const res = await fetch(`/api/viewings/${v.id}/propose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ scheduledAt, comment }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(false, e.error || 'Не удалось предложить время'); return; }
      showToast(true, 'Новое время предложено');
      setProposeFor(null);
      await fetchAll();
    } catch { showToast(false, 'Ошибка сети'); }
    finally { setBusy(null); }
  }, [fetchAll, showToast]);

  const now = new Date();
  const active = useMemo(() => viewings.filter((v) => new Date(v.scheduledAt) >= now && v.status !== 'completed' && v.status !== 'cancelled'), [viewings]);
  const done = useMemo(() => viewings.filter((v) => new Date(v.scheduledAt) < now || v.status === 'completed' || v.status === 'cancelled'), [viewings]);
  const list = tab === 'active' ? active : done;

  return (
    <div className="homy-view">
      <style dangerouslySetInnerHTML={{ __html: VIEW_CSS }} />

      <div className="hd">
        <h2>Мои просмотры</h2>
        <div className="chips">
          <span className={`chip${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>Активные{active.length > 0 && <span className="c">{active.length}</span>}</span>
          <span className={`chip${tab === 'done' ? ' active' : ''}`} onClick={() => setTab('done')}>Завершённые{done.length > 0 && <span className="c">{done.length}</span>}</span>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#fff', background: 'radial-gradient(135% 175% at 50% 14%,#2BC091,#0B6E4F)', border: 0, borderRadius: 11, padding: '9px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Запросить просмотр</button>
      </div>

      {loading ? (
        <div className="fspin" />
      ) : error ? (
        <div className="empty">
          <div className="ec"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg></div>
          <h3>Не удалось загрузить</h3>
          <p>Проверьте соединение и попробуйте снова.</p>
          <button className="go" onClick={fetchAll}>Повторить</button>
        </div>
      ) : list.length === 0 ? (
        <div className="empty">
          <div className="ec"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></div>
          <h3>{tab === 'active' ? 'Нет активных просмотров' : 'Нет завершённых'}</h3>
          <p>{tab === 'active' ? 'Запишитесь на просмотр объекта — он появится здесь.' : 'Здесь будут прошедшие и отменённые просмотры.'}</p>
          {tab === 'active' && <button className="go" onClick={() => router.push('/allresults')}>К объектам →</button>}
        </div>
      ) : (
        <div className="list">
          {list.map((v) => {
            const isClient = v.clientId === me;
            const other = isClient ? v.agent : v.client;
            const otherName = other?.name || [other?.first_name, other?.last_name].filter(Boolean).join(' ') || other?.email || 'Агент';
            const img = v.property?.imageUrl || v.property?.image_url || v.property?.images?.[0] || '';
            const title = loc(v.property?.title, lang) || 'Объект';
            const iProposedLast = v.lastProposedById === me;
            const myTurn = (v.status === 'pending_client' && isClient) || (v.status === 'pending_agent' && !isClient);

            let sig: React.ReactNode = null;
            let statusText = '';
            const actions: React.ReactNode[] = [];

            if (v.status === 'confirmed') {
              sig = <span className="sig ok">✓ Подтверждено</span>;
              statusText = `Агент: ${otherName} · время согласовано`;
              actions.push(<button key="c" className="sec danger" disabled={busy === v.id} onClick={() => act(v, 'cancel')}>Отменить</button>);
            } else if (v.status === 'cancelled') {
              sig = <span className="sig err">Отменено</span>;
              statusText = v.cancelledById === me ? 'Отменено вами' : 'Отменено другой стороной';
            } else if (v.status === 'completed') {
              sig = <span className="sig mut">Завершено</span>;
              statusText = `Агент: ${otherName}`;
            } else if (myTurn) {
              // other side proposed → I confirm or counter
              statusText = `${isClient ? 'Агент' : 'Клиент'} предложил время — нужно ваше подтверждение`;
              actions.push(<button key="a" className="em3d" disabled={busy === v.id} onClick={() => act(v, 'approve')}><span>Подтвердить</span></button>);
              actions.push(<button key="p" className="sec" onClick={() => setProposeFor(v)}>Другое время</button>);
            } else {
              // waiting on the other side
              sig = <span className="sig warn">Ждём {isClient ? 'агента' : 'клиента'}</span>;
              statusText = iProposedLast ? 'Вы предложили время' : 'Ожидает ответа';
              actions.push(<button key="p" className="sec" onClick={() => setProposeFor(v)}>Предложить другое</button>);
              actions.push(<button key="c" className="sec danger" disabled={busy === v.id} onClick={() => act(v, 'cancel')}>Отменить</button>);
            }

            return (
              <div key={v.id} className="vrow">
                <div className="th" style={{ backgroundImage: `url('${img}')` }} onClick={() => router.push(`/properties/${v.propertyId}`)} role="button" />
                <div className="info">
                  <b>{title}</b>
                  <div className="dt"><span>📅 {fmtDt(v.scheduledAt)}</span></div>
                  <div className="cl">{statusText}{v.comment ? ` · «${v.comment}»` : ''}</div>
                  {(() => {
                    const place = [loc(v.property?.address, lang), loc(v.property?.district || v.property?.neighborhood, lang)].filter(Boolean).join(' · ');
                    return place ? <div style={{ fontSize: 12, color: 'var(--muted,#6A7382)', marginTop: 3 }}>📍 {place}</div> : null;
                  })()}
                  {other?.phone && (
                    <a href={`tel:${other.phone}`} onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--em,#0A6045)', textDecoration: 'none', marginTop: 6 }}>📞 Позвонить · {other.phone}</a>
                  )}
                </div>
                <div className="act">
                  {sig}
                  {actions}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {proposeFor && <ProposeModal viewing={proposeFor} lang={lang} busy={busy === proposeFor.id} onClose={() => setProposeFor(null)} onSubmit={propose} />}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(6,10,20,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto', background: 'var(--surface,#fff)', borderRadius: 16 }}>
            <ViewingCreateForm
              userType={(userType as any) || 'buyer'}
              onCancel={() => setShowCreate(false)}
              onSuccess={() => { setShowCreate(false); showToast(true, 'Запрос на просмотр отправлен'); fetchAll(); }}
            />
          </div>
        </div>
      )}
      {toast && <div className={`toast ${toast.ok ? 'ok' : 'err'}`}>{toast.text}</div>}
    </div>
  );
}

function ProposeModal({ viewing, lang, busy, onClose, onSubmit }: { viewing: Viewing; lang: string; busy: boolean; onClose: () => void; onSubmit: (v: Viewing, at: string, comment: string) => void }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [comment, setComment] = useState('');
  const minDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }, []);
  const slots = ['10:00', '11:30', '12:30', '14:00', '15:30', '17:00', '18:30', '19:30'];
  const title = loc(viewing.property?.title, lang) || 'Объект';
  const submit = () => { if (!date || !time) return; onSubmit(viewing, new Date(`${date}T${time}:00`).toISOString(), comment); };

  return (
    <div className="pmback" onClick={() => !busy && onClose()}>
      <div className="pmodal" onClick={(e) => e.stopPropagation()}>
        <h3>Предложить другое время</h3>
        <div className="sub">{title}</div>
        <label>Дата</label>
        <input className="pmin" type="date" value={date} min={minDate} onChange={(e) => setDate(e.target.value)} />
        <label>Время</label>
        <div className="pmslots">
          {slots.map((s) => <span key={s} className={`slot${time === s ? ' sel' : ''}`} onClick={() => setTime(s)}>{s}</span>)}
        </div>
        <label>Комментарий (необязательно)</label>
        <input className="pmin" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Например: удобнее после 18:00" maxLength={120} />
        <div className="pmact">
          <button className="sec" onClick={() => !busy && onClose()}>Отмена</button>
          <button className="em3d" disabled={!date || !time || busy} onClick={submit}><span>{busy ? 'Отправляем…' : 'Предложить время'}</span></button>
        </div>
      </div>
    </div>
  );
}
