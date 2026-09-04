import { describe, it, expect } from 'vitest';
import { flags, isEnabled } from '../flags';

describe('flags', () => {
  it('should expose equipment flag as enabled', () => {
    expect(flags.equipment.enabled).toBe(true);
  });

  it('should expose scanner flag as enabled', () => {
    expect(flags.scanner.enabled).toBe(true);
  });
});

describe('isEnabled', () => {
  it('should return true for nested enabled flag', () => {
    expect(isEnabled('equipment.enabled')).toBe(true);
  });

  it('should return true for flat enabled path', () => {
    expect(isEnabled('scanner.enabled')).toBe(true);
  });

  it('should return false for unknown flag path', () => {
    expect(isEnabled('nonexistent')).toBe(false);
  });

  it('should return false for deeply unknown path', () => {
    expect(isEnabled('equipment.nonexistent')).toBe(false);
  });

  it('should return false when path resolves to object', () => {
    expect(isEnabled('equipment')).toBe(false);
  });
});
