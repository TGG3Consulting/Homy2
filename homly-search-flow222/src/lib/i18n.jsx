import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import hy from '@/locales/hy.json';

const translations = { en, ru, hy };

const LANG_KEY = 'homly_language';
const validLangs = ['en', 'ru', 'hy'];

function detectLanguage() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && validLangs.includes(stored)) return stored;
  } catch {}
  const browserLang = (navigator.language || '').split('-')[0];
  if (validLangs.includes(browserLang)) return browserLang;
  return 'en';
}

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, fallback) => fallback || key,
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);

  const setLang = useCallback((newLang) => {
    if (!validLangs.includes(newLang)) return;
    setLangState(newLang);
    try { localStorage.setItem(LANG_KEY, newLang); } catch {}
  }, []);

  const t = useCallback((key, replacements) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      if (val && typeof val === 'object') val = val[k];
      else return key;
    }
    let result = val || key;
    if (replacements && typeof result === 'string') {
      Object.entries(replacements).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, v);
      });
    }
    return result;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  const { t, lang } = useContext(I18nContext);
  return { t, lang };
}

/**
 * Get a localized field from a multilingual object.
 * Falls back: requested lang → en → first available value → empty string.
 */
export function getLocalized(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object') return '';
  if (obj[lang]) return obj[lang];
  if (obj.en) return obj.en;
  const firstKey = Object.keys(obj)[0];
  return firstKey ? obj[firstKey] : '';
}