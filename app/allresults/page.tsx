'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { PropertyShowcase, AIInsights } from '@/lib/types';
import {
  InsightPanel,
  PropertyCatalog,
  PropertyDetailModal,
  ResultsMap,
  Footer,
} from '@/components/homly';

function AllResultsPageContent() {
  const { t } = useT();
  const searchParams = useSearchParams();

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalProperty, setModalProperty] = useState<PropertyShowcase | null>(null);

  // Properties loaded directly from API
  const [properties, setProperties] = useState<PropertyShowcase[]>([]);
  const [topChoiceId, setTopChoiceId] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [criteriaChips, setCriteriaChips] = useState<string[]>([]);

  // User's additional filters
  const [userFilters, setUserFilters] = useState<Record<string, any>>({});

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User's existing viewings (to disable "Schedule viewing" button)
  const [userViewingPropertyIds, setUserViewingPropertyIds] = useState<string[]>([]);

  // Fetch properties immediately on mount
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      const minPrice = searchParams.get('min_price');
      const maxPrice = searchParams.get('max_price');
      const minRooms = searchParams.get('min_rooms');
      const maxRooms = searchParams.get('max_rooms');
      const district = searchParams.get('district');
      const propertyType = searchParams.get('property_type');
      const dealType = searchParams.get('deal_type');
      const hasSchoolNearby = searchParams.get('has_school_nearby');
      const petsAllowed = searchParams.get('pets_allowed');
      const hasParking = searchParams.get('has_parking');

      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (minRooms) params.set('min_rooms', minRooms);
      if (maxRooms) params.set('max_rooms', maxRooms);
      if (district) params.set('district', district);
      if (propertyType) params.set('property_type', propertyType);
      if (dealType) params.set('deal_type', dealType);
      if (hasSchoolNearby) params.set('has_school_nearby', hasSchoolNearby);
      if (petsAllowed) params.set('pets_allowed', petsAllowed);
      if (hasParking) params.set('has_parking', hasParking);

      params.set('limit', '50');
      params.set('sort_by', 'match_score');
      params.set('sort_order', 'desc');

      const response = await fetch(`/api/properties?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }

      const data = await response.json();

      setProperties(data.properties);

      // Auto-select top choice
      const topChoice = data.properties.find((p: PropertyShowcase) => p.is_top_choice);
      if (topChoice) {
        setSelectedId(topChoice.id);
        setTopChoiceId(topChoice.id);
      } else if (data.properties.length > 0) {
        setSelectedId(data.properties[0].id);
      }

      // Extract criteria from search params for filter chips
      const extractedCriteria: string[] = [];
      if (maxPrice) extractedCriteria.push(t('resultsPage.filterUpTo', { amount: Number(maxPrice).toLocaleString() }));
      if (minRooms) extractedCriteria.push(t('resultsPage.filterBedrooms', { count: minRooms }));
      if (district) extractedCriteria.push(district);
      if (dealType === 'long_term_rental') extractedCriteria.push(t('resultsPage.filterLongTerm'));
      if (hasSchoolNearby === 'true') extractedCriteria.push(t('resultsPage.filterSchool'));
      setCriteriaChips(extractedCriteria);

      // Set insights
      setInsights({
        best_neighborhood: topChoice?.neighborhood || topChoice?.district || data.properties[0]?.neighborhood || 'Arabkir',
        description: '',
        analyzed_count: data.total > 0 ? Math.max(data.total * 15, 286) : 286,
        suitable_count: data.total,
        recommended_count: Math.min(data.properties.length, 5),
        neighborhood_count: new Set(data.properties.map((p: PropertyShowcase) => p.neighborhood || p.district).filter(Boolean)).size || 3,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties');
      setIsLoading(false);
    }
  }, [searchParams, t]);

  // Load properties immediately
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Fetch user's existing viewings to disable "Schedule viewing" buttons
  useEffect(() => {
    const fetchUserViewings = async () => {
      try {
        const res = await fetch('/api/viewings', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const viewings = data.viewings || [];
          // Only block scheduling for active viewings (not completed/cancelled)
          const activeViewings = viewings.filter((v: any) => v.status !== 'completed' && v.status !== 'cancelled');
          const propertyIds = activeViewings.map((v: any) => v.propertyId);
          setUserViewingPropertyIds(propertyIds);
        }
      } catch {
        // ignore - user might not be logged in
      }
    };
    fetchUserViewings();
  }, []);

  // Apply user filters on top of selection
  const filteredProperties = useMemo(() => {
    let result = properties;

    if (userFilters.minPrice) {
      result = result.filter(p => p.price >= userFilters.minPrice);
    }
    if (userFilters.maxPrice) {
      result = result.filter(p => p.price <= userFilters.maxPrice);
    }
    if (userFilters.minRooms) {
      result = result.filter(p => p.rooms >= userFilters.minRooms);
    }
    if (userFilters.district) {
      result = result.filter(p => p.district === userFilters.district || p.neighborhood === userFilters.district);
    }

    return result;
  }, [properties, userFilters]);

  const handleSelectProperty = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleViewDetails = useCallback((property: PropertyShowcase) => {
    setModalProperty(property);
    setSelectedId(property.id);
  }, []);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalProperty(null);
  }, []);

  return (
    <div className="w-full">
      <div
        className="w-full grid grid-cols-1 lg:grid-cols-[426px_1fr] min-h-screen lg:h-screen"
        style={{
          background: 'linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)',
        }}
      >
        {/* LEFT - Map column */}
        <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen overflow-hidden" style={{ backgroundColor: '#EDE9E1' }}>
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#0A6045] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading map...</p>
              </div>
            </div>
          ) : (
            <ResultsMap
              properties={filteredProperties}
              selectedId={selectedId}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>

        {/* CENTER - Catalog (full width, no AI panel) */}
        <div className="overflow-y-auto min-h-screen lg:h-screen">
          {/* Back link */}
          <div className="px-6 pt-5 pb-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium transition-colors duration-200 hover:opacity-70"
              style={{ color: 'rgba(60,60,60,0.6)' }}
            >
              <ArrowLeft size={14} />
              {t('common.newSearch')}
            </Link>
          </div>

          {/* Insight panel */}
          <div className="px-6 pt-2 pb-1">
            <InsightPanel
              bestNeighborhood={insights?.best_neighborhood || 'Arabkir'}
              description={insights?.description || t('resultsPage.insightText')}
              analyzedCount={insights?.analyzed_count || 286}
              suitableCount={insights?.suitable_count || filteredProperties.length}
              recommendedCount={insights?.recommended_count || Math.min(filteredProperties.length, 5)}
              neighborhoodCount={insights?.neighborhood_count || 3}
            />
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/50 p-4 animate-pulse"
                  >
                    <div className="aspect-[16/10] bg-gray-200 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={fetchProperties}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Catalog */}
          {!isLoading && !error && (
            <PropertyCatalog
              properties={filteredProperties}
              selectedId={selectedId}
              onSelectProperty={handleSelectProperty}
              onViewDetails={handleViewDetails}
              userViewingPropertyIds={userViewingPropertyIds}
            />
          )}

          {/* Empty state */}
          {!isLoading && !error && filteredProperties.length === 0 && (
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-gray-600 mb-4">
                  No properties found matching your criteria.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A6045] text-white rounded-full text-sm font-medium hover:bg-[#7A5BE8] transition-colors"
                >
                  <ArrowLeft size={14} />
                  Start a new search
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Property Detail Modal */}
        {modalProperty && (
          <PropertyDetailModal
            property={modalProperty}
            onClose={handleCloseModal}
          />
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function AllResultsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-screen w-full overflow-hidden flex items-center justify-center"
          style={{
            background:
              'linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)',
          }}
        >
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[#0A6045] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading results...</p>
          </div>
        </div>
      }
    >
      <AllResultsPageContent />
    </Suspense>
  );
}
