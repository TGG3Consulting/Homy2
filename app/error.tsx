'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatePage from '@/components/homy/StatePage';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { console.error('[app error]', error); }, [error]);
  return (
    <StatePage
      icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>}
      iconTone="amber"
      title="Что-то пошло не так"
      text="Нет соединения или сервис временно недоступен. Проверьте интернет и попробуйте снова — ваши поиски и избранное сохранены."
      actions={[
        { label: 'Повторить', onClick: () => reset() },
        { label: 'На главную', onClick: () => router.push('/'), kind: 'sec' },
      ]}
    />
  );
}
