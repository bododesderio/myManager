import { applyBrand } from '@/theme/colors';
import { apiClient } from './apiClient';

interface BrandResponse {
  primary_color?: string;
  primary_dark?: string;
  primary_light?: string;
  secondary_color?: string;
  accent_color?: string;
}

/**
 * Fetch the platform brand colors from the API and patch the in-memory `colors`
 * object BEFORE any screen renders. Called once from the root layout. If the
 * fetch fails (offline, API down, etc.) the seeded fallbacks in colors.ts remain.
 *
 * Because StyleSheet.create() captures the value at module-load time, this MUST
 * run before any screen module is imported. The root _layout.tsx awaits it
 * inside a useEffect that gates the first render.
 */
export async function loadBrand(): Promise<void> {
  try {
    const data = await apiClient.get<BrandResponse>('/brand');
    if (!data) return;
    applyBrand({
      ...(data.primary_color && { primary: data.primary_color }),
      ...(data.primary_dark && { primaryDark: data.primary_dark }),
      ...(data.primary_light && { primaryLight: data.primary_light }),
      ...(data.secondary_color && { secondary: data.secondary_color }),
      ...(data.accent_color && { accent: data.accent_color }),
    });
  } catch {
    // Non-critical — keep defaults
  }
}
