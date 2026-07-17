'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { useT } from '@/lib/i18n';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import SupportFab from '@/components/homy/SupportFab';
import { SCHEDULE_CSS } from '@/components/homy/scheduleStyles';

const MONTHS_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DOW_RU = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

function fmtPrice(p: number): string { return p ? Math.round(p).toLocaleString('ru-RU').replace(/,/g, ' ') : '—'; }
function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) { try { const o = JSON.parse(s); return o[lang] || o.ru || o.en || s; } catch { return v; } }
  return v;
}
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

interface Slot { time: string; scheduled_at: string; dateObj: Date }

function ScheduleInner() {
  const { lang } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [property, setProperty] = useState<any>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selKey, setSelKey] = useState<string | null>(null);
  const [selSlot, setSelSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState<Slot | null>(null);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const pRes = await fetch(`/api/properties/${propertyId}`);
        if (pRes.ok) { const d = await pRes.json(); if (alive) setProperty(d.property || d); }
        // Client-request model (1.6): the visitor proposes a PREFERRED time; the
        // agent then confirms it or offers an alternative. There are no pre-set
        // "available slots" on the server — we present a rolling set of reasonable
        // request options (next 7 days × standard hours) to pick from.
        const parsed: Slot[] = [];
        const times = ['10:00', '11:30', '12:30', '14:00', '15:30', '17:00'];
        const base = new Date(); base.setHours(0, 0, 0, 0);
        for (let day = 1; day <= 7; day++) {
          const d0 = new Date(base); d0.setDate(base.getDate() + day);
          if (d0.getDay() === 0) continue; // skip Sunday
          for (const t of times) {
            const [h, m] = t.split(':').map(Number);
            const dt = new Date(d0); dt.setHours(h, m, 0, 0);
            parsed.push({ time: t, scheduled_at: dt.toISOString(), dateObj: dt });
          }
        }
        if (!alive) return;
        setSlots(parsed);
        if (parsed.length) {
          const first = parsed.reduce((a, b) => (b.dateObj < a.dateObj ? b : a));
          setViewMonth(new Date(first.dateObj.getFullYear(), first.dateObj.getMonth(), 1));
          setSelKey(dayKey(first.dateObj));
        }
        setLoading(false);
      } catch { if (alive) { setError('Не удалось загрузить слоты'); setLoading(false); } }
    })();
    return () => { alive = false; };
  }, [propertyId]);

  const slotsByDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    slots.forEach((s) => { const k = dayKey(s.dateObj); if (!m.has(k)) m.set(k, []); m.get(k)!.push(s); });
    return m;
  }, [slots]);

  const daySlots = selKey ? (slotsByDay.get(selKey) || []) : [];

  // build calendar cells for viewMonth (Mon-first)
  const cells = useMemo(() => {
    const y = viewMonth.getFullYear(), mo = viewMonth.getMonth();
    const first = new Date(y, mo, 1);
    const offset = (first.getDay() + 6) % 7; // Mon=0
    const dim = new Date(y, mo + 1, 0).getDate();
    const arr: { d: number; inMonth: boolean; date: Date }[] = [];
    for (let i = 0; i < offset; i++) { const dd = new Date(y, mo, 1 - (offset - i)); arr.push({ d: dd.getDate(), inMonth: false, date: dd }); }
    for (let d = 1; d <= dim; d++) arr.push({ d, inMonth: true, date: new Date(y, mo, d) });
    while (arr.length % 7 !== 0) { const last = arr[arr.length - 1].date; const dd = new Date(last); dd.setDate(last.getDate() + 1); arr.push({ d: dd.getDate(), inMonth: false, date: dd }); }
    return arr;
  }, [viewMonth]);

  const selDateObj = selKey ? daySlots[0]?.dateObj : null;

  const book = async () => {
    if (!selSlot || !propertyId) return;
    setBooking(true);
    try {
      // Canonical viewing-creation endpoint (3.2): /api/viewings handles the
      // client request (no clientEmail/clientId → client-created, status pending_agent).
      const res = await fetch('/api/viewings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ propertyId, scheduledAt: selSlot.scheduled_at, message: `Просмотр на ${selSlot.dateObj.getDate()} ${MONTHS_GEN[selSlot.dateObj.getMonth()]} в ${selSlot.time}` }),
      });
      if (!res.ok) throw new Error();
      setSuccess(selSlot);
    } catch { setError('Не удалось записаться. Попробуйте ещё раз.'); }
    finally { setBooking(false); }
  };

  const addToCalendar = () => {
    if (!success) return;
    const start = success.dateObj;
    const end = new Date(start.getTime() + 30 * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = encodeURIComponent(`Просмотр: ${loc(property?.title || property?.name, lang) || 'объект Homy'}`);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}`;
    window.open(url, '_blank', 'noopener');
  };

  const title = loc(property?.title || property?.name, lang);
  const address = [loc(property?.address, lang), loc(property?.district || property?.neighborhood, lang)].filter(Boolean).join(' · ');
  const image = property?.imageUrl || property?.image_url || property?.images?.[0] || '';
  const dowLabel = selDateObj ? `${DOW_RU[(selDateObj.getDay() + 6) % 7]}, ${selDateObj.getDate()} ${MONTHS_GEN[selDateObj.getMonth()]}` : '';

  return (
    <div className="homy-schedule">
      <style dangerouslySetInnerHTML={{ __html: SCHEDULE_CSS }} />
      <div className="wnav">
        <button className="bk" onClick={() => router.back()}><ArrowLeft size={16} /> Назад</button>
        <div className="sp" />
        <HomyLogoMenu align="right" />
      </div>

      {!propertyId ? (
        <div className="wrap"><div className="sstate"><div>Объект не выбран.</div><button className="cbtn" onClick={() => router.push('/allresults')}>Перейти к объектам</button></div></div>
      ) : loading ? (
        <div className="wrap"><div className="sstate"><div className="sspin" /></div></div>
      ) : (
        <div className="wrap">
          <div className="left">
            <h2>Записаться на просмотр</h2>
            <div className="sub">{[title, address].filter(Boolean).join(' · ') || 'Объект Homy'}</div>

            <div className="row">
              <div className="col">
                <div className="cal">
                  <div className="cm">
                    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}>‹</button>
                    <b>{MONTHS_NOM[viewMonth.getMonth()]} {viewMonth.getFullYear()}</b>
                    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}>›</button>
                  </div>
                  <div className="grid">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => <span className="dow" key={d}>{d}</span>)}
                    {cells.map((c, i) => {
                      const k = dayKey(c.date);
                      const has = c.inMonth && slotsByDay.has(k);
                      const isSel = k === selKey;
                      return (
                        <button
                          key={i}
                          className={`d${!has ? ' mut' : ''}${isSel ? ' sel' : ''}`}
                          disabled={!has}
                          onClick={() => { setSelKey(k); setSelSlot(null); }}
                        >{c.d}</button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="tlabel">Время{dowLabel ? ` · ${dowLabel}` : ''}</div>
                <div className="slots">
                  {daySlots.map((s) => (
                    <button key={s.scheduled_at} className={`slot${selSlot?.scheduled_at === s.scheduled_at ? ' sel' : ''}`} onClick={() => setSelSlot(s)}>{s.time}</button>
                  ))}
                </div>
                <button className="book" disabled={!selSlot || booking} onClick={book}><span>{booking ? 'Записываем…' : 'Записаться на просмотр'}</span></button>
                {error && <div className="hint" style={{ color: '#D8434B' }}>{error}</div>}
                <div className="hint">Homy согласует с агентом и пришлёт подтверждение</div>
              </div>
            </div>
          </div>

          <div className="side">
            <div className="panel">
              {success ? (
                <div className="success">
                  <div className="ic"><Check size={26} color="#fff" strokeWidth={2.4} /></div>
                  <h3>Заявка отправлена</h3>
                  <p>{DOW_RU[(success.dateObj.getDay() + 6) % 7]}, {success.dateObj.getDate()} {MONTHS_GEN[success.dateObj.getMonth()]}, {success.time}<br />Homy отправил запрос агенту. Он подтвердит время или предложит другое.</p>
                  <button className="btn-sec" onClick={addToCalendar}>Добавить в календарь</button>
                </div>
              ) : (
                <>
                  {image && <div className="sumph" style={{ backgroundImage: `url('${image}')` }} />}
                  <div className="sump">{fmtPrice(property?.price)}<span>{property?.currency || 'AMD'}</span></div>
                  <div className="sumt">{title || 'Объект'}</div>
                  <div className="suml">{address}</div>
                  <div className="sumv"><ShieldCheck size={14} /> Проверено Homy</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <SupportFab />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <ScheduleInner />
    </Suspense>
  );
}
