'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import hy from '@/locales/hy.json';

// Type definitions
export type Language = 'en' | 'ru' | 'hy';

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue>;
type TranslationsMap = Record<Language, Translations>;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
  tArray: (key: string) => string[];
}

interface LocalizedObject {
  en?: string;
  ru?: string;
  hy?: string;
  [key: string]: string | undefined;
}

// Translations map
const translations: TranslationsMap = { en, ru, hy };

const LANG_KEY = 'homy_language';
const validLangs: Language[] = ['en', 'ru', 'hy'];

/**
 * Detect UI language from localStorage or browser settings.
 * Only call this on the client side (after mount).
 */
function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && validLangs.includes(stored as Language)) return stored as Language;
  } catch {
    // localStorage not available
  }

  const browserLang = (navigator.language || '').split('-')[0];
  if (validLangs.includes(browserLang as Language)) return browserLang as Language;

  return 'en';
}

/**
 * Detect language from text content based on script patterns.
 * Useful for detecting the language of incoming messages.
 */
export function detectLanguageFromText(text: string): Language {
  const armenianPattern = /[\u0530-\u058F]/;
  const cyrillicPattern = /[\u0400-\u04FF]/;
  if (armenianPattern.test(text)) return 'hy';
  if (cyrillicPattern.test(text)) return 'ru';
  return 'en';
}

// Create context with default values
const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
  tArray: () => [],
});

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // Start with 'en' on both server and client to avoid hydration mismatch
  const [lang, setLangState] = useState<Language>('en');

  // After mount, detect and set the actual language from localStorage/browser
  useEffect(() => {
    const detectedLang = detectLanguage();
    if (detectedLang !== 'en') {
      setLangState(detectedLang);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    if (!validLangs.includes(newLang)) return;
    setLangState(newLang);
    try {
      localStorage.setItem(LANG_KEY, newLang);
    } catch {
      // localStorage not available
    }
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    const keys = key.split('.');
    let val: unknown = translations[lang];

    for (const k of keys) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    let result = (typeof val === 'string' ? val : key);

    if (replacements && typeof result === 'string') {
      Object.entries(replacements).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, v);
      });
    }

    return result;
  }, [lang]);

  const tArray = useCallback((key: string): string[] => {
    const keys = key.split('.');
    let val: unknown = translations[lang];

    for (const k of keys) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[k];
      } else {
        return [];
      }
    }

    if (Array.isArray(val)) {
      return val as string[];
    }

    return [];
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tArray }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  return useContext(I18nContext);
}

export function useT(): { t: (key: string, replacements?: Record<string, string>) => string; tArray: (key: string) => string[]; lang: Language } {
  const { t, tArray, lang } = useContext(I18nContext);
  return { t, tArray, lang };
}

/**
 * Get a localized field from a multilingual object.
 * Falls back: requested lang -> en -> first available value -> empty string.
 * Handles JSON strings that need parsing.
 */
export function getLocalized(obj: LocalizedObject | string | null | undefined, lang: Language): string {
  if (!obj) return '';

  // If it's a string, try to parse it as JSON (might be a localized object as string)
  if (typeof obj === 'string') {
    // Check if it looks like a JSON object
    if (obj.startsWith('{') && obj.endsWith('}')) {
      try {
        const parsed = JSON.parse(obj);
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed[lang]) return parsed[lang];
          if (parsed.en) return parsed.en;
          const firstKey = Object.keys(parsed)[0];
          return firstKey ? parsed[firstKey] : obj;
        }
      } catch {
        // Not valid JSON, return as-is
      }
    }
    return obj;
  }

  if (typeof obj !== 'object') return '';
  if (obj[lang]) return obj[lang] as string;
  if (obj.en) return obj.en;
  const firstKey = Object.keys(obj)[0];
  return firstKey ? (obj[firstKey] as string) : '';
}

/**
 * Localize a value that may be a plain string, a localized object, or a JSON
 * string holding a localized object. Canonical shared helper — replaces the
 * per-file `loc()` copies that used to live in each page/component.
 */
export function loc(v: any, lang: string): string {
  if (v == null) return '';
  if (typeof v === 'object') return v[lang] || v.ru || v.en || '';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (s.startsWith('{') && s.includes('"')) {
    try { const o = JSON.parse(s); return o[lang] || o.ru || o.en || s; } catch { return v; }
  }
  return v;
}

// Export translations for backward compatibility
export { translations };

// Export detectLanguage for backward compatibility (alias for detectLanguageFromText)
// The old i18n.ts used detectLanguage to detect language from text content
export { detectLanguageFromText as detectLanguage };

/**
 * Standalone translation function for use outside of React context.
 * For React components, prefer using useT() hook instead.
 */
export function t(key: string, lang: Language): string {
  const keys = key.split('.');
  let val: unknown = translations[lang];

  for (const k of keys) {
    if (val && typeof val === 'object') {
      val = (val as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof val === 'string' ? val : key;
}
