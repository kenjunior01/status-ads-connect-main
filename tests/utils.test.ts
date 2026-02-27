import { describe, it, expect } from 'vitest';
import { computePlatformFee, getSuggestedPriceRange, getAdjustedPriceRange } from '@/lib/utils';

describe('utils', () => {
  it('computePlatformFee calculates percentage', () => {
    expect(computePlatformFee(100, 10)).toBe(10);
    expect(computePlatformFee(250, 18)).toBe(45);
  });

  it('getSuggestedPriceRange escalates with avgViews', () => {
    expect(getSuggestedPriceRange(40)).toEqual({ min: 0, max: 0 });
    expect(getSuggestedPriceRange(200).max).toBeGreaterThan(0);
    expect(getSuggestedPriceRange(4000).min).toBeGreaterThan(getSuggestedPriceRange(500).min);
  });

  it('getAdjustedPriceRange applies multipliers and discounts', () => {
    const base = getSuggestedPriceRange(1000);
    const adjusted = getAdjustedPriceRange(1000, { nicheMultiplier: 1.2, trustScore: 90, interactiveExtra: 5, packageCount: 5 });
    expect(adjusted.min).toBeGreaterThanOrEqual(base.min);
    expect(adjusted.max).toBeGreaterThanOrEqual(base.max);
    expect(adjusted.recommended).toBeGreaterThan(0);
  });
});
