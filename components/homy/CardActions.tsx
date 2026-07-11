'use client';

import React from 'react';
import { Heart, Scale } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCompare } from '@/lib/contexts/CompareContext';

/** If not logged in, go to login and return with the action pre-applied (?pending=fav|cmp:id). */
export async function ensureAuthOr(kind: 'fav' | 'cmp', id: string): Promise<boolean> {
  try {
    const r = await fetch('/api/users/me', { credentials: 'include' });
    if (r.ok) return true;
  } catch {}
  const cur = window.location.pathname + window.location.search;
  const back = `${cur}${cur.includes('?') ? '&' : '?'}pending=${kind}:${id}`;
  window.location.href = `/login?redirect=${encodeURIComponent(back)}`;
  return false;
}

/** Hover-revealed favorite + compare actions. Parent screen CSS positions `.cardacts` and reveals it on hover. */
export default function CardActions({ id, score }: { id: string; score: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const saved = isFavorite(id);
  const inCmp = isInCompare(id);

  const onFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await ensureAuthOr('fav', id)) toggleFavorite(id);
  };
  const onCmp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await ensureAuthOr('cmp', id)) {
      inCmp ? removeFromCompare(id) : addToCompare(id, score || 0);
    }
  };

  return (
    <div className="cardacts">
      <button type="button" title={saved ? 'Убрать из избранного' : 'В избранное'} onClick={onFav}>
        <Heart size={17} fill={saved ? '#EF4444' : 'none'} color={saved ? '#EF4444' : '#1A1A1A'} />
      </button>
      <button type="button" title={inCmp ? 'Убрать из сравнения' : 'Сравнить'} onClick={onCmp}>
        <Scale size={17} color={inCmp ? '#0A6045' : '#1A1A1A'} />
      </button>
    </div>
  );
}
