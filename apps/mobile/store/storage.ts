import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'mymanager-app-storage',
});

// Typed helpers for common storage operations
export const storageKeys = {
  AUTH_TOKEN: 'auth.token',
  AUTH_USER: 'auth.user',
  LOCALE: 'app.locale',
  BRAND_CACHE: 'app.brand',
  BRAND_CACHE_TIME: 'app.brand.cachedAt',
} as const;
