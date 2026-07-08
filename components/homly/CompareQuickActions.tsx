'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Scale } from 'lucide-react';
import { useCompare } from '@/lib/contexts/CompareContext';

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.45)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)',
};

export default function CompareQuickActions() {
  const { compareList } = useCompare();
  const count = compareList.length;

  // Hide completely when no items in compare
  if (count === 0) {
    return null;
  }

  const canCompare = count >= 2;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={glassStyle}
    >
      {/* Favorites link */}
      <Link
        href="/dashboard?tab=favorites"
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:bg-white/40"
        title="Избранное"
      >
        <Heart size={16} style={{ color: '#E11D48' }} />
      </Link>

      {/* Divider */}
      <div className="w-px h-5 bg-black/10" />

      {/* Compare link */}
      {canCompare ? (
        <Link
          href="/compare"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 hover:bg-white/40"
          title={`Сравнить ${count} объекта`}
        >
          <Scale size={16} style={{ color: '#7B61FF' }} />
          <span
            className="text-[11px] font-body font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(123,97,255,0.15)', color: '#7B61FF' }}
          >
            {count}
          </span>
        </Link>
      ) : (
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-not-allowed opacity-50"
          title="Выберите минимум 2 объекта для сравнения"
        >
          <Scale size={16} style={{ color: '#999' }} />
          <span
            className="text-[11px] font-body font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.08)', color: '#999' }}
          >
            {count}
          </span>
        </div>
      )}
    </div>
  );
}
