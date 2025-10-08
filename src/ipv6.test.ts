import { describe, expect, it } from 'vitest';

import { InvalidIPAddressError } from './errors';
import { IPv6 } from './ipv6';

describe('IPv6', () => {
  describe('constructor and validation', () => {
    it('should create an instance for a valid IPv6 address', () => {
      expect(() => new IPv6('2001:db8::1')).not.toThrow();
      expect(() => new IPv6('::1')).not.toThrow();
      expect(() => new IPv6('::ffff:192.168.1.1')).not.toThrow();
    });

    it('should throw an error for an invalid IPv6 address', () => {
      expect(() => new IPv6('2001:db8::g')).toThrow(InvalidIPAddressError);
      expect(() => new IPv6('2001::db8::1')).toThrow(InvalidIPAddressError);
      expect(() => new IPv6('not an ip')).toThrow(InvalidIPAddressError);
    });
  });

  describe('isValid', () => {
    it('should return true for a valid IPv6 address', () => {
      expect(IPv6.isValid('2001:db8::1')).toBe(true);
      expect(IPv6.isValid('::ffff:192.168.1.1')).toBe(true);
    });

    it('should return false for an invalid IPv6 address', () => {
      expect(IPv6.isValid('2001:db8::g')).toBe(false);
      expect(IPv6.isValid('2001:db8::1/64')).toBe(false);
    });
  });

  describe('getters', () => {
    const ip = new IPv6('2001:0db8:0000:0000:0000:8a2e:0370:7334');

    it('should return the correct version', () => {
      expect(ip.version).toBe(6);
    });

    it('should return the correct compressed address string', () => {
      expect(ip.address).toBe('2001:db8::8a2e:370:7334');
    });

    it('should return the correct expanded address string', () => {
      expect(ip.expandedAddress).toBe('2001:0db8:0000:0000:0000:8a2e:0370:7334');
    });
  });

  describe('conversion methods', () => {
    const ip = new IPv6('::ffff:192.168.1.1');

    it('should convert to BigInt', () => {
      expect(ip.toBigInt()).toBe(281473913979137n);
    });

    it('should convert to bytes', () => {
      const expected = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 192, 168, 1, 1];
      expect(ip.toBytes()).toEqual(expected);
    });

    it('should convert to string', () => {
      expect(ip.toString()).toBe('::ffff:192.168.1.1');
    });

    it('should convert to JSON', () => {
      expect(ip.toJSON()).toBe('::ffff:192.168.1.1');
    });

    it('should convert an IPv4-mapped address to an IPv4 instance', () => {
      const ipv4 = ip.toIPv4();
      expect(ipv4).not.toBeNull();
      expect(ipv4?.address).toBe('192.168.1.1');
    });

    it('should return null when converting a non-IPv4-mapped address to IPv4', () => {
      const nonMappedIp = new IPv6('2001:db8::1');
      expect(nonMappedIp.toIPv4()).toBeNull();
    });

    it('should convert to ARPA format', () => {
      const ip = new IPv6('2001:db8::1');
      expect(ip.toArpa()).toBe(
        '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa'
      );
    });
  });

  describe('static factories', () => {
    it('should create from BigInt', () => {
      const ip = IPv6.fromBigInt(1n);
      expect(ip.address).toBe('::1');
    });

    it('should create from bytes', () => {
      const bytes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
      const ip = IPv6.fromBytes(bytes);
      expect(ip.address).toBe('::1');
    });

    it('should throw an error for invalid byte array length', () => {
      const bytes = [0, 0, 0, 1];
      expect(() => IPv6.fromBytes(bytes)).toThrow(InvalidIPAddressError);
    });
  });

  describe('classification methods', () => {
    it('should correctly identify a loopback address', () => {
      expect(new IPv6('::1').isLoopback()).toBe(true);
      expect(new IPv6('::2').isLoopback()).toBe(false);
    });

    it('should correctly identify a link-local address', () => {
      expect(new IPv6('fe80::1').isLinkLocal()).toBe(true);
      expect(new IPv6('fec0::1').isLinkLocal()).toBe(false);
    });

    it('should correctly identify a unique local address', () => {
      expect(new IPv6('fc00::1').isUniqueLocal()).toBe(true);
      expect(new IPv6('fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff').isUniqueLocal()).toBe(true);
      expect(new IPv6('fe00::').isUniqueLocal()).toBe(false);
    });

    it('should correctly identify an unspecified address', () => {
      expect(new IPv6('::').isUnspecified()).toBe(true);
      expect(new IPv6('::1').isUnspecified()).toBe(false);
    });

    it('should correctly identify an IPv4-mapped address', () => {
      expect(new IPv6('::ffff:192.168.1.1').isIPv4Mapped()).toBe(true);
      expect(() => new IPv6('::fffe:1.2.3.4')).toThrow(InvalidIPAddressError);
    });

    it('should correctly identify a reserved address', () => {
      expect(new IPv6('2001:db8::1').isReserved()).toBe(true); // Documentation
      expect(new IPv6('2001:2::1').isReserved()).toBe(true); // Benchmarking
      expect(new IPv6('100::1').isReserved()).toBe(true); // Discard-Only
      expect(new IPv6('2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff').isReserved()).toBe(true); // 6to4
      expect(new IPv6('2001::1').isReserved()).toBe(true); // Teredo
      expect(new IPv6('2620:4f:8000::').isReserved()).toBe(false);
    });

    it('should correctly identify a global unicast address', () => {
      expect(new IPv6('2a03:2880:f12f:83:face:b00c:0:25de').isGlobalUnicast()).toBe(true);
      expect(new IPv6('2001:4860:4860::8888').isGlobalUnicast()).toBe(true);
      expect(new IPv6('::1').isGlobalUnicast()).toBe(false);
      expect(new IPv6('fe80::1').isGlobalUnicast()).toBe(false);
      expect(new IPv6('2001:db8::1').isGlobalUnicast()).toBe(false);
    });
  });

  describe('operational methods', () => {
    const ip = new IPv6('::1');

    it('should check for equality', () => {
      expect(ip.equals('::1')).toBe(true);
      expect(ip.equals(new IPv6('::1'))).toBe(true);
      expect(ip.equals('::2')).toBe(false);
    });

    it('should compare addresses correctly', () => {
      const ip1 = new IPv6('2001:db8::1');
      const ip2 = new IPv6('2001:db8::2');
      expect(ip1.compare(ip2)).toBe(-1);
      expect(ip2.compare(ip1)).toBe(1);
      expect(ip1.compare('2001:db8::1')).toBe(0);
    });

    it('should perform bitwise AND', () => {
      const ip1 = new IPv6('ffff:ffff::');
      const ip2 = new IPv6('::ffff:ffff');
      const result = ip1.and(ip2);
      expect(result.address).toBe('::');
    });

    it('should perform bitwise OR', () => {
      const ip1 = new IPv6('ffff::');
      const ip2 = new IPv6('::ffff');
      const result = ip1.or(ip2);
      expect(result.address).toBe('ffff::ffff');
    });

    it('should perform bitwise NOT', () => {
      const ip = new IPv6('ffff:ffff:ffff:ffff::');
      const result = ip.not();
      expect(result.address).toBe('::ffff:ffff:ffff:ffff');
    });

    it('should return the next IP address', () => {
      expect(ip.next().address).toBe('::2');
      expect(ip.next(10n).address).toBe('::b');
    });

    it('should handle overflow with next()', () => {
      const maxIp = new IPv6('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
      // This will wrap around to ::
      expect(maxIp.next().address).toBe('::');
    });

    it('should return the previous IP address', () => {
      expect(ip.previous().address).toBe('::');
      expect(new IPv6('::a').previous(5n).address).toBe('::5');
    });

    it('should handle underflow with previous()', () => {
      const minIp = new IPv6('::');
      // This will wrap around to ffff...
      expect(minIp.previous().address).toBe('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
    });
  });
});
