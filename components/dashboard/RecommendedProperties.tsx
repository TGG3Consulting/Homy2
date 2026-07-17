'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Heart,
  Calendar,
  MapPin,
  Bed,
  Maximize2,
  ChevronRight,
  Info,
  X,
  Home,
  Star,
} from 'lucide-react';
import { useT, getLocalized, Language } from '@/lib/i18n';
import { PropertyShowcase } from '@/lib/types';

// ============================================================================
// Type Definitions
// ============================================================================

interface RecommendedPropertiesProps {
  /** Optional class name for styling */
  className?: string;
  /** Maximum number of properties to display */
  maxItems?: number;
  /** Minimum match score filter (default: 80) */
  minScore?: number;
  /** Callback when a property is saved */
  onSave?: (propertyId: string) => void;
  /** Callback when viewing is scheduled */
  onScheduleViewing?: (propertyId: string) => void;
}

interface RecommendationResponse {
  recommendations: PropertyShowcase[];
  total: number;
  user_authenticated: boolean;
  filters_applied: boolean;
}

// ============================================================================
// Skeleton Component
// ============================================================================

function PropertyCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      {/* Image skeleton */}
      <div
        className="aspect-[16/10] w-full"
        style={{ backgroundColor: 'rgba(200, 196, 188, 0.2)' }}
      />
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div
          className="h-3 w-24 rounded"
          style={{ backgroundColor: 'rgba(200, 196, 188, 0.3)' }}
        />
        <div
          className="h-4 w-3/4 rounded"
          style={{ backgroundColor: 'rgba(200, 196, 188, 0.3)' }}
        />
        <div className="flex gap-3">
          <div
            className="h-3 w-16 rounded"
            style={{ backgroundColor: 'rgba(200, 196, 188, 0.2)' }}
          />
          <div
            className="h-3 w-16 rounded"
            style={{ backgroundColor: 'rgba(200, 196, 188, 0.2)' }}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <div
            className="h-8 flex-1 rounded-full"
            style={{ backgroundColor: 'rgba(200, 196, 188, 0.2)' }}
          />
          <div
            className="h-8 w-8 rounded-full"
            style={{ backgroundColor: 'rgba(200, 196, 188, 0.2)' }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  t: (key: string) => string;
}

function EmptyState({ t }: EmptyStateProps) {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(10, 96, 69, 0.1)',
          border: '1px solid rgba(10, 96, 69, 0.2)',
        }}
      >
        <Home size={28} style={{ color: '#0A6045' }} />
      </div>
      <h3
        className="text-[15px] font-semibold mb-2"
        style={{ color: '#242424' }}
      >
        {t('dashboard.recommendations.emptyTitle') || 'No recommendations yet'}
      </h3>
      <p
        className="text-[13px] mb-4 max-w-sm mx-auto"
        style={{ color: '#757570' }}
      >
        {t('dashboard.recommendations.emptyDescription') ||
          'Complete your preferences to get personalized property recommendations tailored to your needs.'}
      </p>
      <Link
        href="/preferences"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium transition-all hover:shadow-md"
        style={{
          backgroundColor: '#0A6045',
          color: '#FFF',
        }}
      >
        {t('dashboard.recommendations.setPreferences') || 'Set Preferences'}
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

// ============================================================================
// Tooltip Component
// ============================================================================

interface TooltipProps {
  reasons: string[];
  lang: Language;
  onClose: () => void;
}

function WhyRecommendedTooltip({ reasons, lang, onClose }: TooltipProps) {
  return (
    <div
      className="absolute z-50 left-0 right-0 top-full mt-2 mx-3 p-3 rounded-xl animate-fadeIn"
      style={{
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Why recommended
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-full transition-colors hover:bg-white/10"
        >
          <X size={12} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
        </button>
      </div>
      <ul className="space-y-1.5">
        {reasons.map((reason, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-[12px]"
            style={{ color: '#FFF' }}
          >
            <span style={{ color: '#0A6045' }}>+</span>
            <span>{getLocalized(reason, lang)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Property Card Component
// ============================================================================

interface PropertyCardProps {
  property: PropertyShowcase;
  lang: Language;
  t: (key: string) => string;
  onSave: (id: string) => void;
  onSchedule: (id: string) => void;
  isSaved: boolean;
}

function RecommendedPropertyCard({
  property,
  lang,
  t,
  onSave,
  onSchedule,
  isSaved,
}: PropertyCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();

  const title = getLocalized(property.title, lang) || property.name;
  const neighborhood = getLocalized(property.neighborhood, lang) || property.district;

  // Extract key features (max 3)
  const keyFeatures: string[] = [];
  if (property.has_parking) keyFeatures.push(t('features.parking') || 'Parking');
  if (property.has_balcony) keyFeatures.push(t('features.balcony') || 'Balcony');
  if (property.pets_allowed) keyFeatures.push(t('features.petFriendly') || 'Pet-friendly');
  if (property.has_virtual_tour) keyFeatures.push(t('features.virtualTour') || 'Virtual Tour');
  if (property.verified) keyFeatures.push(t('features.verified') || 'Verified');

  const displayFeatures = keyFeatures.slice(0, 3);

  const handleCardClick = () => {
    router.push(`/properties/${property.id}`);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group hover:-translate-y-1"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: property.is_top_choice
          ? '1px solid rgba(10, 96, 69, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: property.is_top_choice
          ? '0 8px 32px rgba(10, 96, 69, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          : '0 4px 20px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
      }}
      onClick={handleCardClick}
    >
      {/* Top Choice Badge */}
      {property.is_top_choice && (
        <div
          className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider flex items-center gap-1"
          style={{
            backgroundColor: '#0A6045',
            color: '#FFF',
            boxShadow: '0 2px 8px rgba(10, 96, 69, 0.4)',
          }}
        >
          <Star size={10} fill="white" />
          {t('recommendations.topPick') || 'Top Pick'}
        </div>
      )}

      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={property.image_url || property.images?.[0] || '/placeholder-property.jpg'}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        {/* Price Overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white text-[15px] font-semibold tracking-tight">
            {property.price.toLocaleString()} {property.currency || 'AMD'}
          </span>
          {property.deal_type === 'long_term_rental' && (
            <span className="text-white/70 text-[11px] ml-1">
              {t('propertyCard.month') || '/mo'}
            </span>
          )}
        </div>

        {/* Match Score Badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
          style={{
            backgroundColor: property.match_score >= 90 ? 'rgba(10, 96, 69, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            color: property.match_score >= 90 ? '#FFF' : '#3D3B37',
          }}
        >
          <Sparkles size={10} />
          {property.match_score}%
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={12} style={{ color: '#757570' }} />
          <span className="text-[12px] font-medium" style={{ color: '#757570' }}>
            {neighborhood}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-[14px] font-semibold leading-snug mb-2 line-clamp-2"
          style={{ color: '#1A1A1A' }}
        >
          {title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Bed size={13} style={{ color: '#757570' }} />
            <span className="text-[12px]" style={{ color: '#3D3B37' }}>
              {property.bedrooms || property.rooms}{' '}
              {(property.bedrooms || property.rooms) === 1
                ? t('propertyCard.bed') || 'bed'
                : t('propertyCard.beds') || 'beds'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 size={13} style={{ color: '#757570' }} />
            <span className="text-[12px]" style={{ color: '#3D3B37' }}>
              {property.size_sqm || property.area} {t('propertyCard.sqm') || 'm\u00B2'}
            </span>
          </div>
        </div>

        {/* Key Features */}
        {displayFeatures.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {displayFeatures.map((feature, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                style={{
                  backgroundColor: 'rgba(10, 96, 69, 0.1)',
                  color: '#0A6045',
                  border: '1px solid rgba(10, 96, 69, 0.2)',
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Why Recommended Button */}
        {property.recommendation_reasons && property.recommendation_reasons.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            className="flex items-center gap-1 text-[11px] font-medium mb-3 transition-colors hover:opacity-80"
            style={{ color: '#0A6045' }}
          >
            <Info size={12} />
            {t('recommendations.whyRecommended') || 'Why recommended?'}
          </button>
        )}

        {/* Tooltip */}
        {showTooltip && property.recommendation_reasons && (
          <WhyRecommendedTooltip
            reasons={property.recommendation_reasons}
            lang={lang}
            onClose={() => setShowTooltip(false)}
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule(property.id);
            }}
            className="flex-1 py-2 rounded-full text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 hover:shadow-md"
            style={{
              backgroundColor: '#0A6045',
              color: '#FFF',
            }}
          >
            <Calendar size={12} />
            {t('propertyCard.scheduleViewing') || 'Schedule Viewing'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(property.id);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-sm"
            style={{
              backgroundColor: isSaved ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.04)',
              border: isSaved ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(0, 0, 0, 0.06)',
            }}
            title={isSaved ? t('propertyCard.unsave') || 'Remove from saved' : t('propertyCard.save') || 'Save'}
          >
            <Heart
              size={14}
              fill={isSaved ? '#EF4444' : 'none'}
              style={{ color: isSaved ? '#EF4444' : '#757570' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function RecommendedProperties({
  className = '',
  maxItems = 6,
  minScore = 80,
  onSave,
  onScheduleViewing,
}: RecommendedPropertiesProps) {
  const { t, lang } = useT();
  const router = useRouter();

  const [recommendations, setRecommendations] = useState<PropertyShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/users/me/recommendations?limit=${maxItems}&minScore=${minScore}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data: RecommendationResponse = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(t('errors.fetchFailed') || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [maxItems, minScore, t]);

  // Fetch saved properties to show saved state
  const fetchSavedIds = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me/favorites', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const ids = new Set<string>(data.favorites?.map((f: PropertyShowcase) => f.id) || []);
        setSavedIds(ids);
      }
    } catch (err) {
      console.error('Error fetching saved IDs:', err);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
    fetchSavedIds();
  }, [fetchRecommendations, fetchSavedIds]);

  // Handle save action
  const handleSave = async (propertyId: string) => {
    try {
      const isSaved = savedIds.has(propertyId);
      const method = isSaved ? 'DELETE' : 'POST';

      // Canonical favorites endpoint (3.2 — /api/favorites deduped away).
      const response = await fetch('/api/users/me/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ propertyId }),
      });

      // If unauthorized, redirect to login
      if (response.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      if (response.ok) {
        setSavedIds((prev) => {
          const updated = new Set(prev);
          if (isSaved) {
            updated.delete(propertyId);
          } else {
            updated.add(propertyId);
          }
          return updated;
        });
        onSave?.(propertyId);
      }
    } catch (err) {
      console.error('Error saving property:', err);
      // Show error to user
      setSaveError(t('errors.saveFailed') || 'Failed to save property');
    }
  };

  // Handle schedule viewing action
  const handleScheduleViewing = (propertyId: string) => {
    if (onScheduleViewing) {
      onScheduleViewing(propertyId);
    } else {
      router.push(`/schedule?propertyId=${propertyId}`);
    }
  };

  // Build "See all" URL with filters
  const seeAllUrl = `/results?minScore=${minScore}&sort=match_score_desc`;

  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        boxShadow:
          '0 1px 3px rgba(0, 0, 0, 0.03), 0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(10, 96, 69, 0.15)',
              border: '1px solid rgba(10, 96, 69, 0.25)',
            }}
          >
            <Sparkles size={16} style={{ color: '#0A6045' }} />
          </div>
          <div>
            <h2
              className="text-[15px] font-semibold"
              style={{ color: '#242424' }}
            >
              {t('dashboard.recommendations.title') || 'Recommended for You'}
            </h2>
            <p
              className="text-[11px]"
              style={{ color: '#757570' }}
            >
              {t('dashboard.recommendations.subtitle') || 'AI-selected matches based on your preferences'}
            </p>
          </div>
        </div>
        <Link
          href={seeAllUrl}
          className="flex items-center gap-1 text-[12px] font-medium transition-colors hover:opacity-80"
          style={{ color: '#0A6045' }}
        >
          {t('common.seeAll') || 'See all'}
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Save Error Message */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex justify-between items-center">
          <span>{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-400 hover:text-red-600 ml-2"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: Math.min(maxItems, 3) }).map((_, idx) => (
            <PropertyCardSkeleton key={idx} />
          ))}
        </div>
      ) : error ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.1)',
          }}
        >
          <p className="text-[13px]" style={{ color: '#EF4444' }}>
            {error}
          </p>
          <button
            onClick={fetchRecommendations}
            className="mt-3 px-4 py-2 rounded-full text-[12px] font-medium transition-all hover:shadow-md"
            style={{
              backgroundColor: '#0A6045',
              color: '#FFF',
            }}
          >
            {t('common.retry') || 'Try again'}
          </button>
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((property) => (
            <RecommendedPropertyCard
              key={property.id}
              property={property}
              lang={lang}
              t={t}
              onSave={handleSave}
              onSchedule={handleScheduleViewing}
              isSaved={savedIds.has(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CSS Animation (add to global styles if not present)
// ============================================================================
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(-4px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
