'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, MapPin, Bed, Maximize2, DollarSign } from 'lucide-react';
import { useCompare } from '@/lib/contexts/CompareContext';
import { PropertyShowcase } from '@/lib/types';
import { useT, getLocalized } from '@/lib/i18n';

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)',
};

interface ComparePropertyCardsProps {
  onPropertiesLoaded?: (properties: PropertyShowcase[]) => void;
}

export default function ComparePropertyCards({ onPropertiesLoaded }: ComparePropertyCardsProps) {
  const { compareList, removeFromCompare, isHydrated } = useCompare();
  const { t, lang } = useT();
  const [properties, setProperties] = useState<PropertyShowcase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch properties by IDs
  useEffect(() => {
    if (!isHydrated) return;

    if (compareList.length === 0) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const idsParam = compareList.map(item => item.id).join(',');
        const searchContext = typeof window !== 'undefined'
          ? sessionStorage.getItem('homy_search_context') || ''
          : '';
        const response = await fetch(`/api/properties?ids=${idsParam}&search_context=${encodeURIComponent(searchContext)}`);

        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const data = await response.json();
        const fetchedProperties = data.properties || [];

        // Apply saved match_score from compareList
        compareList.forEach(item => {
          const prop = fetchedProperties.find((p: any) => p.id === item.id);
          if (prop) prop.match_score = item.match_score;
        });

        setProperties(fetchedProperties);
        onPropertiesLoaded?.(fetchedProperties);
      } catch (err) {
        console.error('Error fetching compare properties:', err);
        setError('Не удалось загрузить объекты');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [compareList, onPropertiesLoaded, isHydrated]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 rounded-2xl p-4 animate-pulse"
            style={glassStyle}
          >
            <div className="aspect-[16/10] bg-gray-200 rounded-xl mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="p-6 rounded-2xl text-center" style={glassStyle}>
        <p className="text-gray-500 text-sm">
          {t('compare.noProperties') || 'Нет объектов для сравнения'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {properties.map((property) => {
        const title = getLocalized(property.title, lang);
        const neighborhood = getLocalized(property.neighborhood, lang);

        return (
          <div
            key={property.id}
            className="flex-shrink-0 w-72 rounded-2xl overflow-hidden relative group"
            style={glassStyle}
          >
            {/* Remove button */}
            <button
              onClick={() => removeFromCompare(property.id)}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
              }}
              title="Убрать из сравнения"
            >
              <X size={14} style={{ color: '#FFF' }} />
            </button>

            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={property.image_url || '/placeholder.jpg'}
                alt={title}
                fill
                sizes="288px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

              {/* Price overlay */}
              <div className="absolute bottom-2 left-2">
                <span className="text-white text-[14px] font-semibold font-body">
                  {property.price?.toLocaleString()} {property.currency || 'AMD'}
                </span>
              </div>

              {/* Match score */}
              {property.match_score && (
                <div
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    color: property.match_score >= 90 ? '#16A34A' : '#3D3B37',
                  }}
                >
                  {property.match_score}%
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-3">
              {/* Location */}
              <div className="flex items-center gap-1 mb-1.5">
                <MapPin size={11} style={{ color: '#757570' }} />
                <span className="text-[11px] font-body" style={{ color: '#757570' }}>
                  {neighborhood || property.district}
                </span>
              </div>

              {/* Title */}
              <h4
                className="text-[13px] font-body font-semibold leading-snug mb-2 line-clamp-2"
                style={{ color: '#1A1A1A' }}
              >
                {title || property.address}
              </h4>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[11px] font-body" style={{ color: '#5C5A55' }}>
                <div className="flex items-center gap-1">
                  <Bed size={12} style={{ color: '#757570' }} />
                  <span>{property.bedrooms || property.rooms}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Maximize2 size={12} style={{ color: '#757570' }} />
                  <span>{property.size_sqm || property.area} м²</span>
                </div>
                {property.floor && (
                  <span>Этаж {property.floor}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
