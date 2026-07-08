'use client';

import Image from 'next/image';
import { useState } from 'react';
import { t, Language, detectLanguage, getLocalized } from '@/lib/i18n';

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

interface PropertyDetailProps {
  property: {
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
  };
  onClose: () => void;
  lang?: Language;
}

export default function PropertyDetail({ property, onClose, lang: propLang }: PropertyDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const lang: Language = propLang || detectLanguage(property.name);

  // Собираем все изображения (реальные или placeholder)
  const realImages = property.images?.length
    ? property.images
    : property.image_url
      ? [property.image_url]
      : [];

  // Если нет реальных фото — используем placeholder
  const placeholderIndex = property._index ?? 0;
  const images = realImages.length > 0 && !imageError
    ? realImages
    : PLACEHOLDER_IMAGES.slice(placeholderIndex, placeholderIndex + 3);

  const isPlaceholder = realImages.length === 0 || imageError;

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === 0) return '—';
    return '$' + numPrice.toLocaleString('en-US');
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Gallery - ВСЕГДА показываем фото */}
        <div className="relative h-72 bg-gradient-to-br from-emerald-100 to-emerald-200">
          <Image
            src={images[currentImageIndex]}
            alt={getLocalized(property.name, lang)}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />

          {/* Placeholder badge */}
          {isPlaceholder && (
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-sm text-white">
              {t('photoExample', lang)} • {t('photoOnSite', lang)}
            </div>
          )}

          {/* Image navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Image counter */}
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 rounded-full text-white text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Source badge */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
            {property.source_name || t('source', lang)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{getLocalized(property.name, lang)}</h2>
            {property.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{getLocalized(property.address, lang)}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-xl mb-6">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-bold">{formatPrice(property.price)}</span>
                {property.pricePerSqm && property.pricePerSqm > 0 && (
                  <span className="ml-3 text-emerald-100">
                    (${property.pricePerSqm.toLocaleString('en-US')}/{t('sqm', lang)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Area */}
            {property.area && Number(property.area) > 0 && (
              <div className="bg-emerald-50 p-4 rounded-xl text-center">
                <svg className="w-6 h-6 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <div className="text-xl font-bold text-gray-900">{property.area} {t('sqm', lang)}</div>
                <div className="text-sm text-gray-500">{t('area', lang)}</div>
              </div>
            )}

            {/* Rooms */}
            {property.rooms && Number(property.rooms) > 0 && (
              <div className="bg-emerald-50 p-4 rounded-xl text-center">
                <svg className="w-6 h-6 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div className="text-xl font-bold text-gray-900">{property.rooms}</div>
                <div className="text-sm text-gray-500">{t('roomsLabel', lang)}</div>
              </div>
            )}

            {/* Completion Date */}
            {property.completionDate && (
              <div className="bg-emerald-50 p-4 rounded-xl text-center">
                <svg className="w-6 h-6 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-xl font-bold text-gray-900">{property.completionDate}</div>
                <div className="text-sm text-gray-500">{t('completion', lang)}</div>
              </div>
            )}

            {/* Developer */}
            {property.developer && (
              <div className="bg-emerald-50 p-4 rounded-xl text-center">
                <svg className="w-6 h-6 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="text-lg font-bold text-gray-900 truncate">{property.developer}</div>
                <div className="text-sm text-gray-500">{t('developer', lang)}</div>
              </div>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('description', lang)}</h3>
              <p className="text-gray-600 leading-relaxed">{getLocalized(property.description, lang)}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <a
              href={property.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-xl transition-all text-center"
            >
              <span className="flex items-center justify-center gap-2">
                {t('viewOnSite', lang)}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
            </a>
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-xl transition-all"
            >
              {t('close', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
