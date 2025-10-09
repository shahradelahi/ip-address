import { describe, expect, it } from 'vitest';

import { isValidIP } from '.';

describe('isValidIP', () => {
  it('should return true for valid IP addresses', () => {
    expect(isValidIP('1.2.3.4')).toBe(true);
    expect(isValidIP('2001:db8::1')).toBe(true);
    expect(isValidIP('::ffff:192.168.1.1')).toBe(true);
  });

  it('should return false for invalid IP addresses', () => {
    expect(isValidIP('1.2.3.256')).toBe(false);
    expect(isValidIP('2001:db8::g')).toBe(false);
  });

  it('should return false for CIDR strings', () => {
    expect(isValidIP('1.2.3.4/24')).toBe(false);
    expect(isValidIP('2001:db8::1/64')).toBe(false);
  });

  it('should return false for non-string inputs', () => {
    expect(isValidIP(null)).toBe(false);
    expect(isValidIP(undefined)).toBe(false);
    expect(isValidIP(123)).toBe(false);
    expect(isValidIP({})).toBe(false);
    expect(isValidIP([])).toBe(false);
  });

  it('should return false for empty or random strings', () => {
    expect(isValidIP('')).toBe(false);
    expect(isValidIP('hello world')).toBe(false);
  });
});
