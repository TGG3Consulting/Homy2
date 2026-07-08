'use client';

import React from 'react';
import { CompareProvider } from '@/lib/contexts/CompareContext';
import CompareLayout from '@/components/compare/CompareLayout';

export default function ComparePage() {
  return (
    <CompareProvider>
      <CompareLayout />
    </CompareProvider>
  );
}
