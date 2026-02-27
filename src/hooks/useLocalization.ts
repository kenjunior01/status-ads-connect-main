import { useState, useEffect, useCallback } from 'react';
import { currencies, countries, formatCurrency, Currency, Country } from '@/lib/currencies';
import i18n from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

interface LocalizationState {
  currency: string;
  country: string;
  region: string;
}

const STORAGE_KEY = 'statusads_localization';
const FX_STORAGE_KEY = 'statusads_fx';

const defaultState: LocalizationState = {
  currency: 'USD',
  country: 'US',
  region: 'north_america',
};

const countryToLanguage: Record<string, string> = {
  'BR': 'pt-BR',
  'PT': 'pt-BR',
  'MZ': 'pt-BR',
  'AO': 'pt-BR',
  'US': 'en-US',
  'GB': 'en-US',
  'CA': 'en-US',
  'ES': 'es-ES',
  'AR': 'es-ES',
  'MX': 'es-ES',
  'CO': 'es-ES',
  'PE': 'es-ES',
  'CL': 'es-ES',
  'IN': 'en-US',
  'ID': 'en-US',
  'PH': 'en-US',
  'VN': 'en-US',
  'JP': 'en-US',
  'KR': 'en-US',
  'CN': 'en-US',
  'AU': 'en-US',
  'PK': 'en-US',
  'BD': 'en-US',
  'RU': 'en-US',
  'NG': 'en-US',
  'ZA': 'en-US',
  'EG': 'en-US',
  'TL': 'en-US',
  'FR': 'fr-FR',
};

export const useLocalization = () => {
  const [state, setState] = useState<LocalizationState>(() => {
    if (typeof window === 'undefined') return defaultState;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  const [fx, setFx] = useState<{ base: string; rates: Record<string, number>; updatedAt: number }>(() => {
    if (typeof window === 'undefined') return { base: 'USD', rates: {}, updatedAt: 0 };
    const stored = localStorage.getItem(FX_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { base: 'USD', rates: {}, updatedAt: 0 };
      }
    }
    return { base: 'USD', rates: {}, updatedAt: 0 };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Also update i18n language when country changes
    const language = countryToLanguage[state.country] || 'pt-BR';
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [state]);

  useEffect(() => {
    const needRefresh = Date.now() - fx.updatedAt > 12 * 60 * 60 * 1000;
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.exchangerate.host/latest?base=USD');
        const data = await res.json();
        if (data && data.rates) {
          const payload = { base: 'USD', rates: data.rates as Record<string, number>, updatedAt: Date.now() };
          setFx(payload);
          localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(payload));
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (needRefresh || Object.keys(fx.rates).length === 0) {
      fetchRates();
    }
  }, []);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Only detect if not already set manually or if first time
        const stored = localStorage.getItem(STORAGE_KEY);
        
        let detectedCountryCode = null;
        let detectedCoords = null;

        // Try IP-based detection first
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code) {
          detectedCountryCode = data.country_code;
          const country = countries.find(c => c.code === data.country_code);
          if (country && !stored) {
            setState({
              country: country.code,
              region: country.region,
              currency: country.currency,
            });
            
            // Sync language
            const language = countryToLanguage[country.code] || 'pt-BR';
            i18n.changeLanguage(language);
          }
        }

        // Fallback to browser geolocation for precise region
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            detectedCoords = { latitude, longitude };
            
            // Store coordinates for potential use in analytics/regional context
            localStorage.setItem('statusads_coords', JSON.stringify({ lat: latitude, lon: longitude }));
            
            // If user is authenticated, save location to profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from('profiles')
                .update({ 
                  latitude, 
                  longitude, 
                  country_code: detectedCountryCode 
                })
                .eq('user_id', user.id);
            }
          });
        } else if (detectedCountryCode) {
          // If no geolocation but we have country code, still try to save if authenticated
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ country_code: detectedCountryCode })
              .eq('user_id', user.id);
          }
        }
      } catch (error) {
        console.error("Error detecting location:", error);
      }
    };

    detectLocation();
  }, []);

  const setCurrency = useCallback((currencyCode: string) => {
    setState(prev => ({ ...prev, currency: currencyCode }));
  }, []);

  const setCountry = useCallback((countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setState(prev => ({
        ...prev,
        country: countryCode,
        region: country.region,
        currency: country.currency,
      }));
    }
  }, []);

  const setRegion = useCallback((regionCode: string) => {
    setState(prev => ({ ...prev, region: regionCode }));
  }, []);

  const convert = useCallback((amount: number, fromCode: string, toCode: string): number => {
    const base = fx.base || 'USD';
    const fromRate = fromCode === base ? 1 : fx.rates[fromCode] || 1;
    const toRate = toCode === base ? 1 : fx.rates[toCode] || 1;
    if (!fromRate || !toRate) return amount;
    return amount * (toRate / fromRate);
  }, [fx]);

  const format = useCallback((amount: number): string => {
    const currency = currencies.find(c => c.code === state.currency);
    const converted = convert(amount, fx.base || 'USD', state.currency);
    return formatCurrency(converted, state.currency, currency?.locale || 'en-US');
  }, [state.currency, convert, fx.base]);

  const getCurrentCurrency = useCallback((): Currency | undefined => {
    return currencies.find(c => c.code === state.currency);
  }, [state.currency]);

  const getCurrentCountry = useCallback((): Country | undefined => {
    return countries.find(c => c.code === state.country);
  }, [state.country]);

  return {
    currency: state.currency,
    country: state.country,
    region: state.region,
    setCurrency,
    setCountry,
    setRegion,
    format,
    convert,
    getCurrentCurrency,
    getCurrentCountry,
    currencies,
    countries,
  };
};
