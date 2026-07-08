'use client';

import React from 'react';
import { Scale, Check } from 'lucide-react';
import { useCompare } from '@/lib/contexts/CompareContext';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface CompareButtonProps {
  propertyId: string;
  matchScore?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
}

export default function CompareButton({
  propertyId,
  matchScore = 0,
  className,
  size = 'md',
  variant = 'icon',
}: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();
  const { t } = useT();

  const inCompare = isInCompare(propertyId);
  const disabled = !inCompare && isFull();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (inCompare) {
      removeFromCompare(propertyId);
    } else {
      addToCompare(propertyId, matchScore);
    }
  };

  const sizeClasses = {
    sm: variant === 'icon' ? 'w-7 h-7' : 'px-2 py-1 text-xs',
    md: variant === 'icon' ? 'w-9 h-9' : 'px-3 py-1.5 text-sm',
    lg: variant === 'icon' ? 'w-11 h-11' : 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 18,
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'rounded-full flex items-center justify-center transition-all duration-200',
          sizeClasses[size],
          inCompare
            ? 'bg-emerald-500 text-white shadow-md'
            : disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white/90 text-gray-700 hover:bg-emerald-100 hover:text-emerald-600 shadow-lg',
          className
        )}
        style={{
          backdropFilter: 'blur(6px)',
        }}
        title={
          inCompare
            ? t('compare.removeFromCompare')
            : disabled
              ? t('compare.maxReached')
              : t('compare.addToCompare')
        }
      >
        {inCompare ? (
          <Check size={iconSizes[size]} />
        ) : (
          <Scale size={iconSizes[size]} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'rounded-full flex items-center justify-center gap-1.5 font-medium transition-all duration-200',
        sizeClasses[size],
        inCompare
          ? 'bg-emerald-500 text-white'
          : disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-emerald-100 hover:text-emerald-600 border border-gray-200',
        className
      )}
    >
      {inCompare ? (
        <>
          <Check size={iconSizes[size]} />
          <span>{t('compare.inCompare')}</span>
        </>
      ) : (
        <>
          <Scale size={iconSizes[size]} />
          <span>{t('compare.addToCompare')}</span>
        </>
      )}
    </button>
  );
}
