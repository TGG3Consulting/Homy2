'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import StatePage from '@/components/homy/StatePage';

export default function NotFound() {
  const router = useRouter();
  return (
    <StatePage
      code="404"
      title="Такой страницы нет"
      text="Возможно, объявление снято или ссылка устарела. Давайте вернёмся к поиску жилья."
      actions={[
        { label: 'На главную', onClick: () => router.push('/') },
        { label: 'К результатам поиска', onClick: () => router.push('/allresults'), kind: 'sec' },
      ]}
    />
  );
}
