'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';

export interface SystemCapabilities {
  ai: {
    captionGeneration: boolean;
    captionRewrite: boolean;
    captionTranslate: boolean;
    hashtagSuggest: boolean;
    imageAnalyze: boolean;
    imageGenerate: boolean;
    grammarCheck: boolean;
    videoCaptions: boolean;
  };
  storage: { configured: boolean; reason?: string };
  payments: { configured: boolean; reason?: string };
  email: { configured: boolean; reason?: string };
  metrics: { configured: boolean; reason?: string };
  social: Record<string, { configured: boolean; reason?: string }>;
}

const FALLBACK: SystemCapabilities = {
  ai: {
    captionGeneration: false,
    captionRewrite: false,
    captionTranslate: false,
    hashtagSuggest: false,
    imageAnalyze: false,
    imageGenerate: false,
    grammarCheck: false,
    videoCaptions: false,
  },
  storage: { configured: false, reason: 'unknown' },
  payments: { configured: false, reason: 'unknown' },
  email: { configured: false, reason: 'unknown' },
  metrics: { configured: false, reason: 'unknown' },
  social: {},
};

const CapabilitiesContext = createContext<SystemCapabilities>(FALLBACK);

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const [capabilities, setCapabilities] = useState<SystemCapabilities>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<SystemCapabilities>('/system/capabilities')
      .then((data) => {
        if (!cancelled && data) setCapabilities(data);
      })
      .catch(() => {
        // Silent — defaults stay in place. Never break the UI over a probe failure.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CapabilitiesContext.Provider value={capabilities}>
      {children}
    </CapabilitiesContext.Provider>
  );
}

export function useCapabilities(): SystemCapabilities {
  return useContext(CapabilitiesContext);
}

export function useFeature(path: string): boolean {
  const caps = useCapabilities();
  return path.split('.').reduce<any>((acc, key) => acc?.[key], caps) === true;
}
