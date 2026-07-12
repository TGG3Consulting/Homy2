'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/components/homy/ThemeProvider';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import SupportFab from '@/components/homy/SupportFab';
import { DASHBOARD_CSS } from '@/components/homy/dashboardStyles';
import FavoritesTab from '@/components/homy/FavoritesTab';
import ViewingsTab from '@/components/homy/ViewingsTab';
import UserSettings from '@/components/dashboard/UserSettings';
import RecommendedProperties from '@/components/dashboard/RecommendedProperties';
import SavedSearchesTab from '@/components/homy/SavedSearchesTab';
import { ChatPanel } from '@/components/Chat';

const RING_C = 2 * Math.PI * 15; // r=15 → 94.2

function fmtPrice(p: number): string { return p ? Math.round(p).toLocaleString('ru-RU').replace(/,/g, ' ') : '—'; }
function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) { try { const o = JSON.parse(s); return o[lang] || o.ru || o.en || s; } catch { return v; } }
  return v;
}

const TABS = [
  { id: 'overview', label: 'Обзор' },
  { id: 'favorites', label: 'Избранное' },
  { id: 'searches', label: 'Поиски' },
  { id: 'viewings', label: 'Просмотры' },
  { id: 'recommendations', label: 'Рекомендации' },
  { id: 'messages', label: 'Сообщения' },
  { id: 'settings', label: 'Настройки' },
];

export default function BuyerDashboard({ user }: { user: any }) {
  const { lang } = useT();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  const [stats, setStats] = useState<any>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [dRes, sRes, rRes] = await Promise.all([
          fetch('/api/users/me/dashboard', { credentials: 'include' }),
          fetch('/api/users/me/saved-searches', { credentials: 'include' }),
          fetch('/api/users/me/recommendations', { credentials: 'include' }),
        ]);
        if (!alive) return;
        if (dRes.ok) setStats(await dRes.json());
        if (sRes.ok) { const sd = await sRes.json(); setSaved(sd.searches || sd.savedSearches || sd || []); }
        if (rRes.ok) { const rd = await rRes.json(); setRecs(rd.properties || rd.recommendations || rd || []); }
      } catch {}
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const goTab = useCallback((id: string) => {
    router.push(id === 'overview' ? '/dashboard' : `/dashboard?tab=${id}`, { scroll: false });
  }, [router]);

  const firstName = user?.first_name || (user?.name ? String(user.name).split(' ')[0] : '') || '';
  const favCount = stats?.favorites_count ?? 0;
  const viewCount = stats?.viewings_scheduled ?? 0;
  const savedCount = saved.length;
  const bestMatch = recs.reduce((m, r) => Math.max(m, r.match_score || r.matchScore || 0), 0);
  const latest = saved[0];

  const renderOverview = () => (
    <div className="dash">
      <h2>С возвращением{firstName ? `, ${firstName}` : ''}</h2>
      <p className="lead">{recs.length ? `Homy подобрал ${recs.length} ${recs.length === 1 ? 'вариант' : recs.length < 5 ? 'варианта' : 'вариантов'} по вашим поискам.` : 'Начните поиск — Homy подберёт объекты по фактам.'}</p>

      <div className="dstats">
        <div className="dstat"><b>{favCount}</b><span>в избранном</span></div>
        <div className="dstat"><b>{savedCount}</b><span>сохранённых поиска</span></div>
        <div className="dstat"><b>{viewCount}</b><span>просмотра</span></div>
        <div className="dstat"><b>{bestMatch ? `${bestMatch}%` : '—'}</b><span>лучший match</span></div>
      </div>

      {latest && (
        <div className="dsec">
          <div className="sh"><h3>Продолжить поиск</h3><a onClick={() => goTab('searches')}>Все поиски →</a></div>
          <div className="resume">
            <div className="ava"><svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg></div>
            <div className="rinfo">
              <b>{loc(latest.name || latest.query, lang) || 'Ваш поиск'}</b>
              <span>{(latest.criteriaChips || []).map((c: any) => loc(c, lang)).join(' · ') || loc(latest.query, lang)}{latest.properties?.length ? ` · ${latest.properties.length} совпадений` : ''}</span>
            </div>
            <button className="open" onClick={() => router.push(`/results?query=${encodeURIComponent(loc(latest.query, lang) || '')}&saved=${latest.id}`)}><span>Открыть</span></button>
          </div>
        </div>
      )}

      <div className="dsec">
        <div className="sh"><h3>Рекомендации Homy</h3><a onClick={() => goTab('searches')}>Ещё →</a></div>
        {recs.length === 0 ? (
          <div className="resume"><div className="rinfo"><b>Пока нет рекомендаций</b><span>Опишите, что ищете — Homy подберёт варианты.</span></div><button className="open" onClick={() => router.push('/')}><span>Искать</span></button></div>
        ) : (
          <div className="dgrid">
            {recs.slice(0, 6).map((p: any) => {
              const score = p.match_score || p.matchScore || 0;
              const off = (RING_C * (1 - score / 100)).toFixed(1);
              const image = p.image_url || p.imageUrl || (p.images && p.images[0]) || '';
              const isRental = (p.price || 0) < 3_000_000;
              return (
                <div key={p.id} className="card" onClick={() => router.push(`/properties/${p.id}`)}>
                  <div className="ph" style={{ backgroundImage: `url('${image}')` }}>
                    <div className="mr">
                      <svg width="36" height="36"><circle cx="18" cy="18" r="15" fill="rgba(0,0,0,.4)" stroke="rgba(255,255,255,.3)" strokeWidth="2.5" /><circle cx="18" cy="18" r="15" fill="none" stroke="#2BC091" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={RING_C.toFixed(1)} strokeDashoffset={off} /></svg>
                      <b>{score || '—'}</b>
                    </div>
                  </div>
                  <div className="b">
                    <div className="cp">{fmtPrice(p.price)}<span>{(p.currency || 'AMD')}{isRental ? '/мес' : ''}</span></div>
                    <div className="ct">{loc(p.title || p.name, lang)}</div>
                    <div className="cl">{[loc(p.address, lang), loc(p.district || p.neighborhood, lang)].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderTab = () => {
    switch (tab) {
      case 'favorites': return <div className="tabwrap"><FavoritesTab /></div>;
      case 'searches': return <div className="tabwrap"><SavedSearchesTab /></div>;
      case 'viewings': return <div className="tabwrap"><ViewingsTab /></div>;
      case 'recommendations': return <div className="tabwrap"><RecommendedProperties /></div>;
      case 'settings': return <div className="tabwrap"><UserSettings /></div>;
      case 'messages': return <div className="tabwrap"><div style={{ height: 'calc(100vh - 220px)', minHeight: 460 }}><ChatPanel mode="property" showHeader={false} /></div></div>;
      default: return renderOverview();
    }
  };

  return (
    <div className="homy-dash">
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />
      <div className="wnav">
        <HomyLogoMenu align="left" />
        <div className="sp" />
        <div className="themebtn">
          <button className={`o${theme === 'light' ? ' on' : ''}`} onClick={() => setTheme('light')} title="Светлая">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5" /></svg>
          </button>
          <button className={`o${theme === 'dark' ? ' on' : ''}`} onClick={() => setTheme('dark')} title="Тёмная">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tt) => {
          const cnt = tt.id === 'favorites' ? favCount : tt.id === 'searches' ? savedCount : tt.id === 'viewings' ? viewCount : 0;
          return (
            <button key={tt.id} className={`tb${tab === tt.id ? ' on' : ''}`} onClick={() => goTab(tt.id)}>
              {tt.label}{cnt > 0 ? <span className="cnt">{cnt}</span> : null}
            </button>
          );
        })}
      </div>

      {loading && tab === 'overview' ? <div className="dstate"><div className="dspin" /></div> : renderTab()}

      <SupportFab />
    </div>
  );
}
