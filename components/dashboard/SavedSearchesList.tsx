'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calendar,
  Home,
  Trash2,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

// Saved search type
interface SavedSearch {
  id: string;
  name?: string;
  query: string;
  criteriaChips?: string[];
  comment?: string;
  properties?: { id: string }[];
  createdAt: string;
  updatedAt: string;
}

interface SavedSearchesListProps {
  className?: string;
}

// Format date as "23 June 2026" using Intl.DateTimeFormat
function formatDate(dateStr: string, lang: string): string {
  const date = new Date(dateStr);
  const locale = lang === 'hy' ? 'hy-AM' : lang === 'ru' ? 'ru-RU' : 'en-US';

  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    // Fallback for unsupported locales
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}

// Skeleton loader for card
function SavedSearchCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse p-4"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        <div className="h-6 bg-gray-200 rounded-full w-14" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/4" />
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
        <Search size={28} style={{ color: '#0A6045' }} />
      </div>
      <h3
        className="text-lg font-semibold font-body mb-2"
        style={{ color: '#1A1A1A' }}
      >
        {t('savedSearches.emptyTitle') || 'No saved searches'}
      </h3>
      <p
        className="text-sm font-body max-w-xs"
        style={{ color: '#757570' }}
      >
        {t('savedSearches.emptyDescription') || 'Save your searches to quickly return to them later'}
      </p>
    </div>
  );
}

// Individual saved search card
function SavedSearchCard({
  search,
  onRemove,
  onClick,
  isRemoving,
  lang,
  t,
}: {
  search: SavedSearch;
  onRemove: (id: string) => void;
  onClick: (search: SavedSearch) => void;
  isRemoving: boolean;
  lang: string;
  t: (key: string) => string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const displayName = search.name || (search.query.length > 50 ? search.query.slice(0, 50) + '...' : search.query);
  const propertiesCount = search.properties?.length || 0;

  const glassStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(search.id);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group p-4"
      style={{
        ...glassStyle,
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered
          ? '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)'
          : '0 2px 8px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(search)}
    >
      {/* Header with title and delete button */}
      <div className="flex items-start justify-between mb-3">
        <h3
          className="text-[14px] font-body font-semibold leading-snug line-clamp-2 flex-1 pr-2"
          style={{ color: '#1A1A1A' }}
        >
          {displayName}
        </h3>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
          }}
          title={t('savedSearches.remove') || 'Remove'}
        >
          {isRemoving ? (
            <Loader2 size={14} className="animate-spin" style={{ color: '#757570' }} />
          ) : (
            <Trash2 size={14} style={{ color: '#EF4444' }} />
          )}
        </button>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 mb-3">
        <Calendar size={12} style={{ color: '#757570' }} />
        <span
          className="text-[12px] font-body"
          style={{ color: '#757570' }}
        >
          {formatDate(search.updatedAt, lang)}
        </span>
      </div>

      {/* Criteria chips */}
      {search.criteriaChips && search.criteriaChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {search.criteriaChips.slice(0, 5).map((chip, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-full text-[10px] font-body font-medium"
              style={{
                backgroundColor: 'rgba(10, 96, 69, 0.1)',
                color: '#0A6045',
              }}
            >
              {chip}
            </span>
          ))}
          {search.criteriaChips.length > 5 && (
            <span
              className="px-2 py-1 rounded-full text-[10px] font-body font-medium"
              style={{
                backgroundColor: 'rgba(117, 117, 112, 0.1)',
                color: '#757570',
              }}
            >
              +{search.criteriaChips.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Comment */}
      {search.comment && (
        <div className="flex items-start gap-1.5 mb-3">
          <MessageSquare size={12} style={{ color: '#757570' }} className="mt-0.5 flex-shrink-0" />
          <span
            className="text-[11px] font-body line-clamp-2"
            style={{ color: '#757570' }}
          >
            {search.comment}
          </span>
        </div>
      )}

      {/* Properties count */}
      <div className="flex items-center gap-1.5">
        <Home size={12} style={{ color: '#757570' }} />
        <span className="text-[12px] font-body" style={{ color: '#3D3B37' }}>
          {propertiesCount} {propertiesCount === 1
            ? (t('savedSearches.property') || 'property')
            : (t('savedSearches.properties') || 'properties')}
        </span>
      </div>
    </div>
  );
}

export default function SavedSearchesList({ className = '' }: SavedSearchesListProps) {
  const { t, lang } = useT();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const MAX_SEARCHES = 20;

  // Fetch saved searches on mount
  const fetchSearches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/users/me/saved-searches', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setSearches([]);
          return;
        }
        throw new Error('Failed to fetch saved searches');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.searches)) {
        setSearches(data.searches);
      } else if (Array.isArray(data)) {
        setSearches(data);
      } else {
        setSearches([]);
      }
    } catch (err) {
      console.error('[SavedSearchesList] Error fetching saved searches:', err);
      setError(t('savedSearches.errorLoading') || 'Failed to load saved searches');
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  // Remove saved search handler
  const handleRemove = async (searchId: string) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(searchId));

      const response = await fetch(`/api/users/me/saved-searches/${searchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove saved search');
      }

      const data = await response.json();
      if (data.success) {
        setSearches((prev) => prev.filter((s) => s.id !== searchId));
      }
    } catch (err) {
      console.error('[SavedSearchesList] Error removing saved search:', err);
      setError(t('savedSearches.errorRemoving') || 'Failed to remove saved search');
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(searchId);
        return next;
      });
    }
  };

  // Handle card click - open in new tab
  const handleCardClick = (search: SavedSearch) => {
    const url = `/results?query=${encodeURIComponent(search.query)}&saved=${search.id}`;
    window.open(url, '_blank');
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
            <Search size={20} style={{ color: '#0A6045' }} />
          </div>
          <div>
            <h2
              className="text-lg font-semibold font-body"
              style={{ color: '#1A1A1A' }}
            >
              {t('savedSearches.title') || 'Saved Searches'}
            </h2>
            <p className="text-xs font-body" style={{ color: '#757570' }}>
              {searches.length} {t('savedSearches.of') || 'of'} {MAX_SEARCHES}
            </p>
          </div>
        </div>
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
            onClick={fetchSearches}
            className="ml-auto text-sm font-medium font-body underline"
            style={{ color: '#DC2626' }}
          >
            {t('savedSearches.retry') || 'Try again'}
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SavedSearchCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && searches.length === 0 && !error && <EmptyState t={t} />}

      {/* Saved searches grid */}
      {!isLoading && searches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {searches.map((search) => (
            <SavedSearchCard
              key={search.id}
              search={search}
              onRemove={handleRemove}
              onClick={handleCardClick}
              isRemoving={removingIds.has(search.id)}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
