import { useMemo } from 'react';

export interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  logoUrl?: string;
}

const defaultBrand: BrandTheme = {
  primaryColor: '#7F77DD',
  secondaryColor: '#5A52B5',
  appName: 'MyManager',
};

export function useBrand(): BrandTheme {
  const brand = useMemo(() => {
    // TODO: load brand config from @mymanager/config
    return defaultBrand;
  }, []);

  return brand;
}
