'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import { PropertyShowcase } from '@/lib/types';
import { useCompare } from '@/lib/contexts/CompareContext';
import ComparePropertyCards from './ComparePropertyCards';
import CompareResultBlock from './CompareResultBlock';
import CompareChat from './CompareChat';

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.35)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
};

export default function CompareLayout() {
  const { compareList, clearCompare } = useCompare();
  const [properties, setProperties] = useState<PropertyShowcase[]>([]);
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Handle properties loaded from ComparePropertyCards
  const handlePropertiesLoaded = useCallback((loadedProperties: PropertyShowcase[]) => {
    setProperties(loadedProperties);
  }, []);

  // Handle compare result from CompareChat
  const handleCompareResult = useCallback((result: string) => {
    setCompareResult(result);
    setIsComparing(false);
  }, []);

  // Handle compare start
  const handleCompareStart = useCallback(() => {
    setIsComparing(true);
  }, []);

  // Not enough properties
  if (compareList.length < 2) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)',
        }}
      >
        <div className="text-center p-8 rounded-2xl max-w-md" style={glassStyle}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(123,97,255,0.12)' }}
          >
            <Scale size={28} style={{ color: '#7B61FF' }} />
          </div>
          <h1 className="text-xl font-body font-semibold mb-2" style={{ color: '#1A1A1A' }}>
            Недостаточно объектов
          </h1>
          <p className="text-[14px] font-body mb-6" style={{ color: '#5C5A55' }}>
            Для сравнения нужно выбрать минимум 2 объекта.
            <br />
            Сейчас выбрано: {compareList.length}
          </p>
          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-body font-medium transition-all"
            style={{ backgroundColor: '#7B61FF', color: '#FFF' }}
          >
            <ArrowLeft size={14} />
            Вернуться к поиску
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(165deg, #F6F5F3 0%, #F2F2EF 30%, #F9F9F7 60%, #F0F0EC 100%)',
      }}
    >
      {/* Header */}
      <header className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-4">
          <Link
            href="/results"
            className="flex items-center gap-1.5 text-[13px] font-body font-medium transition-opacity hover:opacity-70"
            style={{ color: '#757570' }}
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Назад к результатам</span>
            <span className="sm:hidden">Назад</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] md:text-[13px] font-body" style={{ color: '#757570' }}>
            {compareList.length} объект{compareList.length > 1 ? 'а' : ''}
          </span>
          <button
            onClick={clearCompare}
            className="px-3 py-1.5 rounded-full text-[12px] font-body font-medium transition-all hover:bg-red-50"
            style={{ color: '#E11D48', border: '1px solid rgba(225,29,72,0.2)' }}
          >
            Очистить
          </button>
        </div>
      </header>

      {/* Main content - stack on mobile, 70/30 on desktop */}
      <div className="px-4 md:px-6 pb-6">
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[1fr_380px]">
          {/* Left side - Properties and Result */}
          <div className="space-y-4 md:space-y-6 order-2 lg:order-1">
            {/* Property cards */}
            <section className="overflow-x-auto">
              <h2
                className="text-[14px] font-body font-semibold mb-3"
                style={{ color: '#1A1A1A' }}
              >
                Выбранные объекты
              </h2>
              <ComparePropertyCards onPropertiesLoaded={handlePropertiesLoaded} />
            </section>

            {/* Compare result */}
            <section className="overflow-x-auto">
              <CompareResultBlock
                result={compareResult}
                isLoading={isComparing}
              />
            </section>
          </div>

          {/* Right side - Chat */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-6" style={{ height: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
            <CompareChat
              properties={properties}
              onCompareResult={handleCompareResult}
              onCompareStart={handleCompareStart}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
