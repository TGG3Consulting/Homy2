import React from 'react';
import { useI18n } from '@/lib/i18n';

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'hy', label: 'HY' },
];

export default function LanguageSwitcher({ variant = 'light' }) {
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
                ? (isLight ? '#8B6CFF' : '#FFF')
                : (isLight ? 'rgba(36,36,36,0.30)' : 'rgba(255,255,255,0.35)'),
              fontWeight: lang === code ? 600 : 400,
              backgroundColor: lang === code
                ? (isLight ? 'rgba(139,108,255,0.08)' : 'rgba(255,255,255,0.10)')
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