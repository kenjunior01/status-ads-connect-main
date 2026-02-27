import { describe, it, expect } from 'vitest';
import { formatCurrency, getCurrencyByCode, getCountryByCode, getCountriesByRegion } from '@/lib/currencies';

describe('currencies', () => {
  it('formatCurrency formats amounts', () => {
    const s = formatCurrency(1234.5, 'USD', 'en-US');
    expect(s).toMatch(/\$1,234\.50/);
  });

  it('getCurrencyByCode finds currency', () => {
    expect(getCurrencyByCode('BRL')?.symbol).toBe('R$');
  });

  it('getCountryByCode finds country', () => {
    expect(getCountryByCode('BR')?.nameEn).toBeDefined();
  });

  it('getCountriesByRegion filters by region', () => {
    const sa = getCountriesByRegion('south_america');
    expect(sa.length).toBeGreaterThan(0);
  });
});
