import { describe, it, expect } from 'vitest';
import { getRule, ensurePrefix, isValidForCountry } from '@/lib/phone';

describe('phone utils', () => {
  it('getRule returns defaults for unknown country', () => {
    const rule = getRule('XX');
    expect(rule.prefix).toBe('+');
    expect(rule.min).toBeGreaterThan(0);
  });

  it('ensurePrefix normalizes to country prefix', () => {
    expect(ensurePrefix('123456789', 'BR')).toBe('+55');
    expect(ensurePrefix('+5511999999999', 'BR')).toBe('+5511999999999');
  });

  it('isValidForCountry validates lengths and prefix', () => {
    expect(isValidForCountry('+5511999999999', 'BR')).toBe(true);
    expect(isValidForCountry('11999999999', 'BR')).toBe(false);
    expect(isValidForCountry('+551234', 'BR')).toBe(false);
  });
});
