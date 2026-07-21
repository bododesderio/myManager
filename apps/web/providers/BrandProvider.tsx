/**
 * Server component that fetches the platform brand config from the API and injects
 * the resulting colors as a `<style>` tag overriding the default CSS variables in
 * globals.css. This means superadmin changes to /superadmin/brand propagate to
 * every page on the next request without a code deploy.
 */

import { validateHexColor } from '@/lib/brand-color';

const FALLBACK_BRAND = {
  primary_color: '#6D5AE8',
  primary_dark: '#4A36D4',
  primary_light: '#EEEBFE',
  secondary_color: '#FF5C7A',
  accent_color: '#10B981',
  app_name: 'myManager',
};

interface BrandConfig {
  primary_color?: string;
  primary_dark?: string;
  primary_light?: string;
  secondary_color?: string;
  accent_color?: string;
  app_name?: string;
}

async function fetchBrand(): Promise<BrandConfig> {
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/v1/brand`, {
      // Re-fetch every 60s in production; this lets admin updates propagate
      // without a deploy. Use revalidateTag('brand') from a server action for instant.
      next: { revalidate: 60, tags: ['brand'] },
    });
    if (!res.ok) return FALLBACK_BRAND;
    const data = await res.json();
    return { ...FALLBACK_BRAND, ...(data?.data ?? data ?? {}) };
  } catch {
    return FALLBACK_BRAND;
  }
}

/**
 * Lighten/darken a validated six-digit hex color by `percent` (-100..100).
 *
 * Pre-condition: `hex` must already be a validated #RRGGBB value from
 * validateHexColor(). If that invariant is violated the function falls back to
 * the default primary rather than propagating a potentially unsafe string.
 */
function shade(hex: string, percent: number): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return FALLBACK_BRAND.primary_color;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const adjust = (c: number) => {
    const v = Math.round(c + (255 - c) * (percent / 100));
    return Math.max(0, Math.min(255, v));
  };
  const adjustDark = (c: number) => {
    const v = Math.round(c * (1 + percent / 100));
    return Math.max(0, Math.min(255, v));
  };
  const fn = percent >= 0 ? adjust : adjustDark;
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(fn(r))}${toHex(fn(g))}${toHex(fn(b))}`;
}

export async function BrandStyleInjector() {
  const brand = await fetchBrand();

  // [SECURITY] Every API-supplied color must pass strict hex validation before
  // interpolation into the dangerouslySetInnerHTML <style> block.
  //
  // Attack blocked: a malicious superadmin could set a brand color like
  //   `red;} body { display:none }`  or  `</style><script>alert(1)</script>`
  // which would escape the CSS property context when interpolated raw.
  // validateHexColor rejects anything that is not exactly `#` + 6 hex digits,
  // so no semicolons, curly braces, angle brackets, or spaces can pass through.
  const primary = validateHexColor(brand.primary_color, FALLBACK_BRAND.primary_color);
  const primaryDark = validateHexColor(brand.primary_dark, shade(primary, -20));
  const primaryLight = validateHexColor(brand.primary_light, shade(primary, 80));
  const secondary = validateHexColor(brand.secondary_color, primaryDark);
  const accent = validateHexColor(brand.accent_color, FALLBACK_BRAND.accent_color);

  // All values passed to shade() below are already validated — shade() only
  // receives `primary` which was accepted by validateHexColor above.
  const css = `
    :root {
      --color-primary: ${primary};
      --color-primary-dark: ${primaryDark};
      --color-primary-light: ${primaryLight};
      --color-primary-border: ${shade(primary, 60)};
      --color-secondary: ${secondary};
      --color-accent: ${accent};
      --brand-primary: ${primary};
    }
    [data-theme="dark"] {
      --color-primary: ${primary};
      --color-primary-dark: ${shade(primary, 20)};
      --color-primary-light: ${shade(primary, -50)};
      --color-secondary: ${secondary};
      --color-accent: ${accent};
    }
  `.trim();

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
