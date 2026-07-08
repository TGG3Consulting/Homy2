'use client';

import { Property } from '@/lib/types';
import Image from 'next/image';
import { useT, getLocalized } from '@/lib/i18n';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { lang } = useT();
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Property image */}
      <div className="relative h-48 bg-gray-200">
        <Image
          src={property.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'}
          alt={getLocalized(property.title, lang)}
          fill
          className="object-cover"
          unoptimized
        />
        {property.match_score !== undefined && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            {property.match_score}% Match
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* District badge */}
        <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium mb-2">
          {property.district}
        </span>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{getLocalized(property.title, lang)}</h3>

        {/* Address */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-1">{getLocalized(property.address, lang)}</p>

        {/* Price */}
        <div className="text-2xl font-bold text-emerald-600 mb-3">
          ${property.price.toLocaleString()}
        </div>

        {/* Property details */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {property.rooms} beds
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {property.bathrooms} baths
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            {property.area}m²
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Floor {property.floor}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {getLocalized(property.description, lang)}
        </p>

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {property.features.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {feature}
              </span>
            ))}
            {property.features.length > 3 && (
              <span className="text-xs text-emerald-600 font-medium">
                +{property.features.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Developer */}
        {property.developer && (
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-medium">Developer:</span> {property.developer}
          </p>
        )}

        {/* View Details button */}
        <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded transition-colors">
          View Details
        </button>
      </div>
    </div>
  );
}
