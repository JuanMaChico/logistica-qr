import { describe, it, expect } from 'vitest';
import { isEnabled } from '../flags';

describe('flags', () => {
  it('isEnabled returns true for enabled flags', () => {
    expect(isEnabled('orders.enabled')).toBe(true);
  });

  it('isEnabled returns false for disabled flags', () => {
    expect(isEnabled('products.enabled')).toBe(false);
  });

  it('isEnabled returns false for unknown flags', () => {
    expect(isEnabled('unknown.feature')).toBe(false);
  });
});
