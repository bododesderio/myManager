import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@mymanager/language';

// Minimal in-app strings — extend as needed. Server-supplied content is translated server-side.
const resources = {
  en: {
    translation: {
      common: {
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        loading: 'Loading…',
        retry: 'Retry',
      },
      tabs: {
        home: 'Home',
        analytics: 'Analytics',
        calendar: 'Calendar',
        compose: 'Compose',
        settings: 'Settings',
      },
    },
  },
  es: {
    translation: {
      common: {
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        loading: 'Cargando…',
        retry: 'Reintentar',
      },
      tabs: {
        home: 'Inicio',
        analytics: 'Analítica',
        calendar: 'Calendario',
        compose: 'Crear',
        settings: 'Ajustes',
      },
    },
  },
  fr: {
    translation: {
      common: { cancel: 'Annuler', save: 'Enregistrer', delete: 'Supprimer', edit: 'Modifier', loading: 'Chargement…', retry: 'Réessayer' },
      tabs: { home: 'Accueil', analytics: 'Analytique', calendar: 'Calendrier', compose: 'Créer', settings: 'Paramètres' },
    },
  },
  pt: {
    translation: {
      common: { cancel: 'Cancelar', save: 'Salvar', delete: 'Excluir', edit: 'Editar', loading: 'Carregando…', retry: 'Tentar de novo' },
      tabs: { home: 'Início', analytics: 'Análise', calendar: 'Calendário', compose: 'Criar', settings: 'Configurações' },
    },
  },
  ar: {
    translation: {
      common: { cancel: 'إلغاء', save: 'حفظ', delete: 'حذف', edit: 'تعديل', loading: '...جار التحميل', retry: 'إعادة المحاولة' },
      tabs: { home: 'الرئيسية', analytics: 'التحليلات', calendar: 'التقويم', compose: 'إنشاء', settings: 'الإعدادات' },
    },
  },
  sw: {
    translation: {
      common: { cancel: 'Ghairi', save: 'Hifadhi', delete: 'Futa', edit: 'Hariri', loading: 'Inapakia…', retry: 'Jaribu tena' },
      tabs: { home: 'Mwanzo', analytics: 'Takwimu', calendar: 'Kalenda', compose: 'Tunga', settings: 'Mipangilio' },
    },
  },
};

export const SUPPORTED_LANGUAGES = Object.keys(resources);

export async function initI18n() {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
  const initialLang =
    stored && SUPPORTED_LANGUAGES.includes(stored)
      ? stored
      : SUPPORTED_LANGUAGES.includes(deviceLocale)
        ? deviceLocale
        : 'en';

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: initialLang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  }
  return initialLang;
}

export async function setLanguage(code: string) {
  if (!SUPPORTED_LANGUAGES.includes(code)) return;
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export function getCurrentLanguage(): string {
  return i18n.language || 'en';
}

export default i18n;
