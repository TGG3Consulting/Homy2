'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  MapPin,
  Bed,
  Maximize2,
  Star,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PropertyShowcase } from '@/lib/types';
import { useT, getLocalized } from '@/lib/i18n';
import { api } from '@/lib/api/client';
import PropertyDetailModal from '@/components/homly/PropertyDetailModal';

// Extended property type with favorite metadata
interface FavoriteProperty extends PropertyShowcase {
  favoriteId: string;
  favoritedAt: string;
}

interface FavoritesListProps {
  onPropertySelect?: (property: PropertyShowcase) => void;
  className?: string;
}

// Skeleton loader for card
function FavoriteCardSkeleton() {
  return (
    <div
      className="flex-shrink-0 w-[280px] md:w-auto rounded-2xl overflow-hidden animate-pulse"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      <div className="aspect-[16/10] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl text-center"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
      >
        <Heart size={28} style={{ color: '#0A6045' }} />
      </div>
      <h3
        className="text-lg font-semibold font-body mb-2"
        style={{ color: '#1A1A1A' }}
      >
        {t('favorites.emptyTitle')}
      </h3>
      <p
        className="text-sm font-body max-w-xs"
        style={{ color: '#757570' }}
      >
        {t('favorites.emptyDescription')}
      </p>
    </div>
  );
}

// Individual favorite card
function FavoriteCard({
  property,
  onRemove,
  onClick,
  isRemoving,
  lang,
  t,
}: {
  property: FavoriteProperty;
  onRemove: (propertyId: string) => void;
  onClick: (property: FavoriteProperty) => void;
  isRemoving: boolean;
  lang: string;
  t: (key: string) => string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const title = getLocalized(property.title, lang as 'en' | 'ru' | 'hy');
  const neighborhood = getLocalized(property.neighborhood, lang as 'en' | 'ru' | 'hy');

  const glassStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(property.id);
  };

  return (
    <div
      className="flex-shrink-0 w-[280px] md:w-auto rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group"
      style={{
        ...glassStyle,
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered
          ? '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)'
          : '0 2px 8px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(property)}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={property.image_url || '/placeholder-property.jpg'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        {/* Match score badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold font-body"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            color: property.match_score >= 90 ? '#0A6045' : '#3D3B37',
          }}
        >
          {property.match_score}% {t('propertyCard.match')}
        </div>

        {/* Top choice badge */}
        {property.is_top_choice && (
          <div
            className="absolute top-3 right-12 px-2 py-1 rounded-full text-[9px] font-medium font-body uppercase tracking-wider flex items-center gap-1"
            style={{ backgroundColor: '#1A1A1A', color: '#FFF' }}
          >
            <Star size={9} fill="white" />
            {t('propertyCard.topChoice')}
          </div>
        )}

        {/* Remove favorite button */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
          }}
          title={t('favorites.remove')}
        >
          {isRemoving ? (
            <Loader2 size={14} className="animate-spin" style={{ color: '#757570' }} />
          ) : (
            <Heart size={14} fill="#EF4444" style={{ color: '#EF4444' }} />
          )}
        </button>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white text-[15px] font-semibold font-body tracking-tight">
            {property.price?.toLocaleString() || '0'} {property.currency || 'AMD'}
          </span>
          <span className="text-white/70 text-[11px] font-body ml-1">
            {t('propertyCard.month')}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={12} style={{ color: '#757570' }} />
          <span
            className="text-[12px] font-body font-medium truncate"
            style={{ color: '#757570' }}
          >
            {neighborhood}
          </span>
        </div>

        <h3
          className="text-[14px] font-body font-semibold leading-snug mb-3 line-clamp-2"
          style={{ color: '#1A1A1A' }}
        >
          {title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Bed size={13} style={{ color: '#757570' }} />
            <span className="text-[12px] font-body" style={{ color: '#3D3B37' }}>
              {property.bedrooms || property.rooms || 0}{' '}
              {(property.bedrooms || property.rooms || 0) === 1
                ? t('propertyCard.bed')
                : t('propertyCard.beds')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 size={13} style={{ color: '#757570' }} />
            <span className="text-[12px] font-body" style={{ color: '#3D3B37' }}>
              {property.size_sqm || property.area || 0} {t('propertyCard.sqm')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FavoritesList({ onPropertySelect, className = '' }: FavoritesListProps) {
  const { t, lang } = useT();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [selectedProperty, setSelectedProperty] = useState<PropertyShowcase | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Fetch favorites on mount
  const fetchFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/users/me/favorites', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setFavorites([]);
          return;
        }
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.favorites)) {
        setFavorites(data.favorites);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('[FavoritesList] Error fetching favorites:', err);
      setError(t('favorites.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Remove favorite handler
  const handleRemove = async (propertyId: string) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(propertyId));

      const response = await fetch('/api/users/me/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ propertyId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      const data = await response.json();
      if (data.success) {
        setFavorites((prev) => prev.filter((f) => f.id !== propertyId));
      }
    } catch (err) {
      console.error('[FavoritesList] Error removing favorite:', err);
      setError(t('favorites.errorRemoving'));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
    }
  };

  // Handle card click
  const handleCardClick = (property: FavoriteProperty) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    } else {
      setSelectedProperty(property);
    }
  };

  // Scroll handlers for horizontal scroll on mobile
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Glass morphism container style
  const containerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  };

  return (
    <div className={`rounded-3xl p-6 ${className}`} style={containerStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(10, 96, 69, 0.1)' }}
          >
            <Heart size={20} style={{ color: '#0A6045' }} />
          </div>
          <div>
            <h2
              className="text-lg font-semibold font-body"
              style={{ color: '#1A1A1A' }}
            >
              {t('favorites.title')}
            </h2>
            {favorites.length > 0 && (
              <p className="text-xs font-body" style={{ color: '#757570' }}>
                {favorites.length}{' '}
                {favorites.length === 1
                  ? t('favorites.property')
                  : t('favorites.properties')}
              </p>
            )}
          </div>
        </div>

        {/* Scroll buttons (visible on mobile when there are favorites) */}
        {favorites.length > 1 && (
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(200,196,188,0.3)',
              }}
            >
              <ChevronLeft size={16} style={{ color: '#1A1A1A' }} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(200,196,188,0.3)',
              }}
            >
              <ChevronRight size={16} style={{ color: '#1A1A1A' }} />
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-4"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle size={18} style={{ color: '#EF4444' }} />
          <span className="text-sm font-body" style={{ color: '#DC2626' }}>
            {error}
          </span>
          <button
            onClick={fetchFavorites}
            className="ml-auto text-sm font-medium font-body underline"
            style={{ color: '#DC2626' }}
          >
            {t('favorites.retry')}
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-x-visible scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {[1, 2, 3, 4].map((i) => (
            <FavoriteCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && favorites.length === 0 && !error && <EmptyState t={t} />}

      {/* Favorites grid/scroll */}
      {!isLoading && favorites.length > 0 && (
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-x-visible scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {favorites.map((property) => (
            <FavoriteCard
              key={property.id}
              property={property}
              onRemove={handleRemove}
              onClick={handleCardClick}
              isRemoving={removingIds.has(property.id)}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
