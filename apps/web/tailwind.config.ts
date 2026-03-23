import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
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
