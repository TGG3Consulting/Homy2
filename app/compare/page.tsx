'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useCompare } from '@/lib/contexts/CompareContext';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import SupportFab from '@/components/homy/SupportFab';
import { COMPARE_CSS } from '@/components/homy/compareStyles';

function fmtPrice(p: number): string {
  if (!p) return '—';
  return Math.round(p).toLocaleString('ru-RU').replace(/,/g, ' ');
}
function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) {
    try { const o = JSON.parse(s); return o[lang] || o.ru || o.en || s; } catch { return v; }
  }
  return v;
}

interface CmpProp {
  id: string; title: string; district: string; address: string; image: string;
  price: number; currency: string; rooms: number; area: number; match: number;
  developerVerified?: boolean; parking?: string; transport?: string; schools?: string;
}

export default function ComparePage() {
  const { lang } = useT();
  const router = useRouter();
  const { compareList, isHydrated, removeFromCompare } = useCompare();

  const [items, setItems] = useState<CmpProp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    if (compareList.length === 0) { setItems([]); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    (async () => {
      const results = await Promise.all(compareList.map(async (c) => {
        try {
          const [pRes, iRes] = await Promise.all([
            fetch(`/api/properties/${c.id}`),
            fetch(`/api/properties/${c.id}/intelligence`).catch(() => null as any),
          ]);
          if (!pRes.ok) return null;
          const pd = await pRes.json();
          const raw = pd.property || pd;
          const intel = iRes && iRes.ok ? await iRes.json() : null;
          const area = raw.area || raw.sizeSqm || raw.size_sqm || 0;
          const rooms = raw.rooms || raw.bedrooms || 0;
          const image = raw.imageUrl || raw.image_url || raw.images?.[0] || '';
          return {
            id: c.id,
            title: loc(raw.title || raw.name, lang),
            district: loc(raw.district || raw.neighborhood, lang),
            address: loc(raw.address, lang),
            image,
            price: raw.price || 0,
            currency: raw.currency || 'AMD',
            rooms, area,
            match: c.match_score || raw.matchScore || raw.match_score || 0,
            developerVerified: intel?.legal?.developer_verified ?? raw.contact?.verified,
            parking: intel?.location?.parking_available ?? (raw.hasParking ? 'Available' : 'Limited'),
            transport: intel?.infrastructure?.transport,
            schools: intel?.infrastructure?.schools,
          } as CmpProp;
        } catch { return null; }
      }));
      if (alive) { setItems(results.filter(Boolean) as CmpProp[]); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [compareList, isHydrated, lang]);

  const bestId = items.length ? items.reduce((a, b) => (b.match > a.match ? b : a)).id : null;
  const cheapest = items.length ? items.reduce((a, b) => (b.price && (b.price < a.price || !a.price) ? b : a)) : null;
  const biggest = items.length ? items.reduce((a, b) => ((b.area || 0) > (a.area || 0) ? b : a)) : null;
  const best = items.find((x) => x.id === bestId) || null;

  const rowLabels = ['Цена / мес', 'Match', 'Спальни / м²', 'Застройщик', 'Парковка', 'До школы / метро'];

  return (
    <div className="homy-compare">
      <style dangerouslySetInnerHTML={{ __html: COMPARE_CSS }} />

      <div className="wnav">
        <button className="bk" onClick={() => router.back()}><ArrowLeft size={16} /> Назад</button>
        <div className="sp" />
        <HomyLogoMenu align="right" />
      </div>

      <div className="wrap">
        {!isHydrated || loading ? (
          <div className="cstate"><div className="cspin" /></div>
        ) : items.length === 0 ? (
          <div className="cstate">
            <div className="t">Пока нечего сравнивать</div>
            <div className="s">Добавьте объекты в сравнение (иконка весов на карточке) — до 4 штук, и Homy покажет их бок о бок с честным разбором.</div>
            <button className="cbtn" onClick={() => router.push('/allresults')}>Перейти к объектам</button>
          </div>
        ) : (
          <>
            <div className="hd"><h2>Сравнение объектов</h2><span className="n">{items.length} из 4</span></div>

            <div className="cmphint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6M11 18l-6-6 6-6" /></svg>
              Листайте вправо — все {items.length} {items.length === 1 ? 'объект' : items.length < 5 ? 'объекта' : 'объектов'} · лучшее подсвечено
            </div>

            <div className="cmpscroll">
              <div className="cmp2">
                <div className="labels">
                  {rowLabels.map((l) => <div className="rl" key={l}>{l}</div>)}
                </div>

                {items.map((p) => {
                  const isBest = p.id === bestId;
                  const parkOk = p.parking === 'Available';
                  return (
                    <div key={p.id} className={`ocard${isBest ? ' best' : ''}`}>
                      {isBest && <span className="badge2">Совет Homy</span>}
                      <button className="rm" title="Убрать" onClick={() => removeFromCompare(p.id)}><X size={14} /></button>
                      <div className="photo" style={{ backgroundImage: `url('${p.image}')` }} />
                      <div className="head"><b>{p.title || 'Объект'}</b><span>{[p.address, p.district].filter(Boolean).join(' · ')}</span></div>
                      <div className="r price">{fmtPrice(p.price)}<span>{p.currency}</span></div>
                      <div className="r v-ok">{p.match ? `${p.match}%` : '—'}</div>
                      <div className="r">{p.rooms ? `${p.rooms} · ` : ''}{p.area ? `${p.area} м²` : '—'}</div>
                      <div className={`r ${p.developerVerified ? 'v-ok' : 'v-amber'}`}>{p.developerVerified ? 'проверен' : 'не подтв.'}</div>
                      <div className={`r ${parkOk ? 'v-ok' : 'v-amber'}`}>{parkOk ? 'есть' : 'ограничена'}</div>
                      <div className="r v-mut">{String(p.transport || p.schools || '—')}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="verdict">
              <div className="h">Мнение Homy</div>
              <p>
                {best && <>Лучшее совпадение — <b>{best.title}</b> ({best.match}%). </>}
                {cheapest && <>Самый доступный — <b>{cheapest.title}</b> ({fmtPrice(cheapest.price)} {cheapest.currency}). </>}
                {biggest && biggest.area ? <>Больше всего площади — <b>{biggest.title}</b> ({biggest.area} м²). </> : null}
                Смотрите по своим приоритетам: цена, район или метраж.
              </p>
            </div>
          </>
        )}
      </div>

      <SupportFab />
    </div>
  );
}
