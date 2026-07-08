'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PropertyShowcase } from '@/lib/types';

interface Neighborhood {
  name: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
}

const neighborhoods: Neighborhood[] = [
  { name: 'Arabkir', lat: 40.205, lng: 44.505, radius: 1800, color: '#0A6045' },
  { name: 'Kentron', lat: 40.179, lng: 44.515, radius: 1400, color: '#B8B0A0' },
  { name: 'Kanaker-Zeytun', lat: 40.215, lng: 44.535, radius: 1600, color: '#C8C0B5' },
];

interface ResultsMapProps {
  properties: PropertyShowcase[];
  selectedId: string | null;
  onMarkerClick?: (id: string) => void;
  fullBg?: boolean;
}

export default function ResultsMap({
  properties,
  selectedId,
  onMarkerClick,
  fullBg,
}: ResultsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const initializingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || initializingRef.current) return;

    // Check if container already has a Leaflet map (from previous mount)
    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id) {
      // Container already initialized, skip
      return;
    }

    initializingRef.current = true;

    // Dynamic import Leaflet
    import('leaflet').then((L) => {
      // Check again in case component unmounted during import
      if (!mapContainerRef.current || mapInstanceRef.current) {
        initializingRef.current = false;
        return;
      }

      // Double-check container not initialized during async import
      if ((mapContainerRef.current as any)._leaflet_id) {
        initializingRef.current = false;
        return;
      }

      // Fix default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Create map
      const map = L.map(mapContainerRef.current!, {
        center: [40.195, 44.515],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Add tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

      // Add neighborhood circles
      neighborhoods.forEach((n) => {
        L.circle([n.lat, n.lng], {
          radius: n.radius,
          color: n.color,
          fillColor: n.color,
          fillOpacity: 0.04,
          weight: 1,
          dashArray: '6 6',
          opacity: 0.5,
        }).addTo(map);
      });

      mapInstanceRef.current = map;
      setIsReady(true);
    });

    // Cleanup
    return () => {
      initializingRef.current = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current || !isReady) return;

    const L = require('leaflet');
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Clear old selection circles
    circlesRef.current.forEach((circle) => circle.remove());
    circlesRef.current = [];

    // Add new markers
    properties.forEach((prop) => {
      const lat = Number(prop.latitude);
      const lng = Number(prop.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const isSelected = prop.id === selectedId;
      const isTop = prop.is_top_choice;
      const size = isSelected ? 32 : 24;
      const color = isTop ? '#0A6045' : isSelected ? '#0A6045' : '#8C8880';

      const svg = `
        <svg width="${size}" height="${size + 6}" viewBox="0 0 ${size} ${size + 6}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="${size / 2}" cy="${size + 1}" rx="${size / 2.5}" ry="${size / 8}" fill="rgba(0,0,0,0.12)"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="white" stroke="${color}" stroke-width="2.5"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 5}" fill="${color}"/>
        </svg>
      `;

      const icon = L.divIcon({
        html: svg,
        className: '',
        iconSize: [size, size + 6],
        iconAnchor: [size / 2, size + 3],
        popupAnchor: [0, -size],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on('click', () => onMarkerClick?.(prop.id));
      markersRef.current.push(marker);
    });

    // Add selection circles
    const selectedProp = properties.find((p) => p.id === selectedId);
    if (selectedProp) {
      const lat = Number(selectedProp.latitude);
      const lng = Number(selectedProp.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const circle1 = L.circle([lat, lng], {
          radius: 500,
          color: '#0A6045',
          fillColor: '#0A6045',
          fillOpacity: 0.03,
          weight: 1,
          opacity: 0.4,
        }).addTo(map);
        circlesRef.current.push(circle1);

        const circle2 = L.circle([lat, lng], {
          radius: 1000,
          color: '#0A6045',
          fillColor: '#0A6045',
          fillOpacity: 0.02,
          weight: 0.5,
          opacity: 0.25,
          dashArray: '4 8',
        }).addTo(map);
        circlesRef.current.push(circle2);
      }
    }
  }, [properties, selectedId, onMarkerClick, isReady]);

  // Fly to selected property
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedId || !isReady) return;

    const prop = properties.find((p) => p.id === selectedId);
    if (!prop) return;

    const lat = Number(prop.latitude);
    const lng = Number(prop.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    try {
      mapInstanceRef.current.flyTo([lat, lng], 14, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } catch {
      // Ignore animation errors
    }
  }, [selectedId, properties, isReady]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: '#EDE9E1' }}>
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[300px]"
        style={{ backgroundColor: '#EDE9E1' }}
      />

      {!fullBg && (
        <div
          className="absolute bottom-4 left-4 rounded-xl px-3.5 py-2.5 text-[10px] font-body space-y-1 z-[1000]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(200, 196, 188, 0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: '#0A6045' }}
            />
            <span style={{ color: '#5C5A55' }}>Recommended properties</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: '#8C8880' }}
            />
            <span style={{ color: '#5C5A55' }}>Other matches</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-0.5 flex-shrink-0"
              style={{ borderTop: '1px dashed #B5B3AD' }}
            />
            <span style={{ color: '#5C5A55' }}>Neighborhood zone</span>
          </div>
        </div>
      )}
    </div>
  );
}
