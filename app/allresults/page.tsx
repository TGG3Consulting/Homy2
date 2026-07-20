'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useT, loc } from '@/lib/i18n';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import SupportFab from '@/components/homy/SupportFab';
import CardActions from '@/components/homy/CardActions';
import PropertyDetailView from '@/components/homy/PropertyDetailView';
import { CATALOG_CSS } from '@/components/homy/catalogStyles';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { PropertyShowcase } from '@/lib/types';

const RING_C = 2 * Math.PI * 18; // r=18 → 113.1

function fmtPrice(p: number): string {
  if (!p) return '—';
  return Math.round(p).toLocaleString('ru-RU').replace(/,/g, ' ');
}
function specsLine(p: PropertyShowcase): string {
  const rooms = p.rooms || p.bedrooms;
  const beds = rooms ? `${rooms} ${rooms === 1 ? 'спальня' : 'спальни'}` : 'студия';
  const area = p.area ?? p.size_sqm;
  const parts = [beds];
  if (area) parts.push(`${area} м²`);
  if (p.floor) parts.push(`этаж ${p.floor}${p.totalFloors ? `/${p.totalFloors}` : ''}`);
  return parts.join(' · ');
}

function CatalogRing({ score }: { score: number }) {
  const off = (RING_C * (1 - (score || 0) / 100)).toFixed(1);
  return (
    <div className="mr">
      <svg width="40" height="40">
        <circle cx="20" cy="20" r="18" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.3)" strokeWidth="2.5" />
        <circle cx="20" cy="20" r="18" fill="none" stroke="#2BC091" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={RING_C.toFixed(1)} strokeDashoffset={off} />
      </svg>
      <b>{score || '—'}</b>
    </div>
  );
}

function AllResultsInner() {
  const { t, lang } = useT();
  const searchParams = useSearchParams();
  const router = useRouter();

  const PAGE_SIZE = 50;
  const [properties, setProperties] = useState<PropertyShowcase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Fetch a page. append=false replaces (new filters / first load), append=true
  // adds the next page. Uses a STABLE sort (listing_date) so the whole catalogue
  // is reachable via "Показать ещё" and `total` is the true DB count — unlike
  // match_score, which is AI-ranked and capped for denial-of-wallet protection.
  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      ['min_price', 'max_price', 'min_rooms', 'max_rooms', 'district', 'property_type', 'deal_type', 'has_school_nearby', 'pets_allowed', 'has_parking'].forEach((k) => {
        const v = searchParams.get(k);
        if (v) params.set(k, v);
      });
      params.set('limit', String(PAGE_SIZE));
      params.set('page', String(pageNum));
      params.set('sort_by', 'listing_date');
      params.set('sort_order', 'desc');
      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error('Не удалось загрузить объекты');
      const data = await res.json();
      const items: PropertyShowcase[] = data.properties || [];
      setProperties((prev) => (append ? [...prev, ...items] : items));
      setTotal(data.total ?? items.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить объекты');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [searchParams]);

  // Reset to page 1 whenever the filters change.
  useEffect(() => { setPage(1); fetchPage(1, false); }, [fetchPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  };
  const hasMore = properties.length < total;

  // filter chips derived from search params (faithful to A8 mockup)
  const chips: { label: string; active: boolean }[] = [];
  const dealType = searchParams.get('deal_type');
  chips.push({ label: 'Аренда', active: dealType === 'long_term_rental' || dealType === 'short_term_rental' });
  chips.push({ label: 'Купить', active: dealType === 'sale' });
  const district = searchParams.get('district');
  if (district) chips.push({ label: loc(district, lang), active: true });
  const maxPrice = searchParams.get('max_price');
  if (maxPrice) chips.push({ label: `до ${fmtPrice(Number(maxPrice))}`, active: true });
  const minRooms = searchParams.get('min_rooms');
  if (minRooms) chips.push({ label: `${minRooms}+ спальни`, active: true });

  return (
    <div className="homy-catalog">
      <style dangerouslySetInnerHTML={{ __html: CATALOG_CSS }} />

      <div className="wnav">
        <button className="bk" onClick={() => router.push('/')}><ArrowLeft size={16} /> {t('common.newSearch') || 'Новый поиск'}</button>
        <div className="sp" />
        <HomyLogoMenu align="right" />
      </div>

      <div className="wrap">
        {/* filter chips + count */}
        <div className="filters">
          {chips.map((c, i) => (
            <span key={i} className={`chip${c.active ? ' active' : ''}`}>{c.label}</span>
          ))}
          <span className="count"><ShieldCheck size={14} />{total} объектов · проверено Homy</span>
        </div>

        {/* loading skeletons */}
        {isLoading && (
          <div className="grid3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div className="sk" key={i}>
                <div className="skph" />
                <div className="skb"><div className="skl" style={{ width: '40%' }} /><div className="skl" style={{ width: '80%' }} /><div className="skl" style={{ width: '60%' }} /></div>
              </div>
            ))}
          </div>
        )}

        {/* error */}
        {error && !isLoading && (
          <div className="cstate">
            <div className="ct2">{error}</div>
            <button className="cbtn" onClick={() => fetchPage(1, false)}>Повторить</button>
          </div>
        )}

        {/* empty */}
        {!isLoading && !error && properties.length === 0 && (
          <div className="cstate">
            <div className="ct2">По вашим критериям объектов не найдено.</div>
            <button className="cbtn" onClick={() => router.push('/')}>Начать новый поиск</button>
          </div>
        )}

        {/* grid */}
        {!isLoading && !error && properties.length > 0 && (
          <div className="grid3">
            {properties.map((p) => {
              const image = (p as any).image_url || (p as any).imageUrl || (p.images && p.images[0]) || '';
              const isRental = p.price < 3_000_000;
              return (
                <div key={p.id} className="card" onClick={() => setDetailId(p.id)}>
                  <div className="ph" style={{ backgroundImage: `url('${image}')` }}>
                    {p.is_top_choice && <span className="badge">Топ-выбор</span>}
                    <CatalogRing score={p.match_score || 0} />
                    <CardActions id={p.id} score={p.match_score || 0} />
                  </div>
                  <div className="b">
                    <div className="cp">{fmtPrice(p.price)}<span>{p.currency || 'AMD'}{isRental ? '/мес' : ''}</span></div>
                    <div className="ct">{loc(p.title || p.name, lang)}</div>
                    <div className="cl">{[loc(p.address, lang), loc(p.district, lang)].filter(Boolean).join(' · ')}</div>
                    <div className="cs">{specsLine(p)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* load more */}
        {!isLoading && !error && hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <button className="cbtn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Загрузка…' : `Показать ещё (${total - properties.length})`}
            </button>
          </div>
        )}
      </div>

      <SupportFab />
      {detailId && <PropertyDetailView propertyId={detailId} mode="popup" onClose={() => setDetailId(null)} />}
    </div>
  );
}

export default function AllResultsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <FavoritesProvider>
        <AllResultsInner />
      </FavoritesProvider>
    </Suspense>
  );
}
