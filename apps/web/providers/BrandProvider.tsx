/**
 * Server component that fetches the platform brand config from the API and injects
 * the resulting colors as a `<style>` tag overriding the default CSS variables in
 * globals.css. This means superadmin changes to /superadmin/brand propagate to
 * every page on the next request without a code deploy.
 */

const FALLBACK_BRAND = {
  primary_color: '#7F77DD',
  primary_dark: '#534AB7',
  primary_light: '#E8E6F8',
  secondary_color: '#534AB7',
  accent_color: '#1D9E75',
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

function shade(hex: string, percent: number): string {
  // Lighten/darken a hex color by `percent` (-100..100). Defensive for non-hex input.
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex.replace('#', ''))) return hex;
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
  const primary = brand.primary_color ?? FALLBACK_BRAND.primary_color;
  const primaryDark = brand.primary_dark ?? shade(primary, -20);
  const primaryLight = brand.primary_light ?? shade(primary, 80);
  const secondary = brand.secondary_color ?? primaryDark;
  const accent = brand.accent_color ?? FALLBACK_BRAND.accent_color;

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
