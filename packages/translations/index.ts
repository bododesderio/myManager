import enCommon from './en/common.json';
import enComposer from './en/composer.json';
import enDashboard from './en/dashboard.json';
import enBilling from './en/billing.json';
import enAuth from './en/auth.json';
import enMarketing from './en/marketing.json';
import enEmails from './en/emails.json';

export const translations = {
  en: { common: enCommon, composer: enComposer, dashboard: enDashboard, billing: enBilling, auth: enAuth, marketing: enMarketing, emails: enEmails },
} as const;

export const SUPPORTED_LOCALES = ['en', 'fr', 'sw', 'ar', 'es', 'pt'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'Français',
  sw: 'Kiswahili',
  ar: 'العربية',
  es: 'Español',
  pt: 'Português',
};

export const RTL_LOCALES: SupportedLocale[] = ['ar'];

export function isRtl(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}
