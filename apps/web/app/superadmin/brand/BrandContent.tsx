"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/providers/ToastProvider";
import { FileUpload } from "@/components/FileUpload";
import { Card } from '@mymanager/ui';
import { apiClient } from '@/lib/api/client';

interface BrandConfig {
  app_name: string;
  app_tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  support_email: string;
  sales_email: string;
  footer_made_in: string;
  footer_copyright: string;
  footer_attribution_text: string;
  footer_attribution_url: string;
  meta_title_suffix: string;
}

interface ThemeConfig {
  color_primary: string;
  color_primary_dark: string;
  color_accent: string;
  font_heading: string;
  font_body: string;
}

export function BrandContent() {
  const { toast } = useToast();
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [brandData, themeData] = await Promise.all([
        apiClient.get<BrandConfig>("/cms/brand"),
        apiClient.get<ThemeConfig>("/cms/theme"),
      ]);
      setBrand(brandData);
      setTheme(themeData);
    } catch {
      toast({ title: "Could not load brand configuration", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!brand || !theme) return;
    setSaving(true);
    try {
      await Promise.all([
        apiClient.patch("/admin/cms/brand", brand),
        apiClient.patch("/admin/cms/theme", theme),
      ]);
      toast({ title: "Brand config saved", variant: "success" });
    } catch {
      toast({ title: "Failed to save brand config", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !brand || !theme) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-border" />
        <div className="h-40 animate-pulse rounded-brand bg-bg-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Brand Configuration</h1>
      <p className="text-sm text-text-2">
        Configure live brand, support, and theme settings for the platform.
      </p>

      <div className="max-w-2xl space-y-6">
        <Card>
          <h2 className="font-heading text-lg font-semibold">
            Platform Identity
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="appName"
                className="block text-sm font-medium text-text-2"
              >
                Application Name
              </label>
              <input
                id="appName"
                type="text"
                value={brand.app_name}
                onChange={(e) =>
                  setBrand({ ...brand, app_name: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="appTagline"
                className="block text-sm font-medium text-text-2"
              >
                Tagline
              </label>
              <input
                id="appTagline"
                type="text"
                value={brand.app_tagline}
                onChange={(e) =>
                  setBrand({ ...brand, app_tagline: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <FileUpload
              label="Logo"
              value={brand.logo_url ?? ""}
              onChange={(url) => setBrand({ ...brand, logo_url: url || null })}
              accept="image/*"
            />
            <FileUpload
              label="Favicon"
              value={brand.favicon_url ?? ""}
              onChange={(url) =>
                setBrand({ ...brand, favicon_url: url || null })
              }
              accept="image/*"
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-lg font-semibold">Theme</h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-2">
                Primary
              </label>
              <input
                type="color"
                value={theme.color_primary}
                onChange={(e) =>
                  setTheme({ ...theme, color_primary: e.target.value })
                }
                className="mt-1 h-10 w-full rounded border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2">
                Primary Dark
              </label>
              <input
                type="color"
                value={theme.color_primary_dark}
                onChange={(e) =>
                  setTheme({ ...theme, color_primary_dark: e.target.value })
                }
                className="mt-1 h-10 w-full rounded border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2">
                Accent
              </label>
              <input
                type="color"
                value={theme.color_accent}
                onChange={(e) =>
                  setTheme({ ...theme, color_accent: e.target.value })
                }
                className="mt-1 h-10 w-full rounded border border-border"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-lg font-semibold">Typography</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fontHeading"
                className="block text-sm font-medium text-text-2"
              >
                Heading Font
              </label>
              <input
                id="fontHeading"
                type="text"
                value={theme.font_heading}
                onChange={(e) =>
                  setTheme({ ...theme, font_heading: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="fontBody"
                className="block text-sm font-medium text-text-2"
              >
                Body Font
              </label>
              <input
                id="fontBody"
                type="text"
                value={theme.font_body}
                onChange={(e) =>
                  setTheme({ ...theme, font_body: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-lg font-semibold">
            Support & Footer
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-2">
                Support Email
              </label>
              <input
                type="email"
                value={brand.support_email}
                onChange={(e) =>
                  setBrand({ ...brand, support_email: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2">
                Sales Email
              </label>
              <input
                type="email"
                value={brand.sales_email}
                onChange={(e) =>
                  setBrand({ ...brand, sales_email: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2">
                Footer Note
              </label>
              <input
                type="text"
                value={brand.footer_made_in}
                onChange={(e) =>
                  setBrand({ ...brand, footer_made_in: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2">
                Copyright
              </label>
              <input
                type="text"
                value={brand.footer_copyright}
                onChange={(e) =>
                  setBrand({ ...brand, footer_copyright: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2">
                Attribution Text
              </label>
              <input
                type="text"
                value={brand.footer_attribution_text}
                onChange={(e) =>
                  setBrand({
                    ...brand,
                    footer_attribution_text: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2">
                Attribution URL
              </label>
              <input
                type="url"
                value={brand.footer_attribution_url}
                onChange={(e) =>
                  setBrand({ ...brand, footer_attribution_url: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-2">
                Meta Title Suffix
              </label>
              <input
                type="text"
                value={brand.meta_title_suffix}
                onChange={(e) =>
                  setBrand({ ...brand, meta_title_suffix: e.target.value })
                }
                className="mt-1 block w-full rounded-brand border border-border px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </Card>

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-brand bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Brand Config"}
        </button>
      </div>
    </div>
  );
}
