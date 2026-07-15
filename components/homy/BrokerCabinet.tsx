'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/components/homy/ThemeProvider';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import ViewingsTab from '@/components/homy/ViewingsTab';
import { BROKER_CSS } from '@/components/homy/brokerStyles';
import { PROVINCES, getCities, YEREVAN_DISTRICTS, localizeGeo } from '@/lib/geo/armenia';

function fmtPrice(p: any): string { const n = Number(p); return n ? Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ') : '—'; }
function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) { try { const o = JSON.parse(s); return o[lang] || o.ru || o.en || s; } catch { return v; } }
  return v;
}
const initials = (name: string) => (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const TABS = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'listings', label: 'Объявления' },
  { id: 'clients', label: 'Клиенты' },
  { id: 'viewings', label: 'Просмотры' },
  { id: 'deals', label: 'Сделки' },
];
const STAGE_LABEL: Record<string, string> = { new: 'Новый', warm: 'Тёплый', cold: 'Холодный' };
const DEAL_STAGE: Record<string, string> = { negotiation: 'Переговоры', offer: 'Оферта', contract: 'Договор', closed: 'Закрыта', lost: 'Потеряна' };

export default function BrokerCabinet({ user }: { user: any }) {
  const { lang } = useT();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') || 'dashboard';
  const goTab = useCallback((id: string) => router.push(id === 'dashboard' ? '/dashboard' : `/dashboard?tab=${id}`, { scroll: false }), [router]);

  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const showToast = useCallback((ok: boolean, text: string) => { setToast({ ok, text }); window.setTimeout(() => setToast(null), 3000); }, []);
  const curTab = TABS.find((t) => t.id === tab) || TABS[0];

  const firstName = user?.first_name || (user?.name ? String(user.name).split(' ')[0] : '') || '';
  const roleLabel = user?.user_type === 'owner' ? 'Владелец' : 'Агент';

  return (
    <div className="homy-broker">
      <style dangerouslySetInnerHTML={{ __html: BROKER_CSS }} />

      <div className="bnav">
        <HomyLogoMenu align="left" />
        <div className="btabs">
          {TABS.map((t) => <button key={t.id} className={`btab${tab === t.id ? ' on' : ''}`} onClick={() => goTab(t.id)}>{t.label}</button>)}
        </div>
        {/* mobile: метка текущего раздела (навигация — через меню Homy) */}
        <span className="bcur">· {curTab.label}</span>
        <div className="right">
          <button className="bell" title="Уведомления" onClick={() => router.push('/notifications')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          </button>
          <div className="themebtn">
            <button className={`o${theme === 'light' ? ' on' : ''}`} title="Светлая" onClick={() => setTheme('light')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5" /></svg>
            </button>
            <button className={`o${theme === 'dark' ? ' on' : ''}`} title="Тёмная" onClick={() => setTheme('dark')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="bwrap">
        {tab === 'dashboard' && <DashboardView lang={lang} firstName={firstName} router={router} goTab={goTab} showToast={showToast} />}
        {tab === 'listings' && <ListingsView lang={lang} router={router} showToast={showToast} />}
        {tab === 'clients' && <ClientsView lang={lang} showToast={showToast} meId={user?.id} />}
        {tab === 'viewings' && <ViewingsTab />}
        {tab === 'deals' && <DealsView lang={lang} showToast={showToast} />}
      </div>

      {toast && <div className={`toast ${toast.ok ? 'ok' : 'err'}`}>{toast.text}</div>}
    </div>
  );
}

/* ---------------- D1 Dashboard ---------------- */
function DashboardView({ lang, firstName, router, goTab, showToast }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/agent/dashboard', { credentials: 'include' }); if (r.ok) setData(await r.json()); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="fspin" />;
  const m = data?.metrics || {};
  const listings = data?.listings || [];
  const leads = data?.recentLeads || [];

  return (
    <>
      <div className="bhd">
        <div><h1>С возвращением{firstName ? `, ${firstName}` : ''}</h1><div className="sub">Обзор кабинета · неделя</div></div>
        <button className="cta" onClick={() => setCreateOpen(true)}>Новое объявление</button>
      </div>

      <div className="mrow">
        <div className="mtile"><b>{m.active_listings ?? 0}</b><div className="lbl">Активные объявления</div></div>
        <div className="mtile"><b>{m.inquiries_7d ?? 0}</b><div className="lbl">Запросы за 7 дней</div></div>
        <div className="mtile"><b>{m.new_leads ?? 0}</b><div className="lbl">Новые лиды</div></div>
        <div className="mtile"><b>{m.deals_open ?? 0}</b><div className="lbl">Сделки в работе</div></div>
      </div>

      <div className="bsec">
        <div className="sh"><h3>Мои объявления</h3><button className="a" onClick={() => goTab('listings')}>Все объявления</button></div>
        {listings.length === 0 ? <div className="empty"><h3>Нет объявлений</h3><p>Создайте первое объявление — Homy проверит и опубликует.</p></div> :
          listings.slice(0, 3).map((p: any) => (
            <div key={p.id} className="lrow">
              <div className="th" style={{ backgroundImage: `url('${p.imageUrl || p.images?.[0] || ''}')` }} onClick={() => router.push(`/properties/${p.id}`)} />
              <div className="ti"><b>{loc(p.title, lang)}</b><div className="mt">{[p.address, loc(p.district, lang)].filter(Boolean).join(' · ')}</div></div>
              <div className="kv"><span>{p._count?.viewings ?? 0} <b>запр.</b></span><span>{p._count?.leads ?? 0} <b>лид.</b></span></div>
              <span className={`stat ${p.available ? 'ok' : 'mut'}`}>{p.available ? 'Опубликовано' : 'Снято'}</span>
              <div className="pr">{fmtPrice(p.price)}</div>
            </div>
          ))}
      </div>

      <div className="bsec">
        <div className="sh"><h3>Новые лиды</h3><button className="a" onClick={() => goTab('clients')}>Все клиенты</button></div>
        {leads.length === 0 ? <div className="empty"><h3>Пока нет лидов</h3><p>Лид появится, когда покупатель запросит просмотр вашего объекта.</p></div> :
          leads.map((l: any) => {
            const name = l.client_name || [l.client?.first_name, l.client?.last_name].filter(Boolean).join(' ') || 'Клиент';
            return (
              <div key={l.id} className="lead">
                <div className="av">{initials(name)}</div>
                <div className="ti"><div className="nm">{name}</div><div className="mt">{l.interest || 'Интерес не указан'}</div></div>
                <span className={`stage ${l.stage}`}>{STAGE_LABEL[l.stage] || l.stage}</span>
              </div>
            );
          })}
      </div>

      {createOpen && <CreateListingModal lang={lang} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); showToast(true, 'Отправлено на модерацию'); }} showToast={showToast} />}
    </>
  );
}

/* ---------------- D2 Listings ---------------- */
function ListingsView({ lang, router, showToast }: any) {
  const [props, setProps] = useState<any[]>([]);   // live catalogue objects
  const [subs, setSubs] = useState<any[]>([]);      // pending/rejected submissions
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'pending' | 'rejected'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pR, lR] = await Promise.all([
        fetch('/api/agent/dashboard', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
        fetch('/api/users/me/listings?limit=100', { credentials: 'include' }).then((r) => r.ok ? r.json() : null),
      ]);
      setProps(pR?.listings || []);
      setSubs((lR?.listings || []).filter((l: any) => l.status === 'pending' || l.status === 'rejected'));
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const unpublish = async (p: any) => {
    const next = !p.available;
    setProps((prev) => prev.map((x) => x.id === p.id ? { ...x, available: next } : x));
    try {
      await fetch(`/api/properties/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ available: next }) });
      showToast(true, next ? 'Объявление опубликовано' : 'Объявление снято');
    } catch { load(); showToast(false, 'Не удалось изменить статус'); }
  };

  const rows = [
    ...props.map((p: any) => ({ key: `p_${p.id}`, id: p.id, kind: 'property', title: loc(p.title, lang), place: [p.address, loc(p.district, lang)].filter(Boolean).join(' · '), img: p.imageUrl || p.images?.[0] || '', status: p.available ? 'published' : 'off', _count: p._count, available: p.available, _orig: p })),
    ...subs.map((l: any) => ({ key: `l_${l.id}`, id: l.id, kind: 'listing', title: l.location || 'Объявление', place: l.status === 'rejected' ? 'Отклонено модератором' : 'Ожидает проверки', img: (Array.isArray(l.photos) && l.photos[0]) || '', status: l.status, _orig: l })),
  ];
  const matches = (r: any) => filter === 'all' ? true : filter === 'published' ? (r.status === 'published' || r.status === 'off') : r.status === filter;
  const list = rows.filter(matches);
  const badge = (s: string) => s === 'published' ? { c: 'ok', t: 'Опубликовано' } : s === 'off' ? { c: 'mut', t: 'Снято' } : s === 'pending' ? { c: 'pend', t: 'На модерации' } : { c: 'rej', t: 'Отклонено' };

  const pubCount = props.filter((p: any) => p.available).length;
  const pendCount = subs.filter((l: any) => l.status === 'pending').length;

  return (
    <>
      <div className="bhd">
        <div><h1>Мои объявления</h1><div className="sub">{pubCount} опубликовано · {pendCount} на модерации</div></div>
        <button className="cta" onClick={() => setCreateOpen(true)}>Новое объявление</button>
      </div>
      <div className="chips">
        <span className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Все</span>
        <span className={`chip${filter === 'published' ? ' active' : ''}`} onClick={() => setFilter('published')}>Опубликовано</span>
        <span className={`chip${filter === 'pending' ? ' active' : ''}`} onClick={() => setFilter('pending')}>На модерации</span>
        <span className={`chip${filter === 'rejected' ? ' active' : ''}`} onClick={() => setFilter('rejected')}>Отклонённые</span>
      </div>
      {loading ? <div className="fspin" /> : list.length === 0 ? <div className="empty"><h3>Ничего нет</h3><p>Создайте новое объявление — оно попадёт на модерацию.</p></div> :
        list.map((r: any) => {
          const b = badge(r.status);
          return (
            <div key={r.key} className="lrow">
              <div className="th" style={{ backgroundImage: `url('${r.img}')` }} onClick={r.kind === 'property' ? () => router.push(`/properties/${r.id}`) : undefined} />
              <div className="ti"><b>{r.title}</b><div className="mt">{r.place}</div></div>
              {r.kind === 'property' && <div className="kv"><span>{r._count?.viewings ?? 0} <b>запр.</b></span><span>{r._count?.leads ?? 0} <b>лид.</b></span></div>}
              <span className={`stat ${b.c}`}>{b.t}</span>
              <div className="lact">
                {r.kind === 'property' && <button className="sec" onClick={() => router.push(`/properties/${r.id}`)}>Открыть</button>}
                <button className="sec" onClick={() => setEditItem({ id: r.id, kind: r.kind, data: r._orig })}>Изменить</button>
                {r.kind === 'property' && <button className="sec danger" onClick={() => unpublish(r)}>{r.available ? 'Снять' : 'Вернуть'}</button>}
              </div>
            </div>
          );
        })}
      {createOpen && <CreateListingModal lang={lang} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); showToast(true, 'Отправлено на модерацию'); }} showToast={showToast} />}
      {editItem && <CreateListingModal lang={lang} editing={editItem} onClose={() => setEditItem(null)} onDone={() => { setEditItem(null); load(); showToast(true, 'Изменения сохранены'); }} showToast={showToast} />}
    </>
  );
}

/* ---------------- D3 Create listing modal ---------------- */
function CreateListingModal({ lang, onClose, onDone, showToast, editing }: any) {
  const isEdit = !!editing;
  const d = editing?.data || {};
  const [f, setF] = useState<any>(isEdit ? {
    dealType: d.deal_type || d.dealType || 'long_term_rental',
    propertyType: d.property_type || d.propertyType || 'apartment',
    province: d.province || '',
    city: d.city || '',
    district: (typeof d.district === 'string' ? d.district : loc(d.district, lang)) || '',
    address: d.address || d.location || '',
    price: d.price != null ? String(d.price) : '',
    rooms: d.rooms != null ? String(d.rooms) : '',
    area: (d.area ?? d.size_sqm) != null ? String(d.area ?? d.size_sqm) : '',
    floor: d.floor != null ? String(d.floor) : '',
    description: (typeof d.description === 'string' ? d.description : loc(d.description, lang)) || '',
  } : { dealType: 'long_term_rental', propertyType: 'apartment', province: '', city: '', district: '', address: '', price: '', rooms: '', area: '', floor: '', description: '' });
  const [photos, setPhotos] = useState<string[]>(isEdit ? (d.images || d.photos || []) : []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));

  // The listings feed is trimmed (no rooms/area/floor/description) — on edit, pull the
  // full record so every field is pre-filled, not just price/district/photos.
  useEffect(() => {
    if (!isEdit) return;
    const url = editing.kind === 'property' ? `/api/properties/${editing.id}` : `/api/properties/listings/${editing.id}`;
    let alive = true;
    fetch(url, { credentials: 'include' }).then((r) => r.ok ? r.json() : null).then((res) => {
      if (!alive || !res) return;
      const o = res.property || res.listing || res;
      setF((s: any) => ({
        ...s,
        dealType: o.deal_type || o.dealType || s.dealType,
        propertyType: o.property_type || o.propertyType || s.propertyType,
        province: o.province || s.province,
        city: o.city || s.city,
        district: (typeof o.district === 'string' ? o.district : loc(o.district, lang)) || s.district,
        address: o.address || o.location || s.address,
        price: o.price != null ? String(o.price) : s.price,
        rooms: o.rooms != null ? String(o.rooms) : s.rooms,
        area: (o.area ?? o.sizeSqm ?? o.size_sqm) != null ? String(o.area ?? o.sizeSqm ?? o.size_sqm) : s.area,
        floor: o.floor != null ? String(o.floor) : s.floor,
        description: (typeof o.description === 'string' ? o.description : loc(o.description, lang)) || s.description,
      }));
      const imgs = o.images || o.photos;
      if (Array.isArray(imgs) && imgs.length) setPhotos(imgs);
    }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).slice(0, 10).forEach((file) => fd.append('files', file));
      const r = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      if (!r.ok) { showToast(false, 'Не удалось загрузить фото'); return; }
      const d = await r.json();
      setPhotos((prev) => [...prev, ...(d.urls || [])].slice(0, 20));
    } catch { showToast(false, 'Ошибка загрузки'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const submit = async () => {
    if (!f.price || !f.area || !f.rooms || !f.province || (f.province === 'yerevan' ? !f.district : !f.city)) {
      showToast(false, f.province === 'yerevan' ? 'Укажите район, цену, комнаты и площадь' : 'Укажите область, город, цену, комнаты и площадь');
      return;
    }
    setBusy(true);
    try {
      let r: Response;
      if (isEdit && editing.kind === 'property') {
        // Live catalogue object → direct owner edit (no re-moderation).
        r = await fetch(`/api/properties/${editing.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({
            dealType: f.dealType, propertyType: f.propertyType,
            province: f.province, city: f.city, district: f.province === 'yerevan' ? f.district : '', address: f.address,
            price: Number(f.price), rooms: Number(f.rooms), area: Number(f.area),
            floor: f.floor ? Number(f.floor) : null, description: f.description, images: photos,
          }),
        });
      } else if (isEdit) {
        // Pending/rejected submission → edit the PropertyListing (stays in moderation).
        r = await fetch(`/api/properties/listings/${editing.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({
            property_type: f.propertyType,
            province: f.province, city: f.city, district: f.province === 'yerevan' ? f.district : '',
            location: [f.address, f.province === 'yerevan' ? f.district : f.city].filter(Boolean).join(' · ') || f.address,
            price: Number(f.price), area: Number(f.area), rooms: Number(f.rooms),
            description: f.description, photos,
          }),
        });
      } else {
        // New listings go through moderation (PropertyListing pending) — a moderator
        // approves it and only then it becomes a live catalogue object.
        r = await fetch('/api/properties/list', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({
            property_type: f.propertyType, deal_type: f.dealType,
            province: f.province, city: f.city, district: f.province === 'yerevan' ? f.district : '', address: f.address,
            price: Number(f.price), rooms: Number(f.rooms), area: Number(f.area),
            floor: f.floor ? Number(f.floor) : null, description: f.description, photos,
          }),
        });
      }
      if (!r.ok) { showToast(false, isEdit ? 'Не удалось сохранить' : 'Не удалось отправить'); return; }
      onDone();
    } catch { showToast(false, 'Ошибка сети'); } finally { setBusy(false); }
  };
  return (
    <div className="mback" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? 'Редактировать объявление' : 'Новое объявление'}</h3>

        <div className="field">
          <label>Фото объекта</label>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => onFiles(e.target.files)} />
          {photos.length === 0 ? (
            <div className="drop" onClick={() => fileRef.current?.click()}>
              <div className="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg></div>
              {uploading ? 'Загружаем…' : 'Нажмите, чтобы загрузить фото'}<br /><span style={{ fontSize: 11 }}>JPG/PNG · до 20 фото</span>
            </div>
          ) : (
            <div className="thumbs">
              {photos.map((url, i) => (
                <div className="t" key={i} style={{ backgroundImage: `url('${url}')` }}><span className="x" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>×</span></div>
              ))}
              <div className="add" onClick={() => fileRef.current?.click()} title="Добавить">
                {uploading ? '…' : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>}
              </div>
            </div>
          )}
        </div>

        <div className="frm2">
          <div className="field"><label>Тип сделки</label><div className="inp"><select value={f.dealType} onChange={(e) => set('dealType', e.target.value)}><option value="long_term_rental">Аренда</option><option value="sale">Продажа</option></select></div></div>
          <div className="field"><label>Тип жилья</label><div className="inp"><select value={f.propertyType} onChange={(e) => set('propertyType', e.target.value)}><option value="apartment">Квартира</option><option value="house">Дом</option><option value="studio">Студия</option></select></div></div>
          <div className="field"><label>Область</label><div className="inp"><select value={f.province} onChange={(e) => { const pv = e.target.value; setF((s: any) => ({ ...s, province: pv, city: pv === 'yerevan' ? 'yerevan' : '', district: '' })); }}><option value="">Выберите область</option>{PROVINCES.map((p) => <option key={p.key} value={p.key}>{localizeGeo(p.name, lang)}</option>)}</select></div></div>
          {f.province === 'yerevan' ? (
            <div className="field"><label>Район (Ереван)</label><div className="inp"><select value={f.district} onChange={(e) => set('district', e.target.value)}><option value="">Выберите район</option>{YEREVAN_DISTRICTS.map((dd) => <option key={dd.key} value={dd.key}>{localizeGeo(dd.name, lang)}</option>)}</select></div></div>
          ) : (
            <div className="field"><label>Город</label><div className="inp"><select value={f.city} onChange={(e) => set('city', e.target.value)} disabled={!f.province}><option value="">{f.province ? 'Выберите город' : 'Сначала область'}</option>{getCities(f.province || undefined).map((c) => <option key={c.key} value={c.key}>{localizeGeo(c.name, lang)}</option>)}</select></div></div>
          )}
          <div className="field"><label>Адрес</label><div className="inp"><input value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Северный проспект 15" /></div></div>
          <div className="field"><label>Цена, AMD</label><div className="inp"><input type="number" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="350000" /></div></div>
          <div className="field"><label>Комнаты</label><div className="inp"><input type="number" value={f.rooms} onChange={(e) => set('rooms', e.target.value)} placeholder="2" /></div></div>
          <div className="field"><label>Площадь, м²</label><div className="inp"><input type="number" value={f.area} onChange={(e) => set('area', e.target.value)} placeholder="85" /></div></div>
          <div className="field"><label>Этаж</label><div className="inp"><input type="number" value={f.floor} onChange={(e) => set('floor', e.target.value)} placeholder="7" /></div></div>
        </div>
        <div className="field"><label>Описание</label><div className="inp"><textarea rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Тихий двор, свежий ремонт, рядом школа…" /></div></div>
        <div className="mact">
          <button className="sec" onClick={() => !busy && onClose()}>Отмена</button>
          <button className="em3d" disabled={busy} onClick={submit}>{busy ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Отправить на модерацию'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- D5 Clients & leads ---------------- */
function ClientsView({ lang, showToast, meId }: any) {
  const [chatFor, setChatFor] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'warm' | 'cold'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [open, setOpen] = useState<any>(null);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/agent/leads', { credentials: 'include' }); if (r.ok) { const d = await r.json(); setItems(d.leads || []); } } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStage = async (l: any, stage: string) => {
    setItems((prev) => prev.map((x) => x.id === l.id ? { ...x, stage } : x));
    try { await fetch(`/api/agent/leads/${l.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ stage }) }); } catch { load(); }
  };

  const filtered = items.filter((l) => filter === 'all' ? true : l.stage === filter);
  const counts = { new: items.filter((l) => l.stage === 'new').length };

  return (
    <>
      <div className="bhd">
        <div><h1>Клиенты и лиды</h1><div className="sub">{items.length} всего · {counts.new} новых заявок</div></div>
        <button className="cta" onClick={() => setAddOpen(true)}>Добавить клиента</button>
      </div>
      <div className="chips">
        {(['all', 'new', 'warm', 'cold'] as const).map((s) => <span key={s} className={`chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'Все' : STAGE_LABEL[s]}</span>)}
      </div>
      {loading ? <div className="fspin" /> : filtered.length === 0 ? <div className="empty"><h3>Нет клиентов</h3><p>Лиды создаются автоматически из запросов на просмотр — или добавьте вручную.</p></div> :
        filtered.map((l) => {
          const name = l.client_name || [l.client?.first_name, l.client?.last_name].filter(Boolean).join(' ') || l.client_email || 'Клиент';
          const last = l.last_contact_at ? new Date(l.last_contact_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '';
          return (
            <div key={l.id} className="lead">
              <div className="av">{initials(name)}</div>
              <div className="ti"><div className="nm">{name}</div><div className="mt">{[l.interest, last && `контакт: ${last}`].filter(Boolean).join(' · ')}</div></div>
              <span className={`stage ${l.stage}`}>{STAGE_LABEL[l.stage] || l.stage}</span>
              <div className="lact">
                {l.stage === 'new' && <button className="sec" onClick={() => { setStage(l, 'warm'); showToast(true, 'Заявка взята в работу'); }}>Взять в работу</button>}
                {l.client_id ? <button className="sec" onClick={() => setChatFor(l)}>Написать</button>
                  : l.client_email ? <a className="sec" href={`mailto:${l.client_email}`}>Написать</a>
                  : <span className="sec" style={{ opacity: .4 }}>Написать</span>}
                <button className="em3d" onClick={() => setOpen(l)}>Открыть</button>
              </div>
            </div>
          );
        })}
      {addOpen && <AddLeadModal onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); load(); showToast(true, 'Клиент добавлен'); }} showToast={showToast} />}
      {open && <LeadModal lead={open} lang={lang} onClose={() => setOpen(null)} onStage={(s: string) => { setStage(open, s); setOpen({ ...open, stage: s }); }} onDeal={() => { setOpen(null); load(); showToast(true, 'Сделка создана'); }} onDelete={() => { setItems((prev) => prev.filter((x) => x.id !== open.id)); setOpen(null); showToast(true, 'Лид удалён'); }} showToast={showToast} />}
      {chatFor && <ChatThread lead={chatFor} meId={meId} onClose={() => setChatFor(null)} showToast={showToast} />}
    </>
  );
}

/* ---------------- Agent ↔ client chat thread ---------------- */
function ChatThread({ lead, meId, onClose, showToast }: any) {
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const name = lead.client_name || [lead.client?.first_name, lead.client?.last_name].filter(Boolean).join(' ') || 'Клиент';

  const loadMsgs = useCallback(async (cid: string) => {
    try { const r = await fetch(`/api/chats/${cid}/messages`, { credentials: 'include' }); if (r.ok) { const d = await r.json(); setMsgs(d.messages || d.data?.messages || []); } } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/agent/leads/${lead.id}/chat`, { method: 'POST', credentials: 'include' });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) { if (alive) setErr(d.error || 'Не удалось открыть чат'); return; }
        if (!alive) return;
        setConvId(d.conversationId);
        loadMsgs(d.conversationId);
      } catch { if (alive) setErr('Ошибка сети'); }
    })();
    return () => { alive = false; };
  }, [lead.id, loadMsgs]);

  useEffect(() => { if (!convId) return; const t = setInterval(() => loadMsgs(convId), 4000); return () => clearInterval(t); }, [convId, loadMsgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  const send = async () => {
    const body = text.trim();
    if (!body || !convId) return;
    setText('');
    setMsgs((prev) => [...prev, { id: 'tmp' + Date.now(), sender_id: meId, content: body }]);
    try {
      await fetch(`/api/chats/${convId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ content: body }) });
      loadMsgs(convId);
    } catch { showToast(false, 'Не отправлено'); }
  };

  return (
    <div className="mback" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{name}</h3>
        <div className="sub" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{lead.interest || 'Диалог'}</div>
        <div className="chatbox">
          {err ? <div className="cempty">{err}</div> : msgs.length === 0 ? <div className="cempty">Сообщений пока нет — напишите первым.</div> : (
            <div className="chatmsgs">
              {msgs.map((m: any) => {
                const mine = (m.sender_id || m.senderId) === meId;
                return <div key={m.id} className={`cmsg${mine ? ' me' : ''}`}>{m.content}</div>;
              })}
              <div ref={endRef} />
            </div>
          )}
          {!err && (
            <div className="ccomposer">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Сообщение…" disabled={!convId} />
              <button className="em3d" disabled={!convId || !text.trim()} onClick={send}>Отпр.</button>
            </div>
          )}
        </div>
        <div className="mact"><button className="sec" onClick={onClose}>Закрыть</button></div>
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onDone, showToast }: any) {
  const [f, setF] = useState<any>({ clientName: '', clientPhone: '', clientEmail: '', interest: '', budget: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const submit = async () => {
    if (!f.clientName && !f.clientPhone && !f.clientEmail) { showToast(false, 'Укажите имя или контакт'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/agent/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...f, budget: f.budget ? Number(f.budget) : null }) });
      if (!r.ok) { showToast(false, 'Не удалось добавить'); return; }
      onDone();
    } catch { showToast(false, 'Ошибка сети'); } finally { setBusy(false); }
  };
  return (
    <div className="mback" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Добавить клиента</h3>
        <div className="field"><label>Имя</label><div className="inp"><input value={f.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Арам Геворкян" /></div></div>
        <div className="frm2">
          <div className="field"><label>Телефон</label><div className="inp"><input value={f.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} placeholder="+374…" /></div></div>
          <div className="field"><label>Email</label><div className="inp"><input value={f.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} placeholder="client@mail.am" /></div></div>
        </div>
        <div className="field"><label>Интерес</label><div className="inp"><input value={f.interest} onChange={(e) => set('interest', e.target.value)} placeholder="2-комн Кентрон · до 350 000" /></div></div>
        <div className="field"><label>Бюджет, AMD</label><div className="inp"><input type="number" value={f.budget} onChange={(e) => set('budget', e.target.value)} placeholder="350000" /></div></div>
        <div className="mact"><button className="sec" onClick={() => !busy && onClose()}>Отмена</button><button className="em3d" disabled={busy} onClick={submit}>{busy ? 'Сохраняем…' : 'Добавить'}</button></div>
      </div>
    </div>
  );
}

function LeadModal({ lead, lang, onClose, onStage, onDeal, onDelete, showToast }: any) {
  const [busy, setBusy] = useState(false);
  const name = lead.client_name || [lead.client?.first_name, lead.client?.last_name].filter(Boolean).join(' ') || lead.client_email || 'Клиент';
  const deleteLead = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Удалить этого лида? Действие необратимо.')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/agent/leads/${lead.id}`, { method: 'DELETE', credentials: 'include' });
      if (!r.ok) { showToast(false, 'Не удалось удалить'); return; }
      onDelete();
    } catch { showToast(false, 'Ошибка сети'); } finally { setBusy(false); }
  };
  const createDeal = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/agent/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ leadId: lead.id, title: lead.interest || name, value: lead.budget || null }) });
      if (!r.ok) { showToast(false, 'Не удалось создать сделку'); return; }
      onDeal();
    } catch { showToast(false, 'Ошибка сети'); } finally { setBusy(false); }
  };
  return (
    <div className="mback" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{name}</h3>
        <div className="sub" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{lead.interest || 'Интерес не указан'}</div>
        {(lead.client_phone || lead.client_email) && <div style={{ fontSize: 12.5, marginTop: 8 }}>{[lead.client_phone, lead.client_email].filter(Boolean).join(' · ')}</div>}
        <div className="field"><label>Стадия</label>
          <div className="chips">
            {(['new', 'warm', 'cold'] as const).map((s) => <span key={s} className={`chip${lead.stage === s ? ' active' : ''}`} onClick={() => onStage(s)}>{STAGE_LABEL[s]}</span>)}
          </div>
        </div>
        <div className="mact">
          <button className="sec danger" style={{ marginRight: 'auto' }} disabled={busy} onClick={deleteLead}>Удалить</button>
          <button className="sec" onClick={() => !busy && onClose()}>Закрыть</button>
          <button className="em3d" disabled={busy} onClick={createDeal}>{busy ? 'Создаём…' : 'Создать сделку'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- D6 Deals pipeline ---------------- */
function fmtMln(n: number): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} млн`;
  return fmtPrice(n);
}
function DealsView({ lang, showToast }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'negotiation' | 'docs' | 'closed'>('all');
  const [newOpen, setNewOpen] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/agent/deals', { credentials: 'include' }); if (r.ok) { const d = await r.json(); setItems(d.deals || []); } } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = async (d: any, body: any) => {
    setItems((prev) => prev.map((x) => x.id === d.id ? { ...x, ...body } : x));
    try { await fetch(`/api/agent/deals/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) }); showToast(true, 'Сделка обновлена'); load(); } catch { load(); }
  };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const open = items.filter((d) => d.status === 'open');
  const wonMonth = items.filter((d) => d.status === 'won' && d.closed_at && new Date(d.closed_at) >= monthStart);
  const turnover = wonMonth.reduce((s, d) => s + (d.value || 0), 0);

  const matches = (d: any) => filter === 'all' ? true
    : filter === 'negotiation' ? d.stage === 'negotiation'
    : filter === 'docs' ? ['offer', 'contract'].includes(d.stage)
    : (d.status === 'won' || d.stage === 'closed');
  const list = items.filter(matches);

  return (
    <>
      <div className="bhd"><div><h1>Сделки</h1><div className="sub">{open.length} в работе · {wonMonth.length} закрыта в этом месяце</div></div><button className="cta" onClick={() => setNewOpen(true)}>Новая сделка</button></div>
      <div className="mrow" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="mtile"><b>{open.length}</b><div className="lbl">В работе</div></div>
        <div className="mtile"><b>{wonMonth.length}</b><div className="lbl">Закрыто за месяц</div></div>
        <div className="mtile"><b>{fmtMln(turnover)}</b><div className="lbl">Оборот за месяц</div></div>
      </div>
      <div className="chips">
        <span className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Все</span>
        <span className={`chip${filter === 'negotiation' ? ' active' : ''}`} onClick={() => setFilter('negotiation')}>Переговоры</span>
        <span className={`chip${filter === 'docs' ? ' active' : ''}`} onClick={() => setFilter('docs')}>Документы</span>
        <span className={`chip${filter === 'closed' ? ' active' : ''}`} onClick={() => setFilter('closed')}>Закрытые</span>
      </div>
      {loading ? <div className="fspin" /> : list.length === 0 ? <div className="empty"><h3>Нет сделок</h3><p>Создайте сделку из карточки клиента («Открыть» → «Создать сделку»).</p></div> :
        list.map((d) => {
          const title = loc(d.property?.title, lang) || d.title || d.client_name || 'Сделка';
          const place = loc(d.property?.district, lang);
          const kind = d.property?.dealType ? (String(d.property.dealType).includes('rental') ? 'аренда' : 'покупка') : '';
          const badge = d.status === 'won' ? { c: 'ok', t: 'Закрыта' } : d.status === 'lost' ? { c: 'rej', t: 'Потеряна' } : { c: 'pend', t: DEAL_STAGE[d.stage] || d.stage };
          return (
            <div key={d.id} className="lrow">
              <div className="th" style={{ backgroundImage: `url('${d.property?.imageUrl || d.property?.images?.[0] || ''}')` }} />
              <div className="ti"><b>{[title, place].filter(Boolean).join(' · ')}</b><div className="mt">Клиент: {d.client_name || 'клиент'}{kind ? ` · ${kind}` : ''}</div></div>
              <span className={`stat ${badge.c}`}>{badge.t}</span>
              <div className="pr" style={{ textAlign: 'right' }}>{fmtPrice(d.value)}<div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>{d.commission ? `комиссия ${fmtPrice(d.commission)}` : ''}</div></div>
              {d.status === 'open' && (
                <div className="lact">
                  <div className="inp" style={{ padding: '6px 10px' }}>
                    <select value={d.stage} onChange={(e) => patch(d, { stage: e.target.value })}>
                      {Object.entries(DEAL_STAGE).filter(([k]) => !['closed', 'lost'].includes(k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <button className="em3d" onClick={() => patch(d, { status: 'won', stage: 'closed' })}>Успех</button>
                  <button className="sec danger" onClick={() => patch(d, { status: 'lost' })}>Потеря</button>
                </div>
              )}
            </div>
          );
        })}
      {newOpen && <NewDealModal onClose={() => setNewOpen(false)} onDone={() => { setNewOpen(false); load(); showToast(true, 'Сделка создана'); }} showToast={showToast} />}
    </>
  );
}

function NewDealModal({ onClose, onDone, showToast }: any) {
  const [f, setF] = useState<any>({ title: '', clientName: '', value: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const submit = async () => {
    if (!f.title.trim()) { showToast(false, 'Укажите название сделки'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/agent/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ title: f.title.trim(), clientName: f.clientName.trim() || null, value: f.value ? Number(f.value) : null }),
      });
      if (!r.ok) { showToast(false, 'Не удалось создать сделку'); return; }
      onDone();
    } catch { showToast(false, 'Ошибка сети'); } finally { setBusy(false); }
  };
  return (
    <div className="mback" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Новая сделка</h3>
        <div className="field"><label>Название</label><div className="inp"><input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="2-комн Кентрон · Аветисян" /></div></div>
        <div className="frm2">
          <div className="field"><label>Клиент</label><div className="inp"><input value={f.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Имя клиента" /></div></div>
          <div className="field"><label>Сумма, AMD</label><div className="inp"><input type="number" value={f.value} onChange={(e) => set('value', e.target.value)} placeholder="35000000" /></div></div>
        </div>
        <div className="mact"><button className="sec" onClick={() => !busy && onClose()}>Отмена</button><button className="em3d" disabled={busy} onClick={submit}>{busy ? 'Создаём…' : 'Создать'}</button></div>
      </div>
    </div>
  );
}
