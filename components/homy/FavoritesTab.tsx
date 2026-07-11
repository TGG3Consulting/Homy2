'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';

/** 1:1 A9 «Избранное» styles from Homy-Batch2 mockup. Scoped under .homy-fav. */
const FAV_CSS = `
.homy-fav{--bg:#EEF0F3;--surface:#FFFFFF;--surface2:#F4F6F8;--ink:#14181F;--muted:#6A7382;--soft:#39414D;--hair:rgba(20,24,31,.10);--em-hi:#26B083;--em:#0A6045;--card-shadow:0 4px 24px rgba(20,20,26,.08);color:var(--ink);font-family:'Montserrat',sans-serif}
html.dark .homy-fav{--bg:#080A0E;--surface:#0E1218;--surface2:#171C25;--ink:#F2F4F7;--muted:#8B93A3;--soft:#C5CAD3;--hair:rgba(255,255,255,.10);--em-hi:#2BC091;--em:#0B6E4F;--card-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 60px rgba(0,0,0,.45)}
.homy-fav *{box-sizing:border-box}
.homy-fav .hd{display:flex;align-items:center;gap:12px;padding-bottom:18px;border-bottom:1px solid var(--hair);margin-bottom:20px}
.homy-fav .hd h2{font-size:20px;font-weight:800;letter-spacing:-.02em}
.homy-fav .hd .n{font-size:12px;color:var(--muted)}
.homy-fav .chips{margin-left:auto;display:flex;gap:8px}
.homy-fav .chip{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid var(--hair);background:var(--surface);color:var(--soft);cursor:pointer;font-family:inherit}
.homy-fav .chip.active{color:#fff;border-color:transparent;background:radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))}
.homy-fav .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:900px){.homy-fav .grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.homy-fav .grid{grid-template-columns:1fr}}
.homy-fav .card{background:var(--surface);border:1px solid var(--hair);border-radius:16px;overflow:hidden;box-shadow:var(--card-shadow);cursor:pointer;transition:transform .18s}
.homy-fav .card:hover{transform:translateY(-3px)}
.homy-fav .card .ph{position:relative;aspect-ratio:16/11;background-size:cover;background-position:center;background-color:var(--surface2)}
.homy-fav .card .ph .heart{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:10px;background:rgba(10,13,18,.5);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;border:1px solid rgba(255,255,255,.15)}
.homy-fav .card .ph .heart:hover{background:rgba(10,13,18,.7)}
.homy-fav .card .ph .ring{position:absolute;top:12px;left:12px;width:38px;height:38px}
.homy-fav .card .ph .ring svg{transform:rotate(-90deg)}
.homy-fav .card .ph .ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}
.homy-fav .card .b{padding:14px}
.homy-fav .card .cp{font-size:19px;font-weight:700;letter-spacing:-.02em}
.homy-fav .card .cp span{font-size:11px;color:var(--muted);font-weight:500;margin-left:5px}
.homy-fav .card .ct{font-size:14px;font-weight:600;margin-top:6px}
.homy-fav .card .cl{font-size:12px;color:var(--muted);margin-top:3px}
.homy-fav .card .cs{font-size:12px;color:var(--soft);margin-top:9px}
.homy-fav .empty{text-align:center;padding:60px 20px}
.homy-fav .empty .ec{width:60px;height:60px;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--em) 12%,transparent);color:var(--em)}
.homy-fav .empty h3{font-size:16px;font-weight:700}
.homy-fav .empty p{font-size:13px;color:var(--muted);margin-top:6px}
.homy-fav .empty .go{margin-top:16px;background:none;border:0;color:var(--em);font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
.homy-fav .fspin{width:34px;height:34px;border-radius:50%;border:3px solid var(--hair);border-top-color:var(--em);animation:homyfspin .9s linear infinite;margin:60px auto}
@keyframes homyfspin{to{transform:rotate(360deg)}}
`;

const RING_C = 2 * Math.PI * 15;

function fmtPrice(p: number): string { return p ? Math.round(p).toLocaleString('ru-RU').replace(/,/g, ' ') : '—'; }
function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) { try { const o = JSON.parse(s); return o[lang] || o.ru || o.en || s; } catch { return v; } }
  return v;
}
function objWord(n: number): string {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return 'объект';
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 'объекта';
  return 'объектов';
}
function isRental(dt?: string): boolean { return !!dt && dt.includes('rental'); }

type Filter = 'all' | 'rent' | 'sale';

export default function FavoritesTab() {
  const { lang } = useT();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    try {
      const r = await fetch('/api/users/me/favorites', { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        setItems(Array.isArray(d.favorites) ? d.favorites : (d.properties || []));
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const remove = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemoving((s) => new Set(s).add(id));
    // optimistic
    setItems((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch('/api/users/me/favorites', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ propertyId: id }),
      });
    } catch {
      fetchFavorites(); // rollback via refetch
    } finally {
      setRemoving((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }, [fetchFavorites]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((p) => filter === 'rent' ? isRental(p.deal_type) : !isRental(p.deal_type));
  }, [items, filter]);

  return (
    <div className="homy-fav">
      <style dangerouslySetInnerHTML={{ __html: FAV_CSS }} />

      <div className="hd">
        <h2>Избранное</h2>
        <span className="n">{items.length} {objWord(items.length)}</span>
        <div className="chips">
          <span className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Все</span>
          <span className={`chip${filter === 'rent' ? ' active' : ''}`} onClick={() => setFilter('rent')}>Аренда</span>
          <span className={`chip${filter === 'sale' ? ' active' : ''}`} onClick={() => setFilter('sale')}>Покупка</span>
        </div>
      </div>

      {loading ? (
        <div className="fspin" />
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="ec"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" /></svg></div>
          <h3>{items.length === 0 ? 'Пока нет избранного' : 'Ничего не найдено'}</h3>
          <p>{items.length === 0 ? 'Отмечайте объекты сердечком — они появятся здесь.' : 'Смените фильтр, чтобы увидеть объекты.'}</p>
          {items.length === 0 && <button className="go" onClick={() => router.push('/')}>Начать поиск →</button>}
        </div>
      ) : (
        <div className="grid">
          {filtered.map((p) => {
            const score = p.match_score || p.matchScore || 0;
            const off = (RING_C * (1 - score / 100)).toFixed(1);
            const img = p.image_url || p.imageUrl || (p.images && p.images[0]) || '';
            const rental = isRental(p.deal_type);
            const beds = (p.rooms || p.bedrooms) ? `${p.rooms || p.bedrooms} сп` : 'студия';
            const area = p.size_sqm || p.area;
            const fl = p.floor ? `этаж ${p.floor}${p.total_floors || p.totalFloors ? `/${p.total_floors || p.totalFloors}` : ''}` : '';
            const cs = [beds, area ? `${area} м²` : '', fl].filter(Boolean).join(' · ');
            const place = [loc(p.address, lang), loc(p.district || p.neighborhood, lang)].filter(Boolean).join(' · ');
            return (
              <div key={p.id} className="card" onClick={() => router.push(`/properties/${p.id}`)}>
                <div className="ph" style={{ backgroundImage: `url('${img}')` }}>
                  <div className="ring">
                    <svg width="38" height="38"><circle cx="19" cy="19" r="15" fill="rgba(0,0,0,.4)" stroke="rgba(255,255,255,.3)" strokeWidth="2.5" /><circle cx="19" cy="19" r="15" fill="none" stroke="#2BC091" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={RING_C.toFixed(1)} strokeDashoffset={off} /></svg>
                    <b>{score || '—'}</b>
                  </div>
                  <div className="heart" title="Убрать из избранного" onClick={(e) => remove(p.id, e)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#F0616A" stroke="#F0616A"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" /></svg>
                  </div>
                </div>
                <div className="b">
                  <div className="cp">{fmtPrice(p.price)}<span>{(p.currency || 'AMD')}{rental ? '/мес' : ''}</span></div>
                  <div className="ct">{loc(p.title || p.name, lang)}</div>
                  <div className="cl">{place}</div>
                  {cs && <div className="cs">{cs}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
