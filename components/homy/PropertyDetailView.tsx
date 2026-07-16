'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { useChatWidget } from '@/contexts/ChatWidgetContext';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import SupportFab from '@/components/homy/SupportFab';
import { PropertyMiniMap } from '@/components/homly';
import PropertyChatPanel from '@/components/homy/PropertyChatPanel';
import ViewingRequestForm from '@/components/homly/ViewingRequestForm';
import VirtualTour from '@/components/homly/VirtualTour';
import { PROPERTY_CSS } from '@/components/homy/propertyStyles';
import { PropertyShowcase } from '@/lib/types';
import { findProvince, findCity, isYerevan, YEREVAN_DISTRICTS, localizeGeo } from '@/lib/geo/armenia';
import {
  ArrowLeft, Check, X, Star, ShieldCheck, Home, Bed, Maximize2, Building,
  Sparkles, AlertTriangle, Loader2, Receipt, MessageSquare, CalendarPlus, Video, Info,
  Building2, Scale, FileCheck, Volume2, Leaf, ParkingCircle, TreePine, Baby,
  GraduationCap, Bus, ShoppingCart, Pill, Landmark, TrendingUp, Coins, LineChart, MapPin,
} from 'lucide-react';

const RING_C = 2 * Math.PI * 22;
// 1.1: honest placeholder for fields we cannot verify from a real source yet.
const NEEDS_SOURCE = 'Источник в подключении';

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
const BUILDING_TYPE_RU: Record<string, string> = { brick: 'кирпичный дом', panel: 'панельный дом', monolith: 'монолит' };
function plur(n: number, forms: [string, string, string]): string {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return forms[0];
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return forms[1];
  return forms[2];
}
function getConversationHistory(): string {
  if (typeof window === 'undefined') return '';
  try {
    const h = sessionStorage.getItem('homy_chat_history') || sessionStorage.getItem('homly_chat_history');
    if (!h) return '';
    const msgs = JSON.parse(h);
    return msgs.filter((m: any) => m.role === 'user').map((m: any) => m.content).slice(-20).join('\n');
  } catch { return ''; }
}

interface ClientContext { query?: string; criteria?: string[]; messages?: { role: string; content: string }[] }

// Build the client's real search context (query + extracted criteria + their chat turns).
// Prefer what the results page passes in; fall back to sessionStorage for legacy/back-nav.
function buildClientText(cc?: ClientContext): string {
  const parts: string[] = [];
  if (cc?.query && cc.query.trim()) parts.push(`Поисковый запрос: ${cc.query.trim()}`);
  if (cc?.criteria && cc.criteria.length) parts.push(`Критерии поиска: ${cc.criteria.join(', ')}`);
  const userMsgs = (cc?.messages || []).filter((m) => m.role === 'user').map((m) => m.content).slice(-20);
  if (userMsgs.length) parts.push('Реплики клиента:\n' + userMsgs.join('\n'));
  const text = parts.join('\n');
  return text.trim() ? text : getConversationHistory();
}

interface Intelligence {
  legal: { developer_verified: boolean; developer_name: string; claims_count: number; double_sale_risk: boolean; ownership_status: string; title_status: string };
  location: { commute_am: string; commute_pm: string; highway_distance: string; noise_level: string; ecology_index: string; parking_available: string; playgrounds_nearby: string; parks_nearby: string };
  infrastructure: { supermarkets: number | string; pharmacies: number | string; banks: number | string; schools: string; transport: string };
  investment: { score: number; price_vs_market: string; demand_signals: number | string; roi_estimate: string; appreciation_forecast: string };
}
interface Opinion { summary: string; reasons: string[]; warning: string | null }
type Tab = 'legal' | 'location' | 'infra' | 'invest';

interface Props { propertyId: string; mode?: 'page' | 'popup'; onClose?: () => void; clientContext?: ClientContext }

export default function PropertyDetailView({ propertyId, mode = 'page', onClose, clientContext }: Props) {
  const router = useRouter();
  const { lang } = useT();
  const { openPropertyChat } = useChatWidget();

  const [property, setProperty] = useState<PropertyShowcase | null>(null);
  const [intel, setIntel] = useState<Intelligence | null>(null);
  const [opinion, setOpinion] = useState<Opinion | null>(null);
  const [opinionLoading, setOpinionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState<Tab>('legal');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasExistingViewing, setHasExistingViewing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [meId, setMeId] = useState<string>('');
  const [intelError, setIntelError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  // nearby
  const [nearby, setNearby] = useState<any | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState(false);
  // reviews
  const [reviews, setReviews] = useState<any | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [showBrokerReview, setShowBrokerReview] = useState(false);

  const close = useCallback(() => { if (onClose) onClose(); else router.back(); }, [onClose, router]);

  useEffect(() => {
    if (mode !== 'popup') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (showTour) setShowTour(false); else close(); } };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [mode, close, showTour]);

  // property
  useEffect(() => {
    if (!propertyId) return;
    let alive = true;
    setLoading(true); setError(null); setActiveImg(0); setTab('legal'); setShowForm(false);
    (async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        if (!res.ok) { if (alive) setError(res.status === 404 ? 'Объект не найден' : 'Не удалось загрузить объект'); return; }
        const data = await res.json();
        const raw = data.property || data;
        const area = raw.area || raw.sizeSqm || raw.size_sqm || 0;
        const rooms = raw.rooms || raw.bedrooms || 0;
        const district = raw.district || raw.neighborhood || '';
        const image = raw.imageUrl || raw.image_url || raw.images?.[0] || '';
        if (!alive) return;
        setProperty({
          id: raw.id, name: raw.title || raw.name || 'Объект', title: raw.title,
          address: raw.address || '', district, neighborhood: district,
          province: raw.province || '', city: raw.city || '',
          price: raw.price || 0, currency: raw.currency || 'AMD',
          area, size_sqm: area, rooms, bedrooms: rooms, bathrooms: raw.bathrooms,
          floor: raw.floor, totalFloors: raw.totalFloors || raw.total_floors,
          year_built: raw.yearBuilt || raw.year_built,
          imageUrl: image, image_url: image,
          images: raw.images && raw.images.length ? raw.images : (image ? [image] : []),
          description: raw.description, condition: raw.condition,
          is_top_choice: raw.isTopChoice || raw.is_top_choice || false,
          recommendation_reasons: raw.recommendationReasons || raw.recommendation_reasons || [],
          warning: raw.warning,
          match_score: raw.matchScore || raw.match_score || 0,
          latitude: raw.latitude || 0, longitude: raw.longitude || 0,
          owner: raw.owner, contact: raw.contact, verified: raw.verified,
          utilities_estimate: raw.utilities_estimate || raw.utilitiesEstimate,
          deposit_months: raw.deposit_months || raw.depositMonths,
          has_virtual_tour: raw.has_virtual_tour || raw.hasVirtualTour || false,
          building_type: raw.building_type || raw.buildingType,
        } as PropertyShowcase);
      } catch { if (alive) setError('Не удалось загрузить объект'); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [propertyId, mode, reloadTick]);

  // intelligence
  useEffect(() => {
    if (!propertyId) return;
    let alive = true; setIntel(null); setIntelError(false);
    fetch(`/api/properties/${propertyId}/intelligence`).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!alive) return; if (d && d.legal) setIntel(d); else setIntelError(true); })
      .catch(() => { if (alive) setIntelError(true); });
    return () => { alive = false; };
  }, [propertyId]);

  // AI opinion (personal)
  useEffect(() => {
    if (!propertyId) return;
    let alive = true; setOpinion(null); setOpinionLoading(true);
    fetch(`/api/properties/${propertyId}/opinion`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationHistory: buildClientText(clientContext) }),
    }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && (d.summary || (d.reasons && d.reasons.length))) setOpinion(d); })
      .catch(() => {}).finally(() => { if (alive) setOpinionLoading(false); });
    return () => { alive = false; };
  }, [propertyId]);

  // auth
  useEffect(() => {
    let alive = true;
    fetch('/api/users/me', { credentials: 'include' }).then(async (r) => {
      if (!alive) return;
      setIsLoggedIn(r.ok);
      if (r.ok) { try { const u = await r.json(); setMeId(u.id || u.user?.id || ''); } catch {} }
    }).catch(() => alive && setIsLoggedIn(false));
    return () => { alive = false; };
  }, []);

  // nearby places
  const loadNearby = useCallback(async () => {
    if (!propertyId) return;
    setNearbyLoading(true); setNearbyError(false);
    try {
      const r = await fetch(`/api/properties/${propertyId}/nearby`);
      if (r.ok) setNearby(await r.json()); else setNearbyError(true);
    } catch { setNearbyError(true); } finally { setNearbyLoading(false); }
  }, [propertyId]);
  useEffect(() => { loadNearby(); }, [loadNearby]);

  // Broker reviews — отзывы/рейтинг относятся к БРОКЕРУ (агенту), не к объекту.
  const brokerId = (property?.owner as any)?.id || '';
  const loadReviews = useCallback(async (agentId: string) => {
    if (!agentId) return;
    setReviewsLoading(true); setReviewsError(false);
    try {
      const r = await fetch(`/api/agents/${agentId}/reviews`);
      if (r.ok) setReviews(await r.json()); else setReviewsError(true);
    } catch { setReviewsError(true); } finally { setReviewsLoading(false); }
  }, []);
  useEffect(() => { if (brokerId) loadReviews(brokerId); }, [brokerId, loadReviews]);

  const submitReview = async () => {
    if (!brokerId) return;
    if (!myRating) { setReviewMsg('Поставьте оценку'); return; }
    setSubmittingReview(true); setReviewMsg(null);
    try {
      const r = await fetch(`/api/agents/${brokerId}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ rating: myRating, comment: myComment.trim() || undefined }),
      });
      if (r.ok) { setMyRating(0); setMyComment(''); setReviewMsg('Спасибо за отзыв!'); loadReviews(brokerId); }
      else if (r.status === 409) setReviewMsg('Вы уже оставили отзыв об этом брокере');
      else if (r.status === 400) setReviewMsg('Нельзя оценить самого себя');
      else if (r.status === 401) setReviewMsg('Войдите, чтобы оставить отзыв');
      else setReviewMsg('Не удалось отправить отзыв');
    } catch { setReviewMsg('Ошибка сети'); } finally { setSubmittingReview(false); }
  };

  // existing viewing
  useEffect(() => {
    if (!isLoggedIn || !propertyId) { setHasExistingViewing(false); return; }
    let alive = true;
    fetch('/api/viewings', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!alive || !d) return;
      const active = (d.viewings || []).some((v: any) => v.propertyId === propertyId && v.status !== 'completed' && v.status !== 'cancelled');
      setHasExistingViewing(active);
    }).catch(() => {});
    return () => { alive = false; };
  }, [isLoggedIn, propertyId]);

  const dealKick = useMemo(() => (property && property.price && property.price < 3_000_000 ? 'Аренда · долгосрочно' : 'Продажа'), [property]);
  const isRental = property ? property.price < 3_000_000 : false;
  const ringOffset = property ? (RING_C * (1 - (property.match_score || 0) / 100)).toFixed(1) : '0';

  const onBook = () => {
    if (hasExistingViewing) return;
    if (isLoggedIn) setShowForm((s) => !s);
    else window.location.href = '/login?redirect=' + encodeURIComponent(mode === 'page' ? `/properties/${propertyId}` : '/results');
  };

  const iRow = (icon: React.ReactNode, k: string, v: string, tone?: 'warn' | 'mut') => (
    <div className="irow"><span className="k">{icon}{k}</span><span className={`v${tone ? ' ' + tone : ''}`}>{v}</span></div>
  );

  const stars = (n: number, size = 14) => (
    <span style={{ display: 'inline-flex', gap: 1, verticalAlign: 'middle' }}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} fill={i <= Math.round(n) ? 'var(--em)' : 'none'} stroke={i <= Math.round(n) ? 'var(--em)' : 'var(--hair)'} />)}
    </span>
  );

  const renderBody = () => {
    if (loading) return <div className="pstate"><div className="pspin" /></div>;
    if (error || !property) {
      return (
        <div className="pstate">
          <div style={{ fontSize: 18, fontWeight: 600 }}>{error || 'Объект не найден'}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="itab on" onClick={() => { setError(null); setLoading(true); setReloadTick((t) => t + 1); }}>Повторить</button>
            <button className="itab" onClick={close}>Закрыть</button>
          </div>
        </div>
      );
    }
    const images = property.images && property.images.length ? property.images : [property.image_url];
    const advantages = (opinion?.reasons && opinion.reasons.length ? opinion.reasons : (property.recommendation_reasons || []))
      .map((r: any) => loc(r, lang)).filter(Boolean);
    const warning = opinion?.warning || loc(property.warning, lang);
    const summary = opinion?.summary || '';
    // Localized location: Address · District(Yerevan) · City · Province — from geo keys.
    const geoParts: string[] = [];
    if (property.district) {
      const yd = YEREVAN_DISTRICTS.find((x) => x.key === property.district || x.name.en === property.district);
      geoParts.push(yd ? localizeGeo(yd.name, lang) : loc(property.district, lang));
    }
    if (property.city && !isYerevan(property.city)) {
      const cc = findCity(property.city);
      geoParts.push(cc ? localizeGeo(cc.name, lang) : loc(property.city, lang));
    }
    if (property.province) {
      const pp = findProvince(property.province);
      geoParts.push(pp ? localizeGeo(pp.name, lang) : loc(property.province, lang));
    }
    const displayLoc = [loc(property.address, lang), ...geoParts].filter(Boolean).join(' · ');
    const ownerName = property.owner ? `${property.owner.first_name || ''} ${property.owner.last_name || ''}`.trim() : '';
    const ownerRole = property.owner?.user_type === 'agent' ? 'агент' : 'собственник';
    // Prefer the authoritative moderation flag (Property.verified, set true on approve);
    // fall back to a legacy contact.verified flag if present.
    const verified = property.verified || Boolean(property.contact?.verified);

    return (
      <div className="pcard">
        <div className="pgrid">
          {/* LEFT */}
          <div className="pleft">
            {/* gallery */}
            <div className="gal">
              <div className="main" style={{ backgroundImage: `url('${images[activeImg] || property.image_url}')` }}>
                {property.is_top_choice && <span className="badge">Топ-выбор Homy</span>}
                {property.has_virtual_tour && (
                  <button className="vtour-btn" onClick={() => setShowTour(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                    Виртуальный тур
                  </button>
                )}
              </div>
              {images.length > 1 && (
                <div className="thumbs">
                  {images.slice(0, 6).map((img, i) => (
                    <div key={i} className={i === activeImg ? 'on' : ''} style={{ backgroundImage: `url('${img}')` }} onClick={() => setActiveImg(i)} />
                  ))}
                </div>
              )}
            </div>

            {/* header */}
            <div className="phead">
              <div>
                <div className="kick">{dealKick}</div>
                <div className="price">{fmtPrice(property.price)}<span>{property.currency}{isRental ? ' / мес' : ''}</span></div>
              </div>
              {property.match_score ? (
                <div className="matchwrap">
                  <div className="matchpct"><b>{property.match_score}%</b><span>совпадение</span></div>
                  <div className="mring">
                    <svg width="52" height="52"><circle cx="26" cy="26" r="22" fill="none" stroke="var(--hair)" strokeWidth="3" /><circle cx="26" cy="26" r="22" fill="none" stroke="var(--em)" strokeWidth="3" strokeLinecap="round" strokeDasharray={RING_C.toFixed(1)} strokeDashoffset={ringOffset} /></svg>
                    <b style={{ color: 'var(--ink)' }}>{property.match_score}</b>
                  </div>
                </div>
              ) : null}
            </div>

            {/* badges */}
            <div className="badges">
              {property.is_top_choice && <span className="bdg"><Star size={12} />Топ-выбор Homy</span>}
              <span className="bdg"><ShieldCheck size={12} />Проверенный листинг</span>
              {geoParts[0] && <span className="bdg n"><Home size={12} />{geoParts[0]}</span>}
            </div>

            <div>
              <div className="dttl">{loc(property.title || property.name, lang)}</div>
              <div className="dloc">{displayLoc}</div>
            </div>

            {/* specs */}
            <div className="dspecs">
              {property.rooms ? <div className="s"><Bed size={16} /><b>{property.rooms}</b><span>спальни</span></div> : null}
              {(property.area || property.size_sqm) ? <div className="s"><Maximize2 size={16} /><b>{property.area || property.size_sqm} м²</b></div> : null}
              {property.floor ? <div className="s"><Home size={16} /><b>{property.floor}{property.totalFloors ? ` / ${property.totalFloors}` : ''}</b><span>этаж</span></div> : null}
              {property.year_built ? <div className="s"><Building size={16} /><b>{property.year_built}</b><span>год</span></div> : null}
              {property.building_type ? <span className="bt">· {BUILDING_TYPE_RU[property.building_type] || loc(property.building_type, lang)}</span> : null}
            </div>

            {/* Мнение Homy */}
            <div className="sec em">
              <div className="sh"><Sparkles size={13} />Мнение Homy</div>
              {opinionLoading ? (
                <div className="loadrow"><Loader2 size={14} className="animate-spin" />Анализирую вашу переписку…</div>
              ) : summary ? (
                <>
                  <p>{summary}</p>
                  <div className="note"><Info size={12} />Персональная оценка на основе вашего диалога с Homy</div>
                </>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Откройте чат и расскажите, что ищете — Homy даст персональную оценку по фактам.</p>
              )}
            </div>

            {/* advantages + warning */}
            <div className="two">
              <div className="sec em">
                <div className="sh"><Sparkles size={13} />Преимущества</div>
                {opinionLoading ? (
                  <div className="loadrow"><Loader2 size={14} className="animate-spin" />AI анализирует…</div>
                ) : (
                  <ul className="adv">
                    {(advantages.length ? advantages : ['Проверено Homy по фактам']).slice(0, 6).map((r, i) => (
                      <li key={i}><Check size={13} strokeWidth={2.6} />{r}</li>
                    ))}
                  </ul>
                )}
              </div>
              {warning ? (
                <div className="sec amber">
                  <div className="sh a"><AlertTriangle size={13} />На что обратить внимание</div>
                  <p>{warning}</p>
                </div>
              ) : (
                <div className="sec">
                  <div className="sh mut"><ShieldCheck size={13} />Проверка Homy</div>
                  <p>Существенных рисков не выявлено. Homy проверил объект по публичным данным.</p>
                </div>
              )}
            </div>

            {/* monthly costs */}
            {isRental && (
              <div className="sec">
                <div className="sh mut"><Receipt size={13} />Ежемесячные расходы</div>
                <div className="costs">
                  <div className="c"><span>Аренда</span><b>{fmtPrice(property.price)} {property.currency}</b></div>
                  <div className="c"><span>Коммуналка</span><b>~ {fmtPrice(property.utilities_estimate || 18000)} {property.currency}</b></div>
                  <div className="c"><span>Депозит</span><b>{property.deposit_months || 1} мес</b></div>
                </div>
              </div>
            )}

            {/* property intelligence */}
            {intel && (
              <div className="sec bare">
                <div className="intel-h">Property Intelligence · {displayLoc}</div>
                <div className="itabs">
                  <span className={`itab${tab === 'legal' ? ' on' : ''}`} onClick={() => setTab('legal')}>Застройщик и юр.</span>
                  <span className={`itab${tab === 'location' ? ' on' : ''}`} onClick={() => setTab('location')}>Локация</span>
                  <span className={`itab${tab === 'infra' ? ' on' : ''}`} onClick={() => setTab('infra')}>Инфраструктура</span>
                  <span className={`itab${tab === 'invest' ? ' on' : ''}`} onClick={() => setTab('invest')}>Инвестиции</span>
                </div>
                {tab === 'legal' && (
                  <div className="ipanel">
                    {iRow(<ShieldCheck size={16} />, 'Проверка модератором Homy', verified ? 'листинг проверен' : 'не проверен', verified ? undefined : 'mut')}
                    {iRow(<Building2 size={16} />, 'Застройщик', intel.legal.developer_name || NEEDS_SOURCE, intel.legal.developer_name ? undefined : 'mut')}
                    {iRow(<FileCheck size={16} />, 'Юр. чистота (титул, собственность, споры)', NEEDS_SOURCE, 'mut')}
                    <div className="isrc">Юридическую чистоту (реестр/нотариус) уточняйте до сделки — Homy пока не проверяет её автоматически.</div>
                  </div>
                )}
                {tab === 'location' && (
                  <div className="ipanel">
                    {iRow(<TreePine size={16} />, 'Парки рядом', intel.location.parks_nearby && intel.location.parks_nearby !== 'None nearby' ? String(intel.location.parks_nearby) : NEEDS_SOURCE, intel.location.parks_nearby && intel.location.parks_nearby !== 'None nearby' ? undefined : 'mut')}
                    {iRow(<ParkingCircle size={16} />, 'Парковка', intel.location.parking_available === 'Available' ? 'есть' : intel.location.parking_available === 'Limited' ? 'ограничена' : NEEDS_SOURCE, intel.location.parking_available ? undefined : 'mut')}
                    {iRow(<Volume2 size={16} />, 'Шум', NEEDS_SOURCE, 'mut')}
                    {iRow(<Leaf size={16} />, 'Экология', NEEDS_SOURCE, 'mut')}
                    {iRow(<Bus size={16} />, 'Время в пути', NEEDS_SOURCE, 'mut')}
                    <div className="isrc">Парки и парковка — по реальным данным; остальное — источник в подключении.</div>
                  </div>
                )}
                {tab === 'infra' && (
                  <div className="ipanel">
                    {iRow(<GraduationCap size={16} />, 'Школы и сады', intel.infrastructure.schools && intel.infrastructure.schools !== 'None nearby' ? String(intel.infrastructure.schools) : 'рядом не найдено')}
                    {iRow(<Bus size={16} />, 'Транспорт', intel.infrastructure.transport && intel.infrastructure.transport !== 'Limited' ? String(intel.infrastructure.transport) : 'рядом не найдено')}
                    {iRow(<ShoppingCart size={16} />, 'Супермаркеты', Number(intel.infrastructure.supermarkets) > 0 ? `${intel.infrastructure.supermarkets} рядом` : 'рядом не найдено')}
                    {iRow(<Pill size={16} />, 'Аптеки', NEEDS_SOURCE, 'mut')}
                    {iRow(<Landmark size={16} />, 'Банки', NEEDS_SOURCE, 'mut')}
                    <div className="isrc">Школы, транспорт и магазины — по реальным POI (OpenStreetMap). Аптеки/банки — источник в подключении.</div>
                  </div>
                )}
                {tab === 'invest' && (
                  <div className="ipanel">
                    {iRow(<LineChart size={16} />, 'Сигналы спроса', Number(intel.investment.demand_signals) > 0 ? `${intel.investment.demand_signals} по фактам рядом` : 'нет явных сигналов')}
                    {iRow(<Coins size={16} />, 'Цена к рынку', NEEDS_SOURCE, 'mut')}
                    {iRow(<TrendingUp size={16} />, 'Оценка Homy', NEEDS_SOURCE, 'mut')}
                    {iRow(<Coins size={16} />, 'ROI (оценка)', NEEDS_SOURCE, 'mut')}
                    {iRow(<TrendingUp size={16} />, 'Прогноз роста', NEEDS_SOURCE, 'mut')}
                    <div className="isrc">Сигналы спроса — по реальным данным рядом. Инвест-оценки — источник в подключении, не гарантия.</div>
                  </div>
                )}
              </div>
            )}
            {!intel && intelError && (
              <div className="sec bare">
                <div className="intel-h">Property Intelligence · {displayLoc}</div>
                <p style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 2px' }}>Данные проверки временно недоступны.</p>
              </div>
            )}

            {/* Рядом — реальные места с временем пешком + карта */}
            <div>
              <div className="sh mut" style={{ marginBottom: 9 }}><MapPin size={13} />Рядом</div>
              {nearbyLoading ? (
                <div className="loadrow"><Loader2 size={14} className="animate-spin" />Ищем места поблизости…</div>
              ) : nearbyError ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  Не удалось загрузить.<button className="itab" onClick={loadNearby}>Повторить</button>
                </div>
              ) : (() => {
                const cats: { key: string; label: string; icon: React.ReactNode }[] = [
                  { key: 'schools', label: 'Школы и сады', icon: <GraduationCap size={14} /> },
                  { key: 'metro', label: 'Транспорт', icon: <Bus size={14} /> },
                  { key: 'supermarkets', label: 'Магазины', icon: <ShoppingCart size={14} /> },
                  { key: 'parks', label: 'Парки', icon: <TreePine size={14} /> },
                ];
                const groups = cats.map((c) => ({ ...c, items: (nearby?.[c.key] || []).slice(0, 3) })).filter((g) => g.items.length);
                if (!groups.length) return <div style={{ fontSize: 13, color: 'var(--muted)' }}>Рядом ничего не найдено.</div>;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
                    {groups.map((g) => (
                      <div key={g.key} style={{ background: 'var(--surface2)', border: '1px solid var(--hair)', borderRadius: 12, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--em)', marginBottom: 6 }}>{g.icon}{g.label}</div>
                        {g.items.map((it: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: 'var(--ink)', padding: '3px 0' }}>
                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                            <span style={{ color: 'var(--muted)', flex: 'none' }}>{it.walk_time_min ? `${it.walk_time_min} мин пешком` : it.distance_m ? `${it.distance_m} м` : ''}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="mmapc" style={{ marginTop: 12 }}><PropertyMiniMap property={property} propertyId={property.id} /></div>
            </div>

            {/* agent + viewing */}
            <div className="sec">
              <div className="agent">
                <div className="who">
                  <div className="av"><MessageSquare size={20} /></div>
                  <div>
                    <div className="nm">{ownerName || (property.owner?.user_type === 'agent' ? 'Агент' : 'Собственник')}</div>
                    <div className="rl">{verified && <span className="vf">Проверен</span>}{verified ? ' · ' : ''}{ownerRole}</div>
                    {reviews?.stats && (reviews.stats.totalReviews > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        {stars(reviews.stats.averageRating, 12)}
                        <b style={{ fontSize: 12.5, color: 'var(--ink)' }}>{Number(reviews.stats.averageRating).toFixed(1)}</b>
                        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>· {reviews.stats.totalReviews} {plur(reviews.stats.totalReviews, ['отзыв', 'отзыва', 'отзывов'])}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>Пока нет отзывов о брокере</div>
                    ))}
                  </div>
                </div>
                <div className="abtns">
                  <button className="bwrite" onClick={() => openPropertyChat(property.id)}><MessageSquare size={14} />Написать</button>
                  <button className={`bbook${hasExistingViewing ? ' done' : ''}`} onClick={onBook} disabled={hasExistingViewing}>
                    <CalendarPlus size={14} />{hasExistingViewing ? 'Просмотр запланирован' : 'Записаться на просмотр'}
                  </button>
                </div>
                {isLoggedIn && brokerId && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--hair)', paddingTop: 10 }}>
                    {!showBrokerReview ? (
                      <button onClick={() => setShowBrokerReview(true)} style={{ background: 'none', border: 0, color: 'var(--em)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Оценить брокера</button>
                    ) : (
                      <div>
                        <div style={{ display: 'inline-flex', gap: 3, marginBottom: 8 }}>
                          {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={22} style={{ cursor: 'pointer' }} fill={i <= myRating ? 'var(--em)' : 'none'} stroke={i <= myRating ? 'var(--em)' : 'var(--muted)'} onClick={() => setMyRating(i)} />)}
                        </div>
                        <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} rows={2} placeholder="Ваш опыт работы с брокером…" style={{ width: '100%', resize: 'vertical', borderRadius: 10, border: '1px solid var(--hair)', background: 'var(--surface)', color: 'var(--ink)', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                          <button disabled={submittingReview} onClick={submitReview} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--em)', border: 0, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', opacity: submittingReview ? 0.6 : 1 }}>{submittingReview ? 'Отправляем…' : 'Отправить'}</button>
                          {reviewMsg && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{reviewMsg}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {showForm && !hasExistingViewing && (
                <div className="vformwrap" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
                  <div className="vfsheet">
                    <ViewingRequestForm property={property} onSuccess={() => { setShowForm(false); setHasExistingViewing(true); }} onCancel={() => setShowForm(false)} />
                  </div>
                </div>
              )}
            </div>

            {/* Отзывы объекта удалены: отзывы/рейтинг относятся к БРОКЕРУ, не к недвижимости. */}
          </div>

          {/* RIGHT: per-property AI chat */}
          <div className="pright">
            <div className="aicol"><PropertyChatPanel property={property} onClose={close} /></div>
          </div>
        </div>

        {/* mobile sticky CTA — эскиз A4 (Позвонить + Записаться) */}
        <div className="mcta">
          {property.contact?.phone ? (
            <a className="call" href={`tel:${property.contact.phone}`} aria-label="Позвонить">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
            </a>
          ) : (
            <button className="call" type="button" onClick={() => openPropertyChat(property.id)} aria-label="Написать">
              <MessageSquare size={19} />
            </button>
          )}
          <button className={`book${hasExistingViewing ? ' done' : ''}`} type="button" onClick={onBook} disabled={hasExistingViewing}>
            <CalendarPlus size={16} />{hasExistingViewing ? 'Просмотр запланирован' : 'Записаться на просмотр'}
          </button>
        </div>
      </div>
    );
  };

  const tour = showTour && property ? <VirtualTour propertyId={String(property.id)} onClose={() => setShowTour(false)} /> : null;

  if (mode === 'popup') {
    return (
      <div className="homy-property pop">
        <style dangerouslySetInnerHTML={{ __html: PROPERTY_CSS }} />
        <div className="pop-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pop-win">{renderBody()}</div>
        </div>
        {tour}
      </div>
    );
  }

  return (
    <div className="homy-property">
      <style dangerouslySetInnerHTML={{ __html: PROPERTY_CSS }} />
      <div className="wnav">
        <button className="bk" onClick={close}><ArrowLeft size={16} /> К результатам поиска</button>
        <div className="sp" />
        <HomyLogoMenu align="right" />
      </div>
      <div className="wrap">{renderBody()}</div>
      <SupportFab />
      {tour}
    </div>
  );
}
