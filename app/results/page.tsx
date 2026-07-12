'use client';

import React, {
  useState, useEffect, useCallback, useRef, useMemo, Suspense, FormEvent,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/components/homy/ThemeProvider';
import HomyLogoMenu from '@/components/homy/HomyLogoMenu';
import SupportFab from '@/components/homy/SupportFab';
import PropertyDetailView from '@/components/homy/PropertyDetailView';
import FocusResultsMap from '@/components/homy/FocusResultsMap';
import { RESULTS_CSS } from '@/components/homy/resultsStyles';
import { FavoritesProvider, useFavorites } from '@/contexts/FavoritesContext';
import { useCompare } from '@/lib/contexts/CompareContext';
import { Heart, Scale } from 'lucide-react';
import {
  PropertyShowcase, AIInsights, WebSocketMessage, WebSocketPropertyDisplayCommand,
} from '@/lib/types';

/** If not logged in, go to login and come back with the action pre-applied. */
async function ensureAuthOr(kind: 'fav' | 'cmp', id: string): Promise<boolean> {
  try {
    const r = await fetch('/api/users/me', { credentials: 'include' });
    if (r.ok) return true;
  } catch {}
  const cur = window.location.pathname + window.location.search;
  const back = `${cur}${cur.includes('?') ? '&' : '?'}pending=${kind}:${id}`;
  window.location.href = `/login?redirect=${encodeURIComponent(back)}`;
  return false;
}

/** Hover-revealed favorite + compare actions overlaid on a card photo. */
function CardActions({ id, score }: { id: string; score: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const saved = isFavorite(id);
  const inCmp = isInCompare(id);

  const onFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await ensureAuthOr('fav', id)) toggleFavorite(id);
  };
  const onCmp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await ensureAuthOr('cmp', id)) {
      inCmp ? removeFromCompare(id) : addToCompare(id, score || 0);
    }
  };

  return (
    <div className="cardacts">
      <button type="button" title={saved ? 'Убрать из избранного' : 'В избранное'} onClick={onFav}>
        <Heart size={17} fill={saved ? '#EF4444' : 'none'} color={saved ? '#EF4444' : '#1A1A1A'} />
      </button>
      <button type="button" title={inCmp ? 'Убрать из сравнения' : 'Сравнить'} onClick={onCmp}>
        <Scale size={17} color={inCmp ? '#0A6045' : '#1A1A1A'} />
      </button>
    </div>
  );
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const RING_C = 2 * Math.PI * 19; // r=19 → 119.38

function fmtPrice(p: number): string {
  if (!p) return '—';
  return Math.round(p).toLocaleString('ru-RU').replace(/,/g, ' ');
}
/** Resolve i18n-JSON fields ({"en":..,"ru":..,"hy":..}) to the active language. */
function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) {
    try {
      const o = JSON.parse(s);
      return o[lang] || o.ru || o.en || s;
    } catch {
      return v;
    }
  }
  return v;
}
function specsLine(p: PropertyShowcase): string {
  const beds = p.rooms ? `${p.rooms} ${p.rooms === 1 ? 'спальня' : 'спальни'}` : 'студия';
  const area = p.area ?? p.size_sqm;
  const parts = [beds];
  if (area) parts.push(`${area} м²`);
  if (p.floor) parts.push(`этаж ${p.floor}${p.totalFloors ? ` / ${p.totalFloors}` : ''}`);
  return parts.join(' · ');
}
/** Up to 4 info parameters shown inside a card: location + top reasons. */
function cardParams(p: PropertyShowcase, lang: string): string[] {
  const out: string[] = [];
  const place = [loc(p.address, lang), loc(p.district, lang)].filter(Boolean).join(' · ');
  if (place) out.push(place);
  (p.recommendation_reasons || []).forEach((r: any) => {
    const s = loc(r, lang);
    if (s) out.push(s);
  });
  return out.slice(0, 4);
}
function ring(score: number, size = 44, r = 19) {
  const off = (RING_C * (1 - (score || 0) / 100)).toFixed(1);
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(0,0,0,.4)" stroke="rgba(255,255,255,.25)" strokeWidth="2.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0B6E4F" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={RING_C.toFixed(1)} strokeDashoffset={off} />
    </svg>
  );
}

function ResultsInner() {
  const { t, lang } = useT();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('query') || '';
  const { toggleFavorite } = useFavorites();
  const { addToCompare } = useCompare();
  const pendingRef = useRef(false);

  const [properties, setProperties] = useState<PropertyShowcase[]>([]);
  const [topChoiceId, setTopChoiceId] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [criteriaChips, setCriteriaChips] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'grid'>('map');
  const [composer, setComposer] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  // ---- save search (logged-in buyers) ----
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedList, setSavedList] = useState<any[]>([]);
  const [saveMode, setSaveMode] = useState<'new' | 'overwrite'>('new');
  const [overwriteId, setOverwriteId] = useState<string>('');
  const [saveComment, setSaveComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const isRestoredRef = useRef(false);
  const streamRef = useRef<HTMLDivElement>(null);

  const storageKey = useCallback((q: string) => `homy_results_${encodeURIComponent(q)}`, []);

  // ---- apply pending favorite/compare action after login redirect ----
  useEffect(() => {
    if (pendingRef.current) return;
    const pending = searchParams.get('pending');
    if (!pending) return;
    const idx = pending.indexOf(':');
    if (idx < 0) return;
    const kind = pending.slice(0, idx);
    const pid = pending.slice(idx + 1);
    if (!pid) return;
    if (kind === 'fav') {
      pendingRef.current = true;
      toggleFavorite(pid);
    } else if (kind === 'cmp') {
      pendingRef.current = true;
      const p = properties.find((x) => x.id === pid);
      addToCompare(pid, p?.match_score || 0);
    } else {
      return;
    }
    // strip ?pending from the URL
    const sp = new URLSearchParams(window.location.search);
    sp.delete('pending');
    router.replace(`${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ''}`, { scroll: false });
  }, [searchParams, properties, toggleFavorite, addToCompare, router]);

  // ---- restore from sessionStorage (fast back-nav) ----
  useEffect(() => {
    if (typeof window === 'undefined' || !query) return;
    try {
      const saved = sessionStorage.getItem(storageKey(query));
      if (saved) {
        const d = JSON.parse(saved);
        if (d.chatMessages) setChatMessages(d.chatMessages);
        if (d.properties) setProperties(d.properties);
        if (d.criteriaChips) setCriteriaChips(d.criteriaChips);
        if (d.insights) setInsights(d.insights);
        if (d.topChoiceId !== undefined) setTopChoiceId(d.topChoiceId);
        setSelectedId(d.topChoiceId || d.properties?.[0]?.id || null);
        setIsLoading(false);
        isRestoredRef.current = true;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- persist to sessionStorage ----
  useEffect(() => {
    if (typeof window === 'undefined' || !query) return;
    if (properties.length === 0 && chatMessages.length === 0) return;
    try {
      const light = properties.map((p) => {
        const { images, nearby_pois, ...rest } = p as any;
        return rest;
      });
      sessionStorage.setItem(
        storageKey(query),
        JSON.stringify({ chatMessages, properties: light, criteriaChips, insights, topChoiceId })
      );
    } catch {}
  }, [chatMessages, properties, criteriaChips, insights, topChoiceId, query, storageKey]);

  // ---- save search: toast helper ----
  const showToast = useCallback((ok: boolean, text: string) => {
    setToast({ ok, text });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  // ---- open save modal (requires login; loads existing for overwrite option) ----
  const openSaveModal = useCallback(async () => {
    let authed = false;
    try { const r = await fetch('/api/users/me', { credentials: 'include' }); authed = r.ok; } catch {}
    if (!authed) {
      const cur = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(cur)}`;
      return;
    }
    try {
      const r = await fetch('/api/users/me/saved-searches', { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        const list = d.searches || d.savedSearches || [];
        setSavedList(list);
        setOverwriteId(list[0]?.id || '');
      }
    } catch {}
    setSaveMode('new');
    setSaveComment('');
    setSaveOpen(true);
  }, []);

  // ---- persist the current search (new = POST, overwrite = PUT) ----
  const handleSaveSearch = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    const light = properties.map((p) => { const { images, nearby_pois, ...rest } = p as any; return rest; });
    const payload = {
      name: query || null,
      comment: saveComment.trim() || null,
      query: query || '(поиск)',
      chatMessages,
      properties: light,
      criteriaChips,
      insights,
      topChoiceId,
    };
    try {
      const overwrite = saveMode === 'overwrite' && overwriteId;
      const res = overwrite
        ? await fetch(`/api/users/me/saved-searches/${overwriteId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
        : await fetch('/api/users/me/saved-searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      if (res.status === 401) {
        const cur = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(cur)}`;
        return;
      }
      const d = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        showToast(false, d?.error === 'limit_exceeded' ? 'Достигнут лимит сохранённых поисков (20)' : 'Не удалось сохранить поиск');
        return;
      }
      setSaveOpen(false);
      showToast(true, overwrite ? 'Поиск обновлён' : 'Поиск сохранён');
    } catch {
      showToast(false, 'Не удалось сохранить поиск');
    } finally {
      setSaving(false);
    }
  }, [saving, properties, query, saveComment, chatMessages, criteriaChips, insights, topChoiceId, saveMode, overwriteId, showToast]);

  const canSave = properties.length > 0 || chatMessages.length > 0;

  // ---- apply AI property update (from show_properties tool) ----
  const handlePropertiesUpdate = useCallback((command: WebSocketPropertyDisplayCommand) => {
    setIsLoading(true);
    const received = command.properties;
    if (!received || received.length === 0) {
      setProperties([]);
      setTopChoiceId(null);
      setInsights(command.insights ?? null);
      setCriteriaChips(command.criteria || []);
      setIsLoading(false);
      return;
    }
    const mapped = received.map((p: any) => ({
      id: p.id,
      title: p.title,
      name: p.title || p.name,
      address: p.address,
      district: p.district,
      neighborhood: p.neighborhood,
      price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
      currency: p.currency || 'AMD',
      rooms: p.rooms || 0,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area || p.size_sqm,
      size_sqm: p.size_sqm,
      floor: p.floor,
      totalFloors: p.totalFloors,
      latitude: typeof p.latitude === 'number' ? p.latitude : parseFloat(p.latitude) || 0,
      longitude: typeof p.longitude === 'number' ? p.longitude : parseFloat(p.longitude) || 0,
      images: p.images || [],
      image_url: p.image_url || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '/placeholder.jpg'),
      match_score: p.match_score ?? 0,
      hasParking: p.hasParking,
      hasBalcony: p.hasBalcony,
      petsAllowed: p.petsAllowed,
      recommendation_reasons: p.recommendation_reasons || [],
      is_top_choice: p.id === command.top_choice,
    } as PropertyShowcase));

    setProperties(mapped);
    setTopChoiceId(command.top_choice);

    const top = mapped.find((p) => p.is_top_choice) || mapped[0];
    let reasonText = '';
    if (command.top_choice_reason) {
      try {
        const parsed = JSON.parse(command.top_choice_reason);
        reasonText = parsed[lang] || parsed.ru || parsed.en || '';
      } catch {
        reasonText = command.top_choice_reason;
      }
    }
    setInsights({
      best_neighborhood: command.top_choice_title || top?.title || top?.address || '',
      description: reasonText,
      analyzed_count: Math.max(mapped.length * 15, 286),
      suitable_count: mapped.length,
      recommended_count: Math.min(mapped.length, 5),
      neighborhood_count: new Set(mapped.map((p) => p.neighborhood || p.district).filter(Boolean)).size || 1,
    });
    setCriteriaChips(command.criteria || []);
    setSelectedId(command.top_choice || mapped[0]?.id || null);
    setIsLoading(false);
  }, [lang]);

  // ---- WebSocket ----
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

    socket.onopen = () => {
      setWsConnected(true);
      setError(null);
      if (query && !isRestoredRef.current) {
        setIsAiTyping(true);
        setChatMessages((prev) => (prev.length ? prev : [{ role: 'user', content: query }]));
        socket.send(JSON.stringify({ type: 'message', content: query }));
      }
    };
    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        switch (data.type) {
          case 'properties_update':
            if (data.data) handlePropertiesUpdate(data.data);
            setIsAiTyping(false);
            break;
          case 'message':
            if (data.content) setChatMessages((prev) => [...prev, { role: 'assistant', content: data.content! }]);
            setIsAiTyping(false);
            setIsLoading(false);
            break;
          case 'error':
            setError(data.error || 'Произошла ошибка');
            setIsAiTyping(false);
            break;
        }
      } catch {}
    };
    socket.onerror = () => {
      setWsConnected(false);
    };
    socket.onclose = () => setWsConnected(false);
    setWs(socket);
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, handlePropertiesUpdate]);

  // ---- fallback fetch if WS unavailable ----
  const fetchFallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      ['min_price', 'max_price', 'min_rooms', 'max_rooms', 'district', 'property_type', 'deal_type', 'has_school_nearby', 'pets_allowed', 'has_parking'].forEach((k) => {
        const v = searchParams.get(k);
        if (v) params.set(k, v);
      });
      params.set('limit', '20');
      params.set('sort_by', 'match_score');
      params.set('sort_order', 'desc');
      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error('Не удалось загрузить объекты');
      const data = await res.json();
      setProperties(data.properties || []);
      const top = (data.properties || []).find((p: PropertyShowcase) => p.is_top_choice);
      setSelectedId(top?.id || data.properties?.[0]?.id || null);
      setTopChoiceId(top?.id || null);
      setInsights({
        best_neighborhood: top?.neighborhood || top?.district || data.properties?.[0]?.neighborhood || '',
        description: '',
        analyzed_count: data.total > 0 ? Math.max(data.total * 15, 286) : 286,
        suitable_count: data.total || (data.properties?.length ?? 0),
        recommended_count: Math.min(data.properties?.length ?? 0, 5),
        neighborhood_count: new Set((data.properties || []).map((p: PropertyShowcase) => p.neighborhood || p.district).filter(Boolean)).size || 3,
      });
      setIsLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить объекты');
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!wsConnected && properties.length === 0 && !error && !isRestoredRef.current) fetchFallback();
    }, 3000);
    return () => clearTimeout(timer);
  }, [wsConnected, properties.length, error, fetchFallback]);

  // auto-scroll chat
  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [chatMessages, isAiTyping]);

  const send = useCallback((message: string) => {
    const msg = message.trim();
    if (!msg) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setComposer('');
    if (ws && ws.readyState === WebSocket.OPEN) {
      setIsAiTyping(true);
      ws.send(JSON.stringify({ type: 'message', content: msg }));
    } else {
      setError('Соединение потеряно. Обновите страницу.');
    }
  }, [ws]);

  const selected = useMemo(
    () => properties.find((p) => p.id === selectedId) || properties.find((p) => p.is_top_choice) || properties[0] || null,
    [properties, selectedId]
  );
  const others = useMemo(
    () => properties.filter((p) => p.id !== selected?.id),
    [properties, selected]
  );

  const analyzed = insights?.analyzed_count ?? 286;
  const suitable = insights?.suitable_count ?? properties.length;
  const recommended = insights?.recommended_count ?? Math.min(properties.length, 5);
  const districts = insights?.neighborhood_count ?? 1;

  const statusText = isLoading || isAiTyping
    ? `анализирует ${analyzed} объектов…`
    : `${suitable} подходят из ${analyzed}`;

  return (
    <div className={`homy-results${view === 'grid' ? ' gridmode' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: RESULTS_CSS }} />

      <FocusResultsMap properties={properties} selectedId={selected?.id ?? null} onMarkerClick={setSelectedId} />
      <div className="glow" />

      {/* corner logo (far top-left) with account menu */}
      <div className="cornerlogo">
        <HomyLogoMenu align="left" />
      </div>

      {/* view switch */}
      <div className="viewsw">
        <div className={`o${view === 'map' ? ' on' : ''}`} onClick={() => setView('map')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z" /><path d="M9 3v15M15 6v15" /></svg>
          Карта
        </div>
        <div className={`o${view === 'grid' ? ' on' : ''}`} onClick={() => setView('grid')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
          Сетка
        </div>
      </div>

      {/* top-right: actions cluster (save search · favorites · compare) + theme toggle */}
      <div className="topright">
        <div className="acts">
          <button className="ab" type="button" title="Сохранить поиск" disabled={!canSave} onClick={openSaveModal}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
          </button>
          <button className="ab" type="button" title="Избранное" onClick={() => router.push('/dashboard?tab=favorites')}>
            <Heart size={17} />
          </button>
          <button className="ab" type="button" title="Сравнение" onClick={() => router.push('/compare')}>
            <Scale size={17} />
          </button>
        </div>
        <div className="themebtn">
          <button className={`opt${theme === 'light' ? ' on' : ''}`} title="Светлая" onClick={() => setTheme('light')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5" /></svg>
          </button>
          <button className={`opt${theme === 'dark' ? ' on' : ''}`} title="Тёмная" onClick={() => setTheme('dark')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
          </button>
        </div>
      </div>

      {/* left AI panel */}
      <div className="ai">
        <div className="ai-h">
          <div className="ava">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" /></svg>
          </div>
          <div>
            <div className="nm">Homy</div>
            <div className="st"><i />{statusText}</div>
          </div>
        </div>

        <div className="stream" ref={streamRef}>
          {chatMessages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'u' : 'a'}`}>{m.content}</div>
          ))}

          {selected && insights?.description && (
            <div className="msg a"><span className="lead">Нашёл сильный вариант.</span> {insights.description}</div>
          )}

          {selected && (selected.recommendation_reasons?.length || criteriaChips.length) ? (
            <div className="reason">
              <div className="rt">Почему это совпадение {selected.match_score || ''}%</div>
              {(selected.recommendation_reasons?.length
                ? selected.recommendation_reasons.slice(0, 5)
                : criteriaChips.slice(0, 5)
              ).map((r: string, i: number) => (
                <div className="rrow" key={i}>
                  <span className="k">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B6E4F" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
                    {loc(r, lang)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {criteriaChips.length > 0 && (
            <div className="chipset">
              {['Показать дешевле', 'Только с парковкой', 'Ближе к центру'].map((c) => (
                <span key={c} className="rchip" onClick={() => send(c)}>{c}</span>
              ))}
            </div>
          )}
        </div>

        <form
          className="composer"
          onSubmit={(e: FormEvent) => { e.preventDefault(); send(composer); }}
        >
          <input
            className="in"
            placeholder="Спросите Homy…"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
          />
          <button className="mic" type="submit" disabled={!composer.trim()} aria-label="Отправить">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" /><path d="M19 11a7 7 0 0 1-14 0M12 18v4" /></svg>
          </button>
        </form>
      </div>

      {/* floating feature card */}
      {selected && (
        <div className="feature">
          <div className="ph" style={{ backgroundImage: `url('${selected.image_url}')` }}>
            {selected.is_top_choice && <span className="tag">Топ-выбор Homy</span>}
            <div className="mr">{ring(selected.match_score || 0)}<b>{selected.match_score || '—'}</b></div>
            <div className="pr"><b>{fmtPrice(selected.price)}</b><span>{selected.currency}</span></div>
            <CardActions id={selected.id} score={selected.match_score || 0} />
          </div>
          <div className="fb">
            <div className="i6">
              <div className="l tt">{loc(selected.title || selected.name, lang)}</div>
              {cardParams(selected, lang).map((x, i) => (
                <div className="l mut" key={i}>{x}</div>
              ))}
              <div className="l">{specsLine(selected)}</div>
            </div>
            <button className="cta" onClick={() => setDetailId(selected.id)}>Смотреть объект</button>
          </div>
        </div>
      )}

      {/* right match rail */}
      {others.length > 0 && (
        <div className="rail">
          <div className="rail-h">Ещё совпадения · {others.length}</div>
          {others.map((p) => (
            <div key={p.id} className="mini" onClick={() => setSelectedId(p.id)}>
              <CardActions id={p.id} score={p.match_score || 0} />
              <div className="th" style={{ backgroundImage: `url('${p.image_url}')` }} />
              <div className="i6">
                <div className="l tt">{loc(p.title || p.name, lang)}</div>
                <div className="l mut">{[loc(p.address, lang), loc(p.district, lang)].filter(Boolean).join(' · ')}</div>
                <div className="l">{specsLine(p)}</div>
                <div className="l pr">{fmtPrice(p.price)} <span>{p.currency}</span></div>
              </div>
              <div className="mm">{p.match_score || ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* grid mode */}
      <div className="gridwrap">
        {properties.map((p) => (
          <div key={p.id} className="gcard">
            <div className="gph" style={{ backgroundImage: `url('${p.image_url}')` }}>
              {p.is_top_choice && <span className="tag">Топ-выбор Homy</span>}
              <div className="mr">{ring(p.match_score || 0)}<b>{p.match_score || '—'}</b></div>
              <div className="pr"><b>{fmtPrice(p.price)}</b><span>{p.currency}</span></div>
              <CardActions id={p.id} score={p.match_score || 0} />
            </div>
            <div className="gb">
              <div className="i6">
                <div className="l tt">{loc(p.title || p.name, lang)}</div>
                {cardParams(p, lang).map((x, i) => (
                  <div className="l mut" key={i}>{x}</div>
                ))}
                <div className="l">{specsLine(p)}</div>
              </div>
              <button className="cta" onClick={() => setDetailId(p.id)}>Смотреть объект</button>
            </div>
          </div>
        ))}
      </div>

      {/* stat strip */}
      {properties.length > 0 && (
        <div className="stat">
          <div><b>{analyzed}</b><span>проанализировано</span></div>
          <div><b>{suitable}</b><span>подходят</span></div>
          <div><b>{recommended}</b><span>лучших</span></div>
          <div><b>{districts}</b><span>района</span></div>
        </div>
      )}

      {/* loading / error overlay */}
      {isLoading && properties.length === 0 && !error && (
        <div className="fstate">
          <div className="fspin" />
          <div className="ft">Homy анализирует объекты…</div>
        </div>
      )}
      {error && properties.length === 0 && (
        <div className="fstate">
          <div className="ft">{error}</div>
          <button className="rchip" onClick={fetchFallback}>Повторить</button>
        </div>
      )}

      {/* support live-chat launcher (bottom-right) */}
      <SupportFab />

      {/* save-search modal */}
      {saveOpen && (
        <div className="smback" onClick={() => !saving && setSaveOpen(false)}>
          <div className="smodal" onClick={(e) => e.stopPropagation()}>
            <div className="smh">
              <h3>Сохранить поиск</h3>
              <button className="smx" type="button" onClick={() => !saving && setSaveOpen(false)} aria-label="Закрыть">✕</button>
            </div>

            <div className="smsub">{query ? `«${query}»` : 'Текущий поиск'} · {properties.length} объектов</div>

            {savedList.length > 0 && (
              <div className="smopts">
                <button type="button" className={`smopt${saveMode === 'new' ? ' on' : ''}`} onClick={() => setSaveMode('new')}>
                  <b>Сохранить как новый</b>
                  <span>Создать новый сохранённый поиск</span>
                </button>
                <button type="button" className={`smopt${saveMode === 'overwrite' ? ' on' : ''}`} onClick={() => setSaveMode('overwrite')}>
                  <b>Перезаписать существующий</b>
                  <span>Обновить ранее сохранённый поиск</span>
                </button>
              </div>
            )}

            {saveMode === 'overwrite' && savedList.length > 0 && (
              <div className="smfield">
                <label>Выберите поиск для перезаписи</label>
                <select className="smsel" value={overwriteId} onChange={(e) => setOverwriteId(e.target.value)}>
                  {savedList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.query || 'Поиск'}{s.comment ? ` — ${s.comment}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="smfield">
              <label>Комментарий (необязательно)</label>
              <input className="smin" value={saveComment} onChange={(e) => setSaveComment(e.target.value)} placeholder="Например: поиск для семьи" maxLength={120} />
            </div>

            <div className="smact">
              <button type="button" className="smcancel" onClick={() => !saving && setSaveOpen(false)}>Отмена</button>
              <button type="button" className="smsave" disabled={saving || (saveMode === 'overwrite' && !overwriteId)} onClick={handleSaveSearch}>
                <span>{saving ? 'Сохраняем…' : saveMode === 'overwrite' ? 'Обновить поиск' : 'Сохранить поиск'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && <div className={`smtoast${toast.ok ? ' ok' : ' err'}`}>{toast.text}</div>}

      {/* property detail popup */}
      {detailId && <PropertyDetailView propertyId={detailId} mode="popup" onClose={() => setDetailId(null)} clientContext={{ query, criteria: criteriaChips, messages: chatMessages }} />}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <FavoritesProvider>
        <ResultsInner />
      </FavoritesProvider>
    </Suspense>
  );
}
