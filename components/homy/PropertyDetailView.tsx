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
import {
  ArrowLeft, Check, X, Star, ShieldCheck, Home, Bed, Maximize2, Building,
  Sparkles, AlertTriangle, Loader2, Receipt, MessageSquare, CalendarPlus, Video, Info,
  Building2, Scale, FileCheck, Volume2, Leaf, ParkingCircle, TreePine, Baby,
  GraduationCap, Bus, ShoppingCart, Pill, Landmark, TrendingUp, Coins, LineChart, MapPin,
} from 'lucide-react';

const RING_C = 2 * Math.PI * 22;

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
function getConversationHistory(): string {
  if (typeof window === 'undefined') return '';
  try {
    const h = sessionStorage.getItem('homy_chat_history');
    if (!h) return '';
    const msgs = JSON.parse(h);
    return msgs.filter((m: any) => m.role === 'user').map((m: any) => m.content).slice(-20).join('\n');
  } catch { return ''; }
}

interface Intelligence {
  legal: { developer_verified: boolean; developer_name: string; claims_count: number; double_sale_risk: boolean; ownership_status: string; title_status: string };
  location: { commute_am: string; commute_pm: string; highway_distance: string; noise_level: string; ecology_index: string; parking_available: string; playgrounds_nearby: string; parks_nearby: string };
  infrastructure: { supermarkets: number | string; pharmacies: number | string; banks: number | string; schools: string; transport: string };
  investment: { score: number; price_vs_market: string; demand_signals: number | string; roi_estimate: string; appreciation_forecast: string };
}
interface Opinion { summary: string; reasons: string[]; warning: string | null }
type Tab = 'legal' | 'location' | 'infra' | 'invest';

interface Props { propertyId: string; mode?: 'page' | 'popup'; onClose?: () => void }

export default function PropertyDetailView({ propertyId, mode = 'page', onClose }: Props) {
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
          owner: raw.owner, contact: raw.contact,
          utilities_estimate: raw.utilities_estimate || raw.utilitiesEstimate,
          deposit_months: raw.deposit_months || raw.depositMonths,
          has_virtual_tour: raw.has_virtual_tour || raw.hasVirtualTour || false,
          building_type: raw.building_type || raw.buildingType,
        } as PropertyShowcase);
      } catch { if (alive) setError('Не удалось загрузить объект'); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [propertyId, mode]);

  // intelligence
  useEffect(() => {
    if (!propertyId) return;
    let alive = true; setIntel(null);
    fetch(`/api/properties/${propertyId}/intelligence`).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && d.legal) setIntel(d); }).catch(() => {});
    return () => { alive = false; };
  }, [propertyId]);

  // AI opinion (personal)
  useEffect(() => {
    if (!propertyId) return;
    let alive = true; setOpinion(null); setOpinionLoading(true);
    fetch(`/api/properties/${propertyId}/opinion`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationHistory: getConversationHistory() }),
    }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && (d.summary || (d.reasons && d.reasons.length))) setOpinion(d); })
      .catch(() => {}).finally(() => { if (alive) setOpinionLoading(false); });
    return () => { alive = false; };
  }, [propertyId]);

  // auth
  useEffect(() => {
    let alive = true;
    fetch('/api/users/me', { credentials: 'include' }).then((r) => alive && setIsLoggedIn(r.ok)).catch(() => alive && setIsLoggedIn(false));
    return () => { alive = false; };
  }, []);

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

  const renderBody = () => {
    if (loading) return <div className="pstate"><div className="pspin" /></div>;
    if (error || !property) {
      return (
        <div className="pstate">
          <div style={{ fontSize: 18, fontWeight: 600 }}>{error || 'Объект не найден'}</div>
          <button className="itab on" onClick={close}>Закрыть</button>
        </div>
      );
    }
    const images = property.images && property.images.length ? property.images : [property.image_url];
    const advantages = (opinion?.reasons && opinion.reasons.length ? opinion.reasons : (property.recommendation_reasons || []))
      .map((r: any) => loc(r, lang)).filter(Boolean);
    const warning = opinion?.warning || loc(property.warning, lang);
    const summary = opinion?.summary || '';
    const displayLoc = [loc(property.address, lang), loc(property.district, lang)].filter(Boolean).join(' · ');
    const ownerName = property.owner ? `${property.owner.first_name || ''} ${property.owner.last_name || ''}`.trim() : '';
    const ownerRole = property.owner?.user_type === 'agent' ? 'агент' : 'собственник';
    const verified = property.contact?.verified;

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
                  <button className="vtour-btn" onClick={() => setShowTour(true)}><Video size={13} />Виртуальный тур</button>
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
              {loc(property.district, lang) && <span className="bdg n"><Home size={12} />{loc(property.district, lang)}</span>}
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
                    {iRow(<Building2 size={16} />, 'Репутация застройщика', intel.legal.developer_verified ? 'проверена' : 'не подтверждена', intel.legal.developer_verified ? undefined : 'warn')}
                    {iRow(<Scale size={16} />, 'Активные юр. споры', intel.legal.claims_count === 0 ? 'не найдено' : `${intel.legal.claims_count}`, intel.legal.claims_count === 0 ? undefined : 'warn')}
                    {iRow(<AlertTriangle size={16} />, 'Риск двойной продажи', intel.legal.double_sale_risk ? 'есть сигналы' : 'нет сигналов', intel.legal.double_sale_risk ? 'warn' : undefined)}
                    {iRow(<ShieldCheck size={16} />, 'Регистрация собственности', intel.legal.ownership_status === 'single_owner' ? 'единственный владелец' : intel.legal.ownership_status === 'pending_verification' ? 'на проверке' : (intel.legal.ownership_status || '—'), intel.legal.ownership_status === 'single_owner' ? undefined : 'warn')}
                    {iRow(<FileCheck size={16} />, 'Документы', intel.legal.title_status === 'complete' ? 'полные' : 'нужна проверка', intel.legal.title_status === 'complete' ? undefined : 'warn')}
                    <div className="isrc">Источник: публичный реестр, данные застройщика{intel.legal.developer_name ? ` · ${intel.legal.developer_name}` : ''}</div>
                  </div>
                )}
                {tab === 'location' && (
                  <div className="ipanel">
                    {iRow(<Volume2 size={16} />, 'Шум', intel.location.noise_level || '—', intel.location.noise_level && /high|высок/i.test(intel.location.noise_level) ? 'warn' : undefined)}
                    {iRow(<Leaf size={16} />, 'Экология', intel.location.ecology_index === 'good' ? 'высокая' : intel.location.ecology_index === 'medium' ? 'средняя' : intel.location.ecology_index === 'low' ? 'низкая' : (intel.location.ecology_index || '—'))}
                    {iRow(<TreePine size={16} />, 'Парки', intel.location.parks_nearby || '—')}
                    {iRow(<Baby size={16} />, 'Детские площадки', intel.location.playgrounds_nearby || '—')}
                    {iRow(<ParkingCircle size={16} />, 'Парковка', intel.location.parking_available === 'Available' ? 'есть' : 'ограничена', intel.location.parking_available === 'Available' ? undefined : 'warn')}
                    {iRow(<Bus size={16} />, 'Дорога (утро/вечер)', [intel.location.commute_am, intel.location.commute_pm].filter(Boolean).join(' / ') || '—', 'mut')}
                    <div className="isrc">Источник: данные района · neighborhoods.json</div>
                  </div>
                )}
                {tab === 'infra' && (
                  <div className="ipanel">
                    {iRow(<GraduationCap size={16} />, 'Школы', String(intel.infrastructure.schools || '—'))}
                    {iRow(<Bus size={16} />, 'Транспорт', String(intel.infrastructure.transport || '—'))}
                    {iRow(<ShoppingCart size={16} />, 'Супермаркеты', `${intel.infrastructure.supermarkets} рядом`)}
                    {iRow(<Pill size={16} />, 'Аптеки', `${intel.infrastructure.pharmacies} рядом`)}
                    {iRow(<Landmark size={16} />, 'Банки', `${intel.infrastructure.banks} рядом`)}
                    <div className="isrc">Источник: POI-данные объекта</div>
                  </div>
                )}
                {tab === 'invest' && (
                  <div className="ipanel">
                    {iRow(<TrendingUp size={16} />, 'Оценка Homy', intel.investment.score ? `${intel.investment.score} / 100` : '—')}
                    {iRow(<Coins size={16} />, 'Цена к рынку', String(intel.investment.price_vs_market || '—'), intel.investment.price_vs_market && /\+/.test(String(intel.investment.price_vs_market)) ? 'warn' : undefined)}
                    {iRow(<LineChart size={16} />, 'Сигналы спроса', `${intel.investment.demand_signals}`)}
                    {iRow(<Coins size={16} />, 'ROI (оценка)', String(intel.investment.roi_estimate || '—'))}
                    {iRow(<TrendingUp size={16} />, 'Прогноз роста', String(intel.investment.appreciation_forecast || '—'), 'mut')}
                    <div className="isrc">Оценка Homy, не гарантия доходности</div>
                  </div>
                )}
              </div>
            )}

            {/* mini map */}
            <div>
              <div className="sh mut" style={{ marginBottom: 9 }}><MapPin size={13} />Рядом</div>
              <div className="mmapc"><PropertyMiniMap property={property} propertyId={property.id} /></div>
            </div>

            {/* agent + viewing */}
            <div className="sec">
              <div className="agent">
                <div className="who">
                  <div className="av"><MessageSquare size={20} /></div>
                  <div>
                    <div className="nm">{ownerName || (property.owner?.user_type === 'agent' ? 'Агент' : 'Собственник')}</div>
                    <div className="rl">{verified && <span className="vf">Проверен</span>}{verified ? ' · ' : ''}{ownerRole}</div>
                  </div>
                </div>
                <div className="abtns">
                  <button className="bwrite" onClick={() => openPropertyChat(property.id)}><MessageSquare size={14} />Написать</button>
                  <button className={`bbook${hasExistingViewing ? ' done' : ''}`} onClick={onBook} disabled={hasExistingViewing}>
                    <CalendarPlus size={14} />{hasExistingViewing ? 'Просмотр запланирован' : 'Записаться на просмотр'}
                  </button>
                </div>
              </div>
              {showForm && !hasExistingViewing && (
                <div className="vformwrap">
                  <ViewingRequestForm property={property} onSuccess={() => { setShowForm(false); setHasExistingViewing(true); }} onCancel={() => setShowForm(false)} />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: per-property AI chat */}
          <div className="pright">
            <div className="aicol"><PropertyChatPanel property={property} onClose={close} /></div>
          </div>
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
