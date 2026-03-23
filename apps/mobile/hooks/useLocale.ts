import { useState, useCallback } from 'react';
import { getLocales } from 'expo-localization';

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ja' | 'ko' | 'zh' | 'ar';

export function useLocale() {
  const deviceLocales = getLocales();
  const deviceLanguage = (deviceLocales[0]?.languageCode || 'en') as SupportedLocale;

  const [locale, setLocale] = useState<SupportedLocale>(deviceLanguage);

  const changeLocale = useCallback((newLocale: SupportedLocale) => {
    setLocale(newLocale);
    // TODO: persist locale preference and update i18n
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
