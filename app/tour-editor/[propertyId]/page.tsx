'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as THREE from 'three';
import { ArrowLeft, Plus, Trash2, MapPin, Save } from 'lucide-react';

interface Hotspot { target_room_id: string; x: number; y: number; }
interface Room {
  id: string;
  name: { en: string; ru: string; hy: string };
  panorama_url: string;
  hotspots: Hotspot[];
  order_index: number;
}

export default function TourEditorPage() {
  const propertyId = String(useParams().propertyId || '');
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);        // add-hotspot mode
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState({ name_ru: '', panorama_url: '' });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const selected = rooms.find((r) => r.id === selectedId) || null;

  const api = `/api/properties/${propertyId}/virtual-tour`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${api}?manage=true`, { credentials: 'include' });
      if (!res.ok) throw new Error(res.status === 403 ? 'Нет доступа к этому объекту' : 'Не удалось загрузить тур');
      const d = await res.json();
      setRooms(d.rooms || []);
      setEnabled(!!d.enabled);
      setSelectedId((prev) => prev || (d.rooms?.[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  // ---- Three.js panorama (static default view) ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !selected?.panorama_url) return;
    const width = el.clientWidth, height = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(0, 0, 0.01);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(50, 64, 32);
    let material: THREE.MeshBasicMaterial | null = null;
    let mesh: THREE.Mesh | null = null;
    let disposed = false;

    new THREE.TextureLoader().load(
      selected.panorama_url,
      (texture) => {
        if (disposed) return;
        material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        camera.lookAt(1, 0, 0);
        renderer.render(scene, camera);
      },
      undefined,
      () => { /* leave the placeholder background if the panorama fails to load */ }
    );

    return () => {
      disposed = true;
      geometry.dispose();
      material?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [selected?.id, selected?.panorama_url]);

  const flash = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(null), 2500); };

  const addRoom = async () => {
    if (!newRoom.name_ru.trim() || !newRoom.panorama_url.trim()) { setError('Укажите название и URL панорамы'); return; }
    setError(null);
    try {
      const res = await fetch(api, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(newRoom),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Не удалось добавить');
      setNewRoom({ name_ru: '', panorama_url: '' });
      setSelectedId(d.room.id);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const patchRoom = async (roomId: string, body: Record<string, unknown>) => {
    const res = await fetch(`${api}/${roomId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Не удалось сохранить'); }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const res = await fetch(`${api}/${roomId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось удалить');
      if (selectedId === roomId) setSelectedId(null);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const toggleEnabled = async () => {
    const next = !enabled;
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ virtual_tour_enabled: next }),
      });
      if (!res.ok) throw new Error('Не удалось переключить');
      setEnabled(next);
      flash(next ? 'Тур включён' : 'Тур выключен');
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // Click on the panorama in add-mode → place a hotspot at normalized screen coords.
  const onPanoramaClick = async (e: React.MouseEvent) => {
    if (!adding || !selected) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const others = rooms.filter((r) => r.id !== selected.id);
    if (others.length === 0) { setError('Добавьте ещё одну комнату, чтобы связать переход'); setAdding(false); return; }
    const target = others.length === 1
      ? others[0].id
      : (window.prompt(`Целевая комната (введите номер):\n${others.map((r, i) => `${i + 1}. ${r.name.ru}`).join('\n')}`) || '');
    let targetId = '';
    if (others.length === 1) targetId = others[0].id;
    else { const idx = parseInt(target) - 1; if (idx >= 0 && idx < others.length) targetId = others[idx].id; }
    if (!targetId) { setAdding(false); return; }
    const hotspots = [...(selected.hotspots || []), { target_room_id: targetId, x, y }];
    try {
      await patchRoom(selected.id, { hotspots });
      setAdding(false);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const removeHotspot = async (idx: number) => {
    if (!selected) return;
    const hotspots = (selected.hotspots || []).filter((_, i) => i !== idx);
    try { await patchRoom(selected.id, { hotspots }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name.ru || '—';

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/10"><ArrowLeft size={18} /></button>
        <h1 className="text-lg font-semibold">Редактор виртуального тура</h1>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={toggleEnabled} className="accent-emerald-500" />
          Тур включён
        </label>
      </div>

      {(error || msg) && (
        <div className={`px-6 py-2 text-sm ${error ? 'text-red-300' : 'text-emerald-300'}`}>{error || msg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 p-6">
        {/* Rooms panel */}
        <div className="space-y-4">
          <div className="rounded-xl p-4 bg-white/5 border border-white/10">
            <h2 className="text-sm uppercase text-gray-500 mb-3">Комнаты</h2>
            {loading ? (
              <p className="text-sm text-gray-400">Загрузка…</p>
            ) : rooms.length === 0 ? (
              <p className="text-sm text-gray-400">Комнат нет — добавьте первую.</p>
            ) : (
              <div className="space-y-2">
                {rooms.map((r) => (
                  <div key={r.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 border cursor-pointer ${selectedId === r.id ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`} onClick={() => setSelectedId(r.id)}>
                    <span className="flex-1 text-sm truncate">{r.name.ru}</span>
                    <span className="text-xs text-gray-500">{(r.hotspots || []).length} <MapPin size={10} className="inline" /></span>
                    <button onClick={(e) => { e.stopPropagation(); deleteRoom(r.id); }} className="p-1 rounded hover:bg-red-500/20" title="Удалить комнату"><Trash2 size={14} className="text-red-400" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl p-4 bg-white/5 border border-white/10 space-y-2">
            <h2 className="text-sm uppercase text-gray-500">Добавить комнату</h2>
            <input placeholder="Название (напр. Гостиная)" value={newRoom.name_ru} onChange={(e) => setNewRoom((s) => ({ ...s, name_ru: e.target.value }))} className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]" />
            <input placeholder="URL панорамы (equirectangular)" value={newRoom.panorama_url} onChange={(e) => setNewRoom((s) => ({ ...s, panorama_url: e.target.value }))} className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0A6045]" />
            <button onClick={addRoom} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0A6045] hover:bg-[#0B6E4F] text-sm"><Plus size={15} />Добавить</button>
          </div>
        </div>

        {/* Panorama + hotspots */}
        <div className="space-y-3">
          {!selected ? (
            <div className="rounded-xl bg-white/5 border border-white/10 h-[60vh] flex items-center justify-center text-gray-500">Выберите комнату</div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setAdding((v) => !v)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${adding ? 'bg-amber-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}>
                  <MapPin size={15} />{adding ? 'Кликните по панораме…' : 'Добавить переход'}
                </button>
                <span className="text-sm text-gray-400">{selected.name.ru}</span>
              </div>
              <div
                ref={containerRef}
                onClick={onPanoramaClick}
                className={`relative rounded-xl overflow-hidden border border-white/10 bg-black h-[60vh] ${adding ? 'cursor-crosshair' : ''}`}
              >
                {/* existing hotspots */}
                {(selected.hotspots || []).map((hs, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); removeHotspot(i); }}
                    style={{ left: `${hs.x * 100}%`, top: `${hs.y * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 hover:bg-red-500 text-xs text-white shadow-lg"
                    title={`→ ${roomName(hs.target_room_id)} (клик — удалить)`}
                  >
                    <MapPin size={11} />{roomName(hs.target_room_id)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">Переходы отображаются поверх панорамы. «Добавить переход» → кликните точку → выберите целевую комнату. Клик по метке — удалить.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
