import type { Config } from 'tailwindcss';

/**
 * ⚠️ THIS FILE IS NOT LOADED BY THE BUILD.
 *
 * The project runs Tailwind v4 (`@import "tailwindcss"` in app/globals.css),
 * which is CSS-first: a JS config only applies if a `@config` directive points
 * at it, and there is none. Every token that actually works comes from the
 * `@theme` block in app/globals.css — that is the source of truth.
 *
 * This file survives because editor Tailwind IntelliSense still reads it. Keep
 * it roughly in sync for autocomplete, but changing it has NO effect on output.
 * Adding a colour or radius here and expecting a utility to appear will not
 * work — that is exactly how 682 `rounded-*` usages ended up resolving to
 * nothing while the values sat declared in the wrong CSS block.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    // Shared UI package. Tailwind only generates classes it can see, so without
    // this path every @mymanager/ui component renders unstyled.
    '../../packages/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
          border: 'var(--color-primary-border)',
        },
        // Accent palette
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
          border: 'var(--color-accent-border)',
        },
        // Text
        text: {
          DEFAULT: 'var(--color-text)',
          '2': 'var(--color-text-2)',
          muted: 'var(--color-text-muted)',
        },
        // Backgrounds
        bg: {
          DEFAULT: 'var(--color-bg)',
          '2': 'var(--color-bg-2)',
          card: 'var(--color-bg-card)',
        },
        // Borders
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
        // Semantic
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        // Special
        stats: {
          bg: 'var(--color-stats-bg)',
          text: 'var(--color-stats-text)',
        },
      },
      borderRadius: {
        card: 'var(--radius-card)',
        btn: 'var(--radius-btn)',
        input: 'var(--radius-input)',
        badge: 'var(--radius-badge)',
        icon: 'var(--radius-icon)',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;
