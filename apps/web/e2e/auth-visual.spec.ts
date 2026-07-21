import { test, expect, type Page } from '@playwright/test';

/**
 * Guards the white-on-white regression fixed in AuthShell.module.css /
 * SuperadminLoginForm.module.css: the auth card used a hardcoded white surface
 * while its text followed the theme, so in dark mode the heading, divider and
 * Google button label rendered invisible (light text on a light card).
 *
 * Rather than pixel-diffing (brittle across font/AA changes) we assert the
 * *contrast* between the card surface and its text stays legible in both themes.
 */

type Theme = 'light' | 'dark';

/** Force a theme the way the app does: the anti-FOUC script in layout.tsx reads
 *  localStorage['mymanager-theme'] and stamps data-theme on <html>. */
async function gotoWithTheme(page: Page, path: string, theme: Theme) {
  await page.addInitScript((t) => {
    try {
      window.localStorage.setItem('mymanager-theme', t);
    } catch {
      /* storage may be blocked; test will surface it via the assertion */
    }
  }, theme);
  await page.goto(path, { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

const srgbToLin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const relLuminance = ([r, g, b]: number[]) =>
  0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);

const contrastRatio = (a: number[], b: number[]) => {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const parseRgb = (v: string): number[] => {
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`unparseable color: ${v}`);
  return m[1].split(',').slice(0, 3).map((n) => parseFloat(n.trim()));
};

/** Text color of `heading`, and the background color of the nearest ancestor
 *  that actually paints a surface (skips transparent wrappers). */
async function surfaceContrast(page: Page, headingText: string): Promise<number> {
  const [textColor, bgColor] = await page.evaluate((label) => {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3'));
    const el = headings.find((h) => h.textContent?.trim() === label);
    if (!el) throw new Error(`heading not found: ${label}`);
    const color = getComputedStyle(el).color;
    let node: Element | null = el;
    let bg = 'rgba(0, 0, 0, 0)';
    while (node) {
      const c = getComputedStyle(node).backgroundColor;
      const m = c.match(/rgba?\(([^)]+)\)/);
      const alpha = m ? parseFloat(m[1].split(',')[3] ?? '1') : 0;
      if (alpha > 0.05) {
        bg = c;
        break;
      }
      node = node.parentElement;
    }
    return [color, bg];
  }, headingText);
  return contrastRatio(parseRgb(textColor), parseRgb(bgColor));
}

for (const theme of ['light', 'dark'] as Theme[]) {
  test(`login card heading is legible in ${theme} mode`, async ({ page }, testInfo) => {
    await gotoWithTheme(page, '/login', theme);

    const heading = page.getByRole('heading', { name: 'Sign in', exact: true });
    await expect(heading).toBeVisible();

    // WCAG AA large-text minimum is 3:1; the fix should clear that comfortably.
    // The old white-on-white bug produced a ratio near 1:1.
    const ratio = await surfaceContrast(page, 'Sign in');
    expect(ratio, `card contrast in ${theme} mode`).toBeGreaterThanOrEqual(3);

    await page.screenshot({
      path: testInfo.outputPath(`login-${theme}.png`),
      fullPage: true,
    });
  });
}

test('pricing page renders in dark mode', async ({ page }) => {
  await gotoWithTheme(page, '/pricing', 'dark');
  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.locator('body')).not.toHaveText('');
});
