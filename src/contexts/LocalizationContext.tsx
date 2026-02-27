import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { Currency, Country, currencies, countries, formatCurrency } from '@/lib/currencies';

interface LocalizationContextType {
  currency: string;
  country: string;
  region: string;
  setCurrency: (code: string) => void;
  setCountry: (code: string) => void;
  setRegion: (code: string) => void;
  format: (amount: number) => string;
  getCurrentCurrency: () => Currency | undefined;
  getCurrentCountry: () => Country | undefined;
  currencies: Currency[];
  countries: Country[];
}

// Default fallback context for SSR/HMR safety
const defaultContext: LocalizationContextType = {
  currency: 'USD',
  country: 'US',
  region: 'north_america',
  setCurrency: () => {},
  setCountry: () => {},
  setRegion: () => {},
  format: (amount: number) => formatCurrency(amount, 'USD', 'en-US'),
  getCurrentCurrency: () => currencies.find(c => c.code === 'USD'),
  getCurrentCountry: () => countries.find(c => c.code === 'US'),
  currencies,
  countries,
};

const LocalizationContext = createContext<LocalizationContextType>(defaultContext);

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const localization = useLocalization();

  const value = useMemo(() => localization, [localization]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalizationContext = () => useContext(LocalizationContext);
