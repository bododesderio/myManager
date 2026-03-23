import { useState, useCallback } from 'react';
import { getLocales } from 'expo-localization';
import { storage, storageKeys } from '@/store/storage';

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ja' | 'ko' | 'zh' | 'ar';

function getInitialLocale(): SupportedLocale {
  const persisted = storage.getString(storageKeys.LOCALE);
  if (persisted) {
    return persisted as SupportedLocale;
  }
  const deviceLocales = getLocales();
  return (deviceLocales[0]?.languageCode || 'en') as SupportedLocale;
}

export function useLocale() {
  const [locale, setLocale] = useState<SupportedLocale>(getInitialLocale);

  const changeLocale = useCallback((newLocale: SupportedLocale) => {
    setLocale(newLocale);
    storage.set(storageKeys.LOCALE, newLocale);
  }, []);

  const formatDate = useCallback(
    (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString(locale);
    },
    [locale]
  );

  const formatNumber = useCallback(
    (num: number) => {
      return num.toLocaleString(locale);
    },
    [locale]
  );

  return {
    locale,
    changeLocale,
    formatDate,
    formatNumber,
    isRTL: locale === 'ar',
  };
}
