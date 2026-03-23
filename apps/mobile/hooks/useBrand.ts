import { useEffect, useState } from 'react';
import { storage, storageKeys } from '@/store/storage';

export interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  logoUrl?: string;
}

const defaultBrand: BrandTheme = {
  primaryColor: '#7F77DD',
  secondaryColor: '#5A52B5',
  appName: 'MyManager',
};

const BRAND_CACHE_TTL = 1000 * 60 * 60; // 1 hour

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

function getCachedBrand(): BrandTheme | null {
  const cachedJson = storage.getString(storageKeys.BRAND_CACHE);
  const cachedAtStr = storage.getString(storageKeys.BRAND_CACHE_TIME);
  if (!cachedJson || !cachedAtStr) return null;

  const cachedAt = Number(cachedAtStr);
  if (Date.now() - cachedAt > BRAND_CACHE_TTL) return null;

  try {
    return JSON.parse(cachedJson) as BrandTheme;
  } catch {
    return null;
  }
}

function setCachedBrand(brand: BrandTheme) {
  storage.set(storageKeys.BRAND_CACHE, JSON.stringify(brand));
  storage.set(storageKeys.BRAND_CACHE_TIME, String(Date.now()));
}

export function useBrand(): BrandTheme {
  const [brand, setBrand] = useState<BrandTheme>(() => {
    return getCachedBrand() || defaultBrand;
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchBrand() {
      try {
        // Public endpoint: /api/brand (no /v1 prefix)
        const response = await fetch(`${BASE_URL}/brand`);
        if (!response.ok) return;
        const data = (await response.json()) as BrandTheme;
        if (!cancelled) {
          setBrand(data);
          setCachedBrand(data);
        }
      } catch {
        // Use cached or default brand on error
      }
    }

    // Only fetch if cache is stale or missing
    if (!getCachedBrand()) {
      fetchBrand();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return brand;
}
