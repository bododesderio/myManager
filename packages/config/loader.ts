import type { BrandConfig } from './schema';
import { brandConfigSchema } from './schema';
import { defaultBrandConfig } from './defaults';

let cachedConfig: BrandConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function loadBrandConfig(apiBaseUrl?: string): Promise<BrandConfig> {
  const now = Date.now();
  if (cachedConfig && now - cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  if (!apiBaseUrl) {
    return defaultBrandConfig;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/brand`, {
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!response.ok) {
      console.warn('Brand config API unavailable, using defaults');
      return defaultBrandConfig;
    }

    const data = await response.json();
    const parsed = brandConfigSchema.safeParse(data);

    if (!parsed.success) {
      console.warn('Invalid brand config from API:', parsed.error.flatten());
      return defaultBrandConfig;
    }

    cachedConfig = parsed.data;
    cachedAt = now;
    return parsed.data;
  } catch {
    console.warn('Brand config API unavailable, using defaults');
    return defaultBrandConfig;
  }
}

export function clearBrandConfigCache(): void {
  cachedConfig = null;
  cachedAt = 0;
}
