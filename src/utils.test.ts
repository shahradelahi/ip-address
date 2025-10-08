import { describe, expect, it } from 'vitest';

import { bigIntToIp, ipToBigInt } from './utils';

describe('ipToBigInt and bigIntToIp', () => {
  it('should correctly convert IPv4 addresses', () => {
    const ip = '192.168.1.1';
    const bigInt = 3232235777n;
    expect(ipToBigInt(ip)).toBe(bigInt);
    expect(bigIntToIp(bigInt, 4)).toBe(ip);
  });

  it('should correctly convert IPv6 addresses', () => {
    const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const bigInt = 42540766452641154071740215577757643572n;
    expect(ipToBigInt(ip)).toBe(bigInt);
    expect(bigIntToIp(bigInt, 6, false)).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
  });

  it('should handle IPv6 compression', () => {
    const ip = '2001:db8::1';
    const bigInt = 42540766411282592856903984951653826561n;
    expect(ipToBigInt(ip)).toBe(bigInt);
    expect(bigIntToIp(bigInt, 6, true)).toBe(ip);
  });

  it('should handle the 0.0.0.0 address', () => {
    const ip = '0.0.0.0';
    const bigInt = 0n;
    expect(ipToBigInt(ip)).toBe(bigInt);
    expect(bigIntToIp(bigInt, 4)).toBe(ip);
  });

  it('should handle the :: address', () => {
    const ip = '::';
    const bigInt = 0n;
    expect(ipToBigInt(ip)).toBe(bigInt);
    expect(bigIntToIp(bigInt, 6)).toBe(ip);
  });
});
