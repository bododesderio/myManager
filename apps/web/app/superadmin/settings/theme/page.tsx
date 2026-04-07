'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/providers/ToastProvider';
import styles from './page.module.css';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  background: string;
  surface: string;
  border: string;
}

interface DarkModeColors {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
}

interface ThemeRadius {
  card: 'none' | 'small' | 'medium' | 'large';
  button: 'none' | 'small' | 'medium' | 'pill';
}

type UIDensity = 'compact' | 'default' | 'spacious';
type DefaultMode = 'light' | 'dark' | 'follow-os' | 'user-controlled';
type TabKey = 'presets' | 'builder' | 'mode-scope';
type PreviewScope = 'marketing' | 'dashboard';

interface Preset {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  swatches: string[];
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const FONT_OPTIONS = [
  'system-ui',
  'Inter',
  'Georgia',
  'Roboto',
  'Lora',
  'Montserrat',
  'Merriweather',
  'Source Sans 3',
];

const PRESETS: Preset[] = [
  {
    id: 'indigo-default',
    name: 'Indigo Default',
    description: 'The standard myManager look with indigo primary tones.',
    colors: {
      primary: '#6366f1', primaryDark: '#4f46e5', primaryLight: '#a5b4fc',
      accent: '#f59e0b', textPrimary: '#111827', textSecondary: '#4b5563',
      textMuted: '#9ca3af', background: '#f9fafb', surface: '#ffffff', border: '#e5e7eb',
    },
    swatches: ['#6366f1', '#4f46e5', '#a5b4fc', '#f59e0b', '#f9fafb'],
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Cool blues and teals for a calm, professional feel.',
    colors: {
      primary: '#0ea5e9', primaryDark: '#0284c7', primaryLight: '#7dd3fc',
      accent: '#14b8a6', textPrimary: '#0f172a', textSecondary: '#475569',
      textMuted: '#94a3b8', background: '#f0f9ff', surface: '#ffffff', border: '#e2e8f0',
    },
    swatches: ['#0ea5e9', '#0284c7', '#7dd3fc', '#14b8a6', '#f0f9ff'],
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    description: 'Nature-inspired greens for eco-conscious brands.',
    colors: {
      primary: '#10b981', primaryDark: '#059669', primaryLight: '#6ee7b7',
      accent: '#f97316', textPrimary: '#064e3b', textSecondary: '#065f46',
      textMuted: '#6b7280', background: '#f0fdf4', surface: '#ffffff', border: '#d1fae5',
    },
    swatches: ['#10b981', '#059669', '#6ee7b7', '#f97316', '#f0fdf4'],
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm oranges and reds for energetic interfaces.',
    colors: {
      primary: '#f97316', primaryDark: '#ea580c', primaryLight: '#fdba74',
      accent: '#ec4899', textPrimary: '#1c1917', textSecondary: '#57534e',
      textMuted: '#a8a29e', background: '#fffbeb', surface: '#ffffff', border: '#fed7aa',
    },
    swatches: ['#f97316', '#ea580c', '#fdba74', '#ec4899', '#fffbeb'],
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Rich purples for a premium, creative brand.',
    colors: {
      primary: '#8b5cf6', primaryDark: '#7c3aed', primaryLight: '#c4b5fd',
      accent: '#ec4899', textPrimary: '#1e1b4b', textSecondary: '#4c1d95',
      textMuted: '#a78bfa', background: '#faf5ff', surface: '#ffffff', border: '#e9d5ff',
    },
    swatches: ['#8b5cf6', '#7c3aed', '#c4b5fd', '#ec4899', '#faf5ff'],
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    description: 'Dark neutral tones for sleek, modern dashboards.',
    colors: {
      primary: '#64748b', primaryDark: '#475569', primaryLight: '#94a3b8',
      accent: '#38bdf8', textPrimary: '#f8fafc', textSecondary: '#cbd5e1',
      textMuted: '#94a3b8', background: '#0f172a', surface: '#1e293b', border: '#334155',
    },
    swatches: ['#64748b', '#475569', '#38bdf8', '#0f172a', '#1e293b'],
  },
];

const DEFAULT_COLORS: ThemeColors = { ...PRESETS[0].colors };

const DEFAULT_DARK_COLORS: DarkModeColors = {
  background: '#111827',
  surface: '#1f2937',
  textPrimary: '#f9fafb',
  textSecondary: '#d1d5db',
  border: '#374151',
};

const SCOPE_ROWS = [
  { area: 'Marketing pages', default: 'Light', respectsOs: 'Yes', userOverride: 'No' },
  { area: 'Dashboard', default: 'Follow OS', respectsOs: 'Yes', userOverride: 'Yes' },
  { area: 'Admin panel', default: 'Light', respectsOs: 'No', userOverride: 'No' },
  { area: 'Auth pages', default: 'Light', respectsOs: 'Yes', userOverride: 'No' },
];

/* -------------------------------------------------------------------------- */
/*  Small reusable components                                                 */
/* -------------------------------------------------------------------------- */

function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded border border-gray-300 p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-brand-primary focus:outline-none"
        />
      </div>
    </div>
  );
}

function PillToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-brand border border-gray-300 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium transition ${
            value === opt.value
              ? `bg-brand-primary text-white ${styles.brandActive}`
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main page component                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminThemeSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('presets');
  const [activePresetId, setActivePresetId] = useState<string>('indigo-default');

  /* Builder state */
  const [colors, setColors] = useState<ThemeColors>({ ...DEFAULT_COLORS });
  const [darkColors, setDarkColors] = useState<DarkModeColors>({ ...DEFAULT_DARK_COLORS });
  const [darkColorsOpen, setDarkColorsOpen] = useState(false);
  const [typography, setTypography] = useState<ThemeTypography>({ headingFont: 'system-ui', bodyFont: 'system-ui' });
  const [radius, setRadius] = useState<ThemeRadius>({ card: 'medium', button: 'medium' });
  const [density, setDensity] = useState<UIDensity>('default');
  const [previewScope, setPreviewScope] = useState<PreviewScope>('marketing');
  const [saving, setSaving] = useState(false);

  /* Mode & scope state */
  const [defaultMode, setDefaultMode] = useState<DefaultMode>('light');
  const [allowUserOverride, setAllowUserOverride] = useState(true);
  const [modeDarkColors, setModeDarkColors] = useState<DarkModeColors>({ ...DEFAULT_DARK_COLORS });

  /* Helpers */
  const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateDarkColor = useCallback((key: keyof DarkModeColors, value: string) => {
    setDarkColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateModeDarkColor = useCallback((key: keyof DarkModeColors, value: string) => {
    setModeDarkColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function applyPreset(id: string) {
    try {
      const res = await fetch(`/api/v1/admin/theme/apply-preset/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to apply preset');
      setActivePresetId(id);
      const preset = PRESETS.find((p) => p.id === id);
      if (preset) setColors({ ...preset.colors });
    } catch {
      toast({ title: 'Failed to apply preset', variant: 'error' });
    }
  }

  async function handleSaveTheme() {
    setSaving(true);
    try {
      await fetch('/api/v1/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors, darkColors, typography, radius, density }),
      });
    } catch {
      toast({ title: 'Failed to save theme', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    setColors({ ...DEFAULT_COLORS });
    setDarkColors({ ...DEFAULT_DARK_COLORS });
    setTypography({ headingFont: 'system-ui', bodyFont: 'system-ui' });
    setRadius({ card: 'medium', button: 'medium' });
    setDensity('default');
  }

  async function handleSaveAsPreset() {
    const name = prompt('Preset name:');
    if (!name) return;
    try {
      await fetch('/api/v1/admin/theme/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, colors, darkColors, typography, radius, density }),
      });
    } catch {
      toast({ title: 'Failed to save preset', variant: 'error' });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  CSS custom properties applied to the wrapper                          */
  /* ---------------------------------------------------------------------- */
  const cssVars: Record<string, string> = {
    '--theme-primary': colors.primary,
    '--theme-primary-dark': colors.primaryDark,
    '--theme-primary-light': colors.primaryLight,
    '--theme-accent': colors.accent,
    '--theme-text-primary': colors.textPrimary,
    '--theme-text-secondary': colors.textSecondary,
    '--theme-text-muted': colors.textMuted,
    '--theme-background': colors.background,
    '--theme-surface': colors.surface,
    '--theme-border': colors.border,
    '--theme-dark-background': darkColors.background,
    '--theme-dark-surface': darkColors.surface,
    '--theme-dark-text-primary': darkColors.textPrimary,
    '--theme-dark-text-secondary': darkColors.textSecondary,
    '--theme-dark-border': darkColors.border,
    '--theme-font-heading': typography.headingFont,
    '--theme-font-body': typography.bodyFont,
  };

  /* ---------------------------------------------------------------------- */
  /*  Tabs                                                                  */
  /* ---------------------------------------------------------------------- */
  const TABS: { key: TabKey; label: string }[] = [
    { key: 'presets', label: 'Presets' },
    { key: 'builder', label: 'Theme Builder' },
    { key: 'mode-scope', label: 'Mode & Scope' },
  ];

  return (
    <div className="space-y-6" style={cssVars as React.CSSProperties}>
      <div>
        <h1 className="font-heading text-2xl font-bold">Theme Settings</h1>
        <p className="text-sm text-gray-500">
          Customize the visual appearance of the platform.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? `border-b-2 text-brand-primary ${styles.tabActive}`
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'presets' && (
        <PresetsPanel
          activePresetId={activePresetId}
          onApply={applyPreset}
          onOpenBuilder={() => setActiveTab('builder')}
        />
      )}

      {activeTab === 'builder' && (
        <BuilderPanel
          colors={colors}
          darkColors={darkColors}
          darkColorsOpen={darkColorsOpen}
          typography={typography}
          radius={radius}
          density={density}
          previewScope={previewScope}
          saving={saving}
          onUpdateColor={updateColor}
          onUpdateDarkColor={updateDarkColor}
          onToggleDarkColors={() => setDarkColorsOpen((o) => !o)}
          onTypographyChange={setTypography}
          onRadiusChange={setRadius}
          onDensityChange={setDensity}
          onPreviewScopeChange={setPreviewScope}
          onSave={handleSaveTheme}
          onReset={handleResetDefaults}
          onSaveAsPreset={handleSaveAsPreset}
        />
      )}

      {activeTab === 'mode-scope' && (
        <ModeScopePanel
          defaultMode={defaultMode}
          allowUserOverride={allowUserOverride}
          darkColors={modeDarkColors}
          onModeChange={setDefaultMode}
          onToggleOverride={setAllowUserOverride}
          onDarkColorChange={updateModeDarkColor}
        />
      )}
    </div>
  );
}

/* ========================================================================== */
/*  TAB 1 - Presets                                                           */
/* ========================================================================== */

function PresetsPanel({
  activePresetId,
  onApply,
  onOpenBuilder,
}: {
  activePresetId: string;
  onApply: (id: string) => void;
  onOpenBuilder: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PRESETS.map((preset) => {
        const isActive = preset.id === activePresetId;
        return (
          <div
            key={preset.id}
            className={`relative rounded-brand border bg-white p-4 shadow-sm transition hover:shadow-md ${isActive ? styles.brandBorder : ''}`}
          >
            {isActive && (
              <span
                className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${styles.brandActive}`}
              >
                Active
              </span>
            )}

            {/* Mini preview */}
            <div
              className={`mb-3 flex h-16 overflow-hidden rounded ${styles.dynBg}`}
              style={{ ['--dyn-bg' as string]: preset.colors.background } as React.CSSProperties}
            >
              <div
                className={`w-6 ${styles.dynBg}`}
                style={{ ['--dyn-bg' as string]: preset.colors.primaryDark } as React.CSSProperties}
              />
              <div className="flex flex-1 flex-col">
                <div
                  className={`h-6 ${styles.dynBg}`}
                  style={{ ['--dyn-bg' as string]: preset.colors.primary } as React.CSSProperties}
                />
                <div
                  className={`flex-1 ${styles.dynBg}`}
                  style={{ ['--dyn-bg' as string]: preset.colors.surface } as React.CSSProperties}
                />
              </div>
            </div>

            <h3 className="font-heading text-sm font-semibold">{preset.name}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{preset.description}</p>

            {/* Swatches */}
            <div className="mt-3 flex gap-1.5">
              {preset.swatches.map((swatch, i) => (
                <span
                  key={i}
                  className={`inline-block h-5 w-5 rounded-full border border-gray-200 ${styles.dynBg}`}
                  style={{ ['--dyn-bg' as string]: swatch } as React.CSSProperties}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onApply(preset.id)}
              disabled={isActive}
              className={`mt-4 w-full rounded-brand px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'cursor-default bg-gray-100 text-gray-400'
                  : `bg-brand-primary text-white hover:opacity-90 ${styles.brandActive}`
              }`}
            >
              {isActive ? 'Currently active' : 'Apply preset'}
            </button>
          </div>
        );
      })}

      {/* Custom theme card */}
      <button
        type="button"
        onClick={onOpenBuilder}
        className="flex flex-col items-center justify-center rounded-brand border-2 border-dashed border-gray-300 bg-white p-4 text-center transition hover:border-gray-400 hover:shadow-sm"
      >
        <div className="mb-2 flex h-16 w-full items-center justify-center rounded bg-gray-50">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
          </svg>
        </div>
        <h3 className="font-heading text-sm font-semibold text-gray-700">Custom Theme</h3>
        <p className="mt-0.5 text-xs text-gray-500">Build your own from scratch</p>
        <span className={`mt-3 text-xs font-semibold text-brand-primary ${styles.brandText}`}>
          Open theme builder &rarr;
        </span>
      </button>
    </div>
  );
}

/* ========================================================================== */
/*  TAB 2 - Theme Builder                                                     */
/* ========================================================================== */

function BuilderPanel({
  colors,
  darkColors,
  darkColorsOpen,
  typography,
  radius,
  density,
  previewScope,
  saving,
  onUpdateColor,
  onUpdateDarkColor,
  onToggleDarkColors,
  onTypographyChange,
  onRadiusChange,
  onDensityChange,
  onPreviewScopeChange,
  onSave,
  onReset,
  onSaveAsPreset,
}: {
  colors: ThemeColors;
  darkColors: DarkModeColors;
  darkColorsOpen: boolean;
  typography: ThemeTypography;
  radius: ThemeRadius;
  density: UIDensity;
  previewScope: PreviewScope;
  saving: boolean;
  onUpdateColor: (key: keyof ThemeColors, value: string) => void;
  onUpdateDarkColor: (key: keyof DarkModeColors, value: string) => void;
  onToggleDarkColors: () => void;
  onTypographyChange: (t: ThemeTypography) => void;
  onRadiusChange: (r: ThemeRadius) => void;
  onDensityChange: (d: UIDensity) => void;
  onPreviewScopeChange: (s: PreviewScope) => void;
  onSave: () => void;
  onReset: () => void;
  onSaveAsPreset: () => void;
}) {
  const radiusValue = (r: string) => {
    switch (r) {
      case 'none': return '0px';
      case 'small': return '4px';
      case 'medium': return '8px';
      case 'large': return '16px';
      case 'pill': return '9999px';
      default: return '8px';
    }
  };

  const densityPadding = density === 'compact' ? '12px' : density === 'spacious' ? '24px' : '16px';

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Controls sidebar */}
      <div className="w-full shrink-0 space-y-5 lg:w-[280px]">
        {/* Colors */}
        <div className="rounded-brand border bg-white p-4 shadow-sm">
          <h2 className="font-heading text-sm font-semibold">Colors</h2>
          <div className="mt-3 space-y-3">
            <ColorPickerField label="Primary" value={colors.primary} onChange={(v) => onUpdateColor('primary', v)} />
            <ColorPickerField label="Primary dark" value={colors.primaryDark} onChange={(v) => onUpdateColor('primaryDark', v)} />
            <ColorPickerField label="Primary light" value={colors.primaryLight} onChange={(v) => onUpdateColor('primaryLight', v)} />
            <ColorPickerField label="Accent" value={colors.accent} onChange={(v) => onUpdateColor('accent', v)} />
            <ColorPickerField label="Text primary" value={colors.textPrimary} onChange={(v) => onUpdateColor('textPrimary', v)} />
            <ColorPickerField label="Text secondary" value={colors.textSecondary} onChange={(v) => onUpdateColor('textSecondary', v)} />
            <ColorPickerField label="Text muted" value={colors.textMuted} onChange={(v) => onUpdateColor('textMuted', v)} />
            <ColorPickerField label="Background" value={colors.background} onChange={(v) => onUpdateColor('background', v)} />
            <ColorPickerField label="Surface" value={colors.surface} onChange={(v) => onUpdateColor('surface', v)} />
            <ColorPickerField label="Border" value={colors.border} onChange={(v) => onUpdateColor('border', v)} />
          </div>
        </div>

        {/* Dark mode colors (collapsible) */}
        <div className="rounded-brand border bg-white shadow-sm">
          <button
            type="button"
            onClick={onToggleDarkColors}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <h2 className="font-heading text-sm font-semibold">Dark Mode Colors</h2>
            <svg
              className={`h-4 w-4 text-gray-500 transition-transform ${darkColorsOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>
          {darkColorsOpen && (
            <div className="space-y-3 border-t px-4 pb-4 pt-3">
              <ColorPickerField label="Background" value={darkColors.background} onChange={(v) => onUpdateDarkColor('background', v)} />
              <ColorPickerField label="Surface" value={darkColors.surface} onChange={(v) => onUpdateDarkColor('surface', v)} />
              <ColorPickerField label="Text primary" value={darkColors.textPrimary} onChange={(v) => onUpdateDarkColor('textPrimary', v)} />
              <ColorPickerField label="Text secondary" value={darkColors.textSecondary} onChange={(v) => onUpdateDarkColor('textSecondary', v)} />
              <ColorPickerField label="Border" value={darkColors.border} onChange={(v) => onUpdateDarkColor('border', v)} />
            </div>
          )}
        </div>

        {/* Typography */}
        <div className="rounded-brand border bg-white p-4 shadow-sm">
          <h2 className="font-heading text-sm font-semibold">Typography</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Heading font</label>
              <select
                value={typography.headingFont}
                onChange={(e) => onTypographyChange({ ...typography, headingFont: e.target.value })}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Body font</label>
              <select
                value={typography.bodyFont}
                onChange={(e) => onTypographyChange({ ...typography, bodyFont: e.target.value })}
                className="mt-1 block w-full rounded-brand border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-primary focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Border radius */}
        <div className="rounded-brand border bg-white p-4 shadow-sm">
          <h2 className="font-heading text-sm font-semibold">Border Radius</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Card</label>
              <PillToggle
                options={[
                  { label: 'None', value: 'none' as const },
                  { label: 'Small', value: 'small' as const },
                  { label: 'Medium', value: 'medium' as const },
                  { label: 'Large', value: 'large' as const },
                ]}
                value={radius.card}
                onChange={(v) => onRadiusChange({ ...radius, card: v })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Button</label>
              <PillToggle
                options={[
                  { label: 'None', value: 'none' as const },
                  { label: 'Small', value: 'small' as const },
                  { label: 'Medium', value: 'medium' as const },
                  { label: 'Pill', value: 'pill' as const },
                ]}
                value={radius.button}
                onChange={(v) => onRadiusChange({ ...radius, button: v })}
              />
            </div>
          </div>
        </div>

        {/* UI Density */}
        <div className="rounded-brand border bg-white p-4 shadow-sm">
          <h2 className="font-heading text-sm font-semibold">UI Density</h2>
          <div className="mt-3">
            <PillToggle
              options={[
                { label: 'Compact', value: 'compact' as const },
                { label: 'Default', value: 'default' as const },
                { label: 'Spacious', value: 'spacious' as const },
              ]}
              value={density}
              onChange={onDensityChange}
            />
          </div>
        </div>
      </div>

      {/* Live preview canvas */}
      <div className="flex flex-1 flex-col">
        {/* Scope toggle */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Preview:</span>
          <PillToggle
            options={[
              { label: 'Marketing', value: 'marketing' as const },
              { label: 'Dashboard', value: 'dashboard' as const },
            ]}
            value={previewScope}
            onChange={onPreviewScopeChange}
          />
        </div>

        <div
          className={`flex-1 overflow-hidden rounded-brand border shadow-sm ${styles.previewCanvas}`}
          style={{
            ['--canvas-bg' as string]: colors.background,
            ['--canvas-font' as string]: typography.bodyFont,
          } as React.CSSProperties}
        >
          {previewScope === 'marketing' ? (
            /* Marketing preview */
            <div className="flex h-full flex-col">
              {/* Nav bar */}
              <div
                className={`flex items-center justify-between px-4 ${styles.navBar}`}
                style={{
                  ['--nav-bg' as string]: colors.surface,
                  ['--nav-border' as string]: colors.border,
                  ['--nav-padding' as string]: densityPadding,
                } as React.CSSProperties}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded ${styles.brandSquare}`} style={{ ['--sq-color' as string]: colors.primary } as React.CSSProperties} />
                  <span className={`text-sm font-semibold ${styles.brandLabel}`} style={{ ['--label-color' as string]: colors.textPrimary, ['--label-font' as string]: typography.headingFont } as React.CSSProperties}>Brand</span>
                </div>
                <div className="flex gap-2">
                  <div className={`h-3 w-10 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textMuted, ['--block-opacity' as string]: '0.4' } as React.CSSProperties} />
                  <div className={`h-3 w-10 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textMuted, ['--block-opacity' as string]: '0.4' } as React.CSSProperties} />
                  <div
                    className={`h-6 px-3 flex items-center text-xs text-white font-medium ${styles.cta}`}
                    style={{ ['--cta-bg' as string]: colors.primary, ['--cta-radius' as string]: radiusValue(radius.button) } as React.CSSProperties}
                  >
                    CTA
                  </div>
                </div>
              </div>

              {/* Hero */}
              <div
                className={`flex flex-col items-center justify-center py-10 ${styles.hero}`}
                style={{ ['--hero-bg' as string]: colors.primary, ['--hero-padding' as string]: densityPadding } as React.CSSProperties}
              >
                <div className={`h-4 w-48 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.primaryLight, ['--block-opacity' as string]: '0.5' } as React.CSSProperties} />
                <div className={`mt-2 h-3 w-64 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.primaryLight, ['--block-opacity' as string]: '0.3' } as React.CSSProperties} />
                <div
                  className={`mt-4 h-8 px-5 flex items-center text-xs font-semibold ${styles.heroCta}`}
                  style={{ ['--cta-bg' as string]: colors.accent, ['--cta-radius' as string]: radiusValue(radius.button) } as React.CSSProperties}
                >
                  Get Started
                </div>
              </div>

              {/* Cards row */}
              <div className={`flex gap-3 p-4 ${styles.cardsRow}`} style={{ ['--row-padding' as string]: densityPadding } as React.CSSProperties}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 p-3 ${styles.previewCard}`}
                    style={{
                      ['--card-bg' as string]: colors.surface,
                      ['--card-border' as string]: colors.border,
                      ['--card-radius' as string]: radiusValue(radius.card),
                    } as React.CSSProperties}
                  >
                    <div className={`h-3 w-16 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textPrimary, ['--block-opacity' as string]: '0.15' } as React.CSSProperties} />
                    <div className={`mt-2 h-2 w-full rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textMuted, ['--block-opacity' as string]: '0.2' } as React.CSSProperties} />
                    <div className={`mt-1 h-2 w-3/4 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textMuted, ['--block-opacity' as string]: '0.15' } as React.CSSProperties} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Dashboard preview */
            <div className={`flex h-full ${styles.dashboardWrap}`}>
              {/* Sidebar */}
              <div className={`w-14 shrink-0 flex flex-col items-center gap-3 py-3 ${styles.sidebar}`} style={{ ['--sb-bg' as string]: colors.primaryDark } as React.CSSProperties}>
                <div className={`h-6 w-6 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.primaryLight, ['--block-opacity' as string]: '0.5' } as React.CSSProperties} />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-5 w-5 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.primaryLight, ['--block-opacity' as string]: i === 1 ? '0.8' : '0.25' } as React.CSSProperties} />
                ))}
              </div>

              <div className="flex-1 flex flex-col">
                {/* Top bar */}
                <div
                  className={`flex items-center justify-between px-4 py-2 ${styles.topbar}`}
                  style={{ ['--tb-bg' as string]: colors.surface, ['--tb-border' as string]: colors.border } as React.CSSProperties}
                >
                  <div className={`h-3 w-24 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textPrimary, ['--block-opacity' as string]: '0.15' } as React.CSSProperties} />
                  <div className={`h-6 w-6 rounded-full ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.primary, ['--block-opacity' as string]: '0.3' } as React.CSSProperties} />
                </div>

                {/* Content */}
                <div className={`flex-1 p-4 space-y-3 ${styles.contentArea}`} style={{ ['--content-padding' as string]: densityPadding } as React.CSSProperties}>
                  {/* Stat cards */}
                  <div className="flex gap-3">
                    {[colors.primary, colors.accent, colors.primaryLight].map((c, i) => (
                      <div
                        key={i}
                        className={`flex-1 p-3 ${styles.previewCard}`}
                        style={{
                          ['--card-bg' as string]: colors.surface,
                          ['--card-border' as string]: colors.border,
                          ['--card-radius' as string]: radiusValue(radius.card),
                        } as React.CSSProperties}
                      >
                        <div className={`h-2 w-10 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textMuted, ['--block-opacity' as string]: '0.3' } as React.CSSProperties} />
                        <div className={`mt-2 h-4 w-12 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: c, ['--block-opacity' as string]: '0.6' } as React.CSSProperties} />
                      </div>
                    ))}
                  </div>

                  {/* Table placeholder */}
                  <div
                    className={`p-3 space-y-2 ${styles.previewCard}`}
                    style={{
                      ['--card-bg' as string]: colors.surface,
                      ['--card-border' as string]: colors.border,
                      ['--card-radius' as string]: radiusValue(radius.card),
                    } as React.CSSProperties}
                  >
                    {[1, 2, 3, 4].map((row) => (
                      <div key={row} className="flex gap-3 items-center">
                        <div className={`h-2 w-1/4 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textPrimary, ['--block-opacity' as string]: row === 1 ? '0.2' : '0.08' } as React.CSSProperties} />
                        <div className={`h-2 w-1/3 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textSecondary, ['--block-opacity' as string]: row === 1 ? '0.15' : '0.06' } as React.CSSProperties} />
                        <div className={`h-2 w-1/6 rounded ${styles.mutedBlock}`} style={{ ['--block-color' as string]: colors.textMuted, ['--block-opacity' as string]: row === 1 ? '0.15' : '0.06' } as React.CSSProperties} />
                        <div className="flex-1" />
                        <div
                          className={`h-5 w-12 flex items-center justify-center text-[9px] text-white font-medium ${styles.tableRowBtn}`}
                          style={{ ['--row-bg' as string]: row === 1 ? colors.primary : 'transparent', ['--row-radius' as string]: radiusValue(radius.button), ['--row-opacity' as string]: row === 1 ? '1' : '0' } as React.CSSProperties}
                        >
                          {row === 1 ? 'View' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-3 rounded-brand border bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={onReset}
            className="rounded-brand border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Reset to default
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveAsPreset}
              className="rounded-brand border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Save as preset
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`rounded-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 ${styles.brandActive}`}
            >
              {saving ? 'Saving...' : 'Save & apply platform-wide \u2192'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  TAB 3 - Mode & Scope                                                      */
/* ========================================================================== */

function ModeScopePanel({
  defaultMode,
  allowUserOverride,
  darkColors,
  onModeChange,
  onToggleOverride,
  onDarkColorChange,
}: {
  defaultMode: DefaultMode;
  allowUserOverride: boolean;
  darkColors: DarkModeColors;
  onModeChange: (m: DefaultMode) => void;
  onToggleOverride: (v: boolean) => void;
  onDarkColorChange: (key: keyof DarkModeColors, value: string) => void;
}) {
  const modeOptions: { value: DefaultMode; label: string; description: string }[] = [
    { value: 'light', label: 'Light', description: 'Always use the light theme.' },
    { value: 'dark', label: 'Dark', description: 'Always use the dark theme.' },
    { value: 'follow-os', label: 'Follow OS', description: 'Respect the user\'s system preference.' },
    { value: 'user-controlled', label: 'User controlled', description: 'Let each user choose their preference.' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Default mode */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Default Mode</h2>
        <p className="mt-1 text-xs text-gray-500">Choose the default color mode for all users.</p>
        <div className="mt-4 space-y-3">
          {modeOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-brand border p-3 transition ${
                defaultMode === opt.value ? `border-brand-primary bg-indigo-50/50 ${styles.brandBorder}` : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="defaultMode"
                value={opt.value}
                checked={defaultMode === opt.value}
                onChange={() => onModeChange(opt.value)}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">{opt.label}</span>
                <p className="text-xs text-gray-500">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Allow user override */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">Allow User Override</h2>
            <p className="mt-1 text-xs text-gray-500">
              When enabled, users can override the default mode in their personal settings.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowUserOverride}
            onClick={() => onToggleOverride(!allowUserOverride)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              allowUserOverride ? `bg-brand-primary ${styles.brandActive}` : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                allowUserOverride ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dark mode color overrides */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Dark Mode Color Overrides</h2>
        <p className="mt-1 text-xs text-gray-500">
          Customize the colors used when dark mode is active.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <ColorPickerField label="Background" value={darkColors.background} onChange={(v) => onDarkColorChange('background', v)} />
          <ColorPickerField label="Surface" value={darkColors.surface} onChange={(v) => onDarkColorChange('surface', v)} />
          <ColorPickerField label="Text primary" value={darkColors.textPrimary} onChange={(v) => onDarkColorChange('textPrimary', v)} />
          <ColorPickerField label="Text secondary" value={darkColors.textSecondary} onChange={(v) => onDarkColorChange('textSecondary', v)} />
          <ColorPickerField label="Border" value={darkColors.border} onChange={(v) => onDarkColorChange('border', v)} />
        </div>
      </div>

      {/* Scope rules table */}
      <div className="rounded-brand border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Scope Rules</h2>
        <p className="mt-1 text-xs text-gray-500">
          Read-only overview of how theme modes are applied across different areas.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">Area</th>
                <th className="pb-2 pr-4">Default</th>
                <th className="pb-2 pr-4">Respects OS</th>
                <th className="pb-2">User Override</th>
              </tr>
            </thead>
            <tbody>
              {SCOPE_ROWS.map((row) => (
                <tr key={row.area} className="border-b border-gray-100 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-gray-700">{row.area}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{row.default}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.respectsOs === 'Yes' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {row.respectsOs}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.userOverride === 'Yes' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {row.userOverride}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
