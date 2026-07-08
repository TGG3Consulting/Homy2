'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PropertiesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/results');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0A6045] border-t-transparent" />
    </div>
  );
}
