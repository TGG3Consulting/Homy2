'use client';

import React from 'react';
import { useI18n, Language } from '@/lib/i18n';

interface LangOption {
  code: Language;
  label: string;
}

const langs: LangOption[] = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'hy', label: 'HY' },
];

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
  const { lang, setLang } = useI18n();
  const isLight = variant === 'light';

  return (
    <div className="flex items-center gap-0.5">
      {langs.map(({ code, label }, i) => (
        <React.Fragment key={code}>
          {i > 0 && (
            <span className="text-[10px] select-none" style={{ color: isLight ? 'rgba(36,36,36,0.18)' : 'rgba(255,255,255,0.15)' }}>·</span>
          )}
          <button
            onClick={() => setLang(code)}
            className="text-[10px] font-body font-medium tracking-wide transition-all duration-200 px-1 py-0.5 rounded"
            style={{
              color: lang === code
                ? (isLight ? '#0A6045' : '#FFF')
                : (isLight ? 'rgba(36,36,36,0.30)' : 'rgba(255,255,255,0.35)'),
              fontWeight: lang === code ? 600 : 400,
              backgroundColor: lang === code
                ? (isLight ? 'rgba(10, 96, 69,0.08)' : 'rgba(255,255,255,0.10)')
                : 'transparent',
            }}
          >
            {label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
