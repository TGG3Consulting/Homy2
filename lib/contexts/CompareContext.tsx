'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const STORAGE_KEY = 'homy_compare_list';
const MAX_ITEMS = 4;

interface CompareItem {
  id: string;
  match_score: number;
}

interface CompareContextType {
  compareList: CompareItem[];
  maxItems: number;
  isHydrated: boolean;
  addToCompare: (propertyId: string, matchScore: number) => boolean;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  isInCompare: (propertyId: string) => boolean;
  isFull: () => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<CompareItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Handle both old format (string[]) and new format (CompareItem[])
            const normalized = parsed.slice(0, MAX_ITEMS).map((item: string | CompareItem) =>
              typeof item === 'string' ? { id: item, match_score: 0 } : item
            );
            setCompareList(normalized);
          }
        } catch (e) {
          console.error('Failed to parse compare list from localStorage');
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
    }
  }, [compareList, isHydrated]);

  const addToCompare = useCallback((propertyId: string, matchScore: number): boolean => {
    if (compareList.length >= MAX_ITEMS) {
      return false;
    }
    if (compareList.some(item => item.id === propertyId)) {
      return true; // Already in list
    }
    setCompareList(prev => [...prev, { id: propertyId, match_score: matchScore }]);
    return true;
  }, [compareList]);

  const removeFromCompare = useCallback((propertyId: string): void => {
    setCompareList(prev => prev.filter(item => item.id !== propertyId));
  }, []);

  const clearCompare = useCallback((): void => {
    setCompareList([]);
  }, []);

  const isInCompare = useCallback((propertyId: string): boolean => {
    return compareList.some(item => item.id === propertyId);
  }, [compareList]);

  const isFull = useCallback((): boolean => {
    return compareList.length >= MAX_ITEMS;
  }, [compareList]);

  return (
    <CompareContext.Provider
      value={{
        compareList,
        maxItems: MAX_ITEMS,
        isHydrated,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isFull,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextType {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
