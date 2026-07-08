'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await fetch('/api/users/me/favorites', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const ids = (data.favorites || []).map((f: any) => f.id);
          setFavoriteIds(new Set(ids));
        }
      } catch (err) {
        // Not logged in or error - ignore
        console.error('[FavoritesContext] Error loading favorites:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favoriteIds.has(id);
  }, [favoriteIds]);

  const toggleFavorite = useCallback(async (id: string) => {
    const isCurrentlyFavorite = favoriteIds.has(id);

    try {
      const response = await fetch('/api/users/me/favorites', {
        method: isCurrentlyFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ propertyId: id }),
      });

      if (response.ok) {
        setFavoriteIds(prev => {
          const next = new Set(prev);
          if (isCurrentlyFavorite) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      } else {
        console.error('[FavoritesContext] Failed to toggle favorite:', response.status);
      }
    } catch (err) {
      console.error('[FavoritesContext] Error toggling favorite:', err);
    }
  }, [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    // Return a no-op context for components outside provider
    return {
      favoriteIds: new Set<string>(),
      isFavorite: () => false,
      toggleFavorite: async () => {},
      isLoading: false,
    };
  }
  return context;
}
