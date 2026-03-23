'use client';
import React, { createContext, useContext } from 'react';
import type { BrandConfig } from '@mymanager/config';
import { defaultBrandConfig } from '@mymanager/config';

const BrandContext = createContext<BrandConfig>(defaultBrandConfig);

export function BrandProvider({ brand, children }: { brand: BrandConfig; children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandConfig {
  return useContext(BrandContext);
}
