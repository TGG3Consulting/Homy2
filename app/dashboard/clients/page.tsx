'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { Construction } from 'lucide-react';

export default function ComingSoonPage() {
  const { t } = useT();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center p-8 max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <Construction size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          {t('common.comingSoon') || 'Coming Soon'}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('common.featureInDevelopment') || 'This feature is under development.'}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
        >
          ← {t('common.backToDashboard') || 'Back to Dashboard'}
        </Link>
      </div>
    </div>
  );
}
