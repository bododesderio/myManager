/**
 * Centralized brand colors for the mobile app.
 *
 * The constants are mutable so that BrandLoader can patch them at app boot
 * with the latest values from /api/v1/brand. Screens import `colors` by
 * reference so a freshly-mounted screen picks up the resolved color.
 *
 * NOTE: StyleSheet.create() is evaluated at module load time, so already-
 * mounted screens won't reflect a hot brand swap. BrandLoader runs in the
 * root layout BEFORE any tab screen mounts, so cold launches always reflect
 * the latest brand.
 */

export const colors = {
  primary: '#6D5AE8',
  primaryDark: '#4A36D4',
  primaryLight: '#EEEBFE',
  secondary: '#FF5C7A',
  secondaryDark: '#E63462',
  accent: '#10B981',
  accentLight: '#D1FAE5',
  tertiary: '#06B6D4',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#1a1a1a',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',
  border: '#e5e7eb',
  bg: '#ffffff',
  bgMuted: '#f5f5f5',
  bgCard: '#f9fafb',
};

export type BrandColors = typeof colors;

export function applyBrand(partial: Partial<BrandColors>) {
  Object.assign(colors, partial);
}
