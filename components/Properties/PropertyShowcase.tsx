'use client';

import Image from 'next/image';
import { useState } from 'react';
import PropertyDetail from './PropertyDetail';
import { detectLanguage, t, Language, getLocalized } from '@/lib/i18n';

// Качественные placeholder фото недвижимости
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
];

// Получить placeholder по индексу (стабильный для каждого объекта)
function getPlaceholderImage(index: number): string {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

interface ShowcaseProperty {
  name: string;
  address: string;
  price: number | string;
  pricePerSqm?: number;
  area: number | string;
  rooms: number | string;
  completionDate?: string;
  developer?: string;
  description?: string;
  images?: string[];
  image_url?: string;
  source_url: string;
  source_name?: string;
  _index?: number;
}

interface PropertyShowcaseProps {
  properties: ShowcaseProperty[];
  lang?: Language;
}

function PropertyShowcaseCard({
  property,
  onClick,
  index,
  lang,
}: {
  property: ShowcaseProperty;
  onClick: () => void;
  index: number;
  lang: Language;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === 0) return '—';
    return '$' + numPrice.toLocaleString('en-US');
  };

  // Получаем изображение: реальное или placeholder
  const realImage = property.images?.[0] || property.image_url;
  const imageUrl = (realImage && !imageError) ? realImage : getPlaceholderImage(index);
  const isPlaceholder = !realImage || imageError;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] border border-gray-100 group cursor-pointer"
    >
      {/* Image container - ВСЕГДА показываем фото */}
      <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 z-10">
            <div className="w-10 h-10 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        )}
        <Image
          src={imageUrl}
          alt={getLocalized(property.name, lang)}
          fill
          className={`object-cover transition-all duration-500 group-hover:scale-110 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoading(false)}
          unoptimized
        />

        {/* Placeholder badge */}
        {isPlaceholder && !imageLoading && (
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
            {t('photoExample', lang)}
          </div>
        )}

        {/* Completion date badge */}
        {property.completionDate && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
            📅 {property.completionDate}
          </div>
        )}

        {/* Source badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
          {property.source_name || t('source', lang)}
        </div>

        {/* Click indicator */}
        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-emerald-600 shadow-lg">
            {t('details', lang)} →
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {getLocalized(property.name, lang)}
        </h3>

        {/* Address */}
        {property.address && (
          <div className="flex items-start gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs text-gray-600 line-clamp-1">{getLocalized(property.address, lang)}</p>
          </div>
        )}

        {/* Price */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-2 rounded-lg mb-3 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold">{formatPrice(property.price)}</span>
            {property.pricePerSqm && property.pricePerSqm > 0 && (
              <span className="text-emerald-100 text-xs">${property.pricePerSqm}/{t('sqm', lang)}</span>
            )}
          </div>
        </div>

        {/* Area and Rooms */}
        <div className="flex items-center gap-2">
          {property.area && Number(property.area) > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="text-xs font-medium text-gray-700">{property.area} {t('sqm', lang)}</span>
            </div>
          )}

          {property.rooms && Number(property.rooms) > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium text-gray-700">{property.rooms} {t('rooms', lang)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertyShowcase({ properties, lang: propLang }: PropertyShowcaseProps) {
  const [selectedProperty, setSelectedProperty] = useState<ShowcaseProperty | null>(null);

  // Detect language from first property or default to 'ru'
  const lang: Language = propLang || (properties[0]?.name ? detectLanguage(properties[0].name) : 'ru');

  // Фильтруем невалидные объекты
  const validProperties = properties.filter(
    (p) => p.name && p.name.length > 1 && p.source_url && p.source_url.startsWith('http')
  );

  if (!validProperties || validProperties.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-emerald-50 rounded-2xl p-6 max-w-md mx-auto">
          <svg className="w-16 h-16 mx-auto mb-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-base font-semibold text-gray-700 mb-1">{t('noProperties', lang)}</p>
          <p className="text-sm text-gray-500">{t('askHomy', lang)}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fadeIn">
        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {validProperties.map((property, index) => (
            <PropertyShowcaseCard
              key={`${property.name}-${index}`}
              property={property}
              index={index}
              lang={lang}
              onClick={() => setSelectedProperty({ ...property, _index: index })}
            />
          ))}
        </div>
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          lang={lang}
        />
      )}
    </>
  );
}
