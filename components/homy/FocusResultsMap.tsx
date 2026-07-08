'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PropertyShowcase } from '@/lib/types';

interface FocusResultsMapProps {
  properties: PropertyShowcase[];
  selectedId: string | null;
  onMarkerClick?: (id: string) => void;
}

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function fmtPrice(p: number): string {
  if (!p) return '—';
  if (p >= 1000) return Math.round(p).toLocaleString('ru-RU').replace(/,/g, ' ');
  return String(p);
}

/** Full-bleed Leaflet map with Homy price-bubble markers, theme-aware tiles. */
export default function FocusResultsMap({
  properties,
  selectedId,
  onMarkerClick,
}: FocusResultsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const initRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Track dark class on <html>
  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains('dark'));
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current || initRef.current) return;
    if ((containerRef.current as any)._leaflet_id) return;
    initRef.current = true;

    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) {
        initRef.current = false;
        return;
      }
      const map = L.map(containerRef.current, {
        center: [40.185, 44.515],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });
      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      tileRef.current = L.tileLayer(
        document.documentElement.classList.contains('dark') ? DARK_TILES : LIGHT_TILES,
        { subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map);
      mapRef.current = map;
      setReady(true);
    });

    return () => {
      initRef.current = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  // Swap tiles on theme change
  useEffect(() => {
    if (!ready || !mapRef.current || !tileRef.current) return;
    tileRef.current.setUrl(isDark ? DARK_TILES : LIGHT_TILES);
  }, [isDark, ready]);

  // Render price markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = require('leaflet');
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const pts: [number, number][] = [];

    properties.forEach((prop) => {
      const lat = Number(prop.latitude);
      const lng = Number(prop.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const isSel = prop.id === selectedId;
      const isTop = prop.is_top_choice || isSel;
      const label = isTop
        ? `${fmtPrice(prop.price)} · ${prop.match_score ?? ''}%`.replace('· %', '').trim()
        : fmtPrice(prop.price);
      const cls = 'mk' + (isTop ? ' top' : '') + (!isTop ? ' dim' : '');

      const icon = L.divIcon({
        html: `<span class="${cls}">${label}</span>`,
        className: '',
        iconSize: undefined as any,
        iconAnchor: [0, 0],
      });
      const marker = L.marker([lat, lng], { icon, riseOnHover: true }).addTo(map);
      marker.on('click', () => onMarkerClick?.(prop.id));
      markersRef.current.push(marker);
      pts.push([lat, lng]);
    });

    // Fit bounds once when we first get properties (no selection yet)
    if (pts.length > 0 && !selectedId) {
      try {
        map.fitBounds(pts as any, { padding: [420, 360], maxZoom: 15 });
      } catch {}
    }
  }, [properties, selectedId, onMarkerClick, ready]);

  // Fly to selection
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedId) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (!prop) return;
    const lat = Number(prop.latitude);
    const lng = Number(prop.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;
    try {
      mapRef.current.flyTo([lat, lng], 14, { duration: 1.1, easeLinearity: 0.25 });
    } catch {}
  }, [selectedId, properties, ready]);

  return <div ref={containerRef} className="fmap" />;
}
