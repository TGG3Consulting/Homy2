'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Scale, Trash2 } from 'lucide-react';
import { useCompare } from '@/lib/contexts/CompareContext';
import { useT, getLocalized } from '@/lib/i18n';
import { PropertyShowcase } from '@/lib/types';

interface PropertyPreview {
  id: string;
  title: string;
  image_url: string;
  price: number;
}

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare, maxItems } = useCompare();
  const { t, lang } = useT();
  const [properties, setProperties] = useState<PropertyPreview[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch property details when compare list changes
  useEffect(() => {
    if (compareList.length === 0) {
      setProperties([]);
      return;
    }

    const fetchProperties = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/properties?ids=${compareList.map(item => item.id).join(',')}`);
        if (response.ok) {
          const data = await response.json();
          setProperties(
            data.properties.map((p: PropertyShowcase) => ({
              id: p.id,
              title: p.title || p.name || 'Property',
              image_url: p.image_url || p.imageUrl || '/placeholder-property.jpg',
              price: p.price,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch compare properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [compareList]);

  // Don't render if no properties in compare list
  if (compareList.length === 0) {
    return null;
  }

  const glassStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/50 shadow-2xl"
      style={glassStyle}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Property mini cards */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto">
            {loading ? (
              <div className="flex gap-3">
                {compareList.map((item) => (
                  <div
                    key={item.id}
                    className="w-32 h-20 bg-gray-100 rounded-lg animate-pulse flex-shrink-0"
                  />
                ))}
              </div>
            ) : (
              properties.map((property) => (
                <div
                  key={property.id}
                  className="relative flex-shrink-0 w-36 bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm group"
                >
                  <button
                    onClick={() => removeFromCompare(property.id)}
                    className="absolute top-1 right-1 z-10 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t('compare.remove')}
                  >
                    <X size={12} className="text-white" />
                  </button>
                  <img
                    src={property.image_url}
                    alt={getLocalized(property.title, lang)}
                    className="w-full h-14 object-cover"
                  />
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium text-gray-800 truncate">
                      {getLocalized(property.title, lang)}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {property.price.toLocaleString()} AMD
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Empty slots */}
            {Array.from({ length: maxItems - compareList.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex-shrink-0 w-36 h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-[10px] text-gray-400">{t('compare.addProperty')}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500 hidden sm:inline">
              {compareList.length}/{maxItems}
            </span>

            <button
              onClick={clearCompare}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title={t('compare.clearAll')}
            >
              <Trash2 size={16} className="text-gray-500" />
            </button>

            <Link
              href="/compare"
              className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200"
              style={{
                backgroundColor: 'rgb(10, 96, 69)',
                color: '#FFF',
              }}
            >
              <Scale size={14} />
              <span>{t('compare.compareNow')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
