import { describe, expect, it } from 'vitest';

import { InvalidIPAddressError } from './errors';
import { IPv4 } from './ipv4';
import { IPv6 } from './ipv6';

describe('IPv4', () => {
  describe('constructor and validation', () => {
    it('should create an instance for a valid IPv4 address', () => {
      expect(() => new IPv4('192.168.1.1')).not.toThrow();
    });

    it('should throw an error for an invalid IPv4 address', () => {
      expect(() => new IPv4('256.0.0.0')).toThrow(InvalidIPAddressError);
      expect(() => new IPv4('127.0.0.1/24')).toThrow(InvalidIPAddressError);
      expect(() => new IPv4('not an ip')).toThrow(InvalidIPAddressError);
    });
  });

  describe('isValid', () => {
    it('should return true for a valid IPv4 address', () => {
      expect(IPv4.isValid('1.2.3.4')).toBe(true);
    });

    it('should return false for an invalid IPv4 address', () => {
      expect(IPv4.isValid('1.2.3.256')).toBe(false);
    });

    it('should return false for a CIDR string', () => {
      expect(IPv4.isValid('1.2.3.4/24')).toBe(false);
    });
  });

  describe('getters', () => {
    const ip = new IPv4('192.168.1.1');

    it('should return the correct version', () => {
      expect(ip.version).toBe(4);
    });

    it('should return the correct address string', () => {
      expect(ip.address).toBe('192.168.1.1');
    });
  });

  describe('conversion methods', () => {
    const ip = new IPv4('192.168.1.1');

    it('should convert to BigInt', () => {
      expect(ip.toBigInt()).toBe(3232235777n);
    });

    it('should convert to bytes', () => {
      expect(ip.toBytes()).toEqual([192, 168, 1, 1]);
    });

    it('should convert to string', () => {
      expect(ip.toString()).toBe('192.168.1.1');
    });

    it('should convert to JSON', () => {
      expect(ip.toJSON()).toBe('192.168.1.1');
    });

    it('should convert to an IPv4-mapped IPv6 address', () => {
      const ipv4 = new IPv4('192.0.2.128');
      const ipv6 = ipv4.toIPv4Mapped();
      expect(ipv6).toBeInstanceOf(IPv6);
      expect(ipv6.address).toBe('::ffff:192.0.2.128');
      expect(ipv6.isIPv4Mapped()).toBe(true);
    });

    it('should convert to ARPA format', () => {
      const ip = new IPv4('192.168.1.1');
      expect(ip.toArpa()).toBe('1.1.168.192.in-addr.arpa');
    });
  });

  describe('static factories', () => {
    it('should create from BigInt', () => {
      const ip = IPv4.fromBigInt(3232235777n);
      expect(ip.address).toBe('192.168.1.1');
    });

    it('should create from bytes', () => {
      const ip = IPv4.fromBytes([192, 168, 1, 1]);
      expect(ip.address).toBe('192.168.1.1');
    });
  });

  describe('classification methods', () => {
    it('should correctly identify a private address', () => {
      expect(new IPv4('10.0.0.1').isPrivate()).toBe(true);
      expect(new IPv4('172.16.0.1').isPrivate()).toBe(true);
      expect(new IPv4('192.168.1.1').isPrivate()).toBe(true);
      expect(new IPv4('8.8.8.8').isPrivate()).toBe(false);
    });

    it('should correctly identify a loopback address', () => {
      expect(new IPv4('127.0.0.1').isLoopback()).toBe(true);
      expect(new IPv4('127.255.255.254').isLoopback()).toBe(true);
      expect(new IPv4('128.0.0.1').isLoopback()).toBe(false);
    });

    it('should correctly identify a link-local address', () => {
      expect(new IPv4('169.254.0.1').isLinkLocal()).toBe(true);
      expect(new IPv4('169.255.0.1').isLinkLocal()).toBe(false);
    });

    it('should correctly identify a multicast address', () => {
      expect(new IPv4('224.0.0.0').isMulticast()).toBe(true);
      expect(new IPv4('239.255.255.255').isMulticast()).toBe(true);
      expect(new IPv4('240.0.0.0').isMulticast()).toBe(false);
    });

    it('should correctly identify an unspecified address', () => {
      expect(new IPv4('0.0.0.0').isUnspecified()).toBe(true);
      expect(new IPv4('0.0.0.1').isUnspecified()).toBe(false);
    });

    it('should correctly identify a broadcast address', () => {
      expect(new IPv4('255.255.255.255').isBroadcast()).toBe(true);
      expect(new IPv4('192.168.1.255').isBroadcast()).toBe(false);
    });

    it('should correctly identify a reserved address', () => {
      expect(new IPv4('192.0.2.1').isReserved()).toBe(true); // TEST-NET-1
      expect(new IPv4('10.0.0.1').isReserved()).toBe(true); // Private
      expect(new IPv4('169.254.0.1').isReserved()).toBe(true); // Link-local
      expect(new IPv4('127.0.0.1').isReserved()).toBe(true); // Loopback
      expect(new IPv4('240.0.0.1').isReserved()).toBe(true); // Future use
      expect(new IPv4('8.8.8.8').isReserved()).toBe(false);
    });

    it('should correctly identify a global unicast address', () => {
      expect(new IPv4('8.8.8.8').isGlobalUnicast()).toBe(true);
      expect(new IPv4('1.1.1.1').isGlobalUnicast()).toBe(true);
      expect(new IPv4('192.168.1.1').isGlobalUnicast()).toBe(false);
      expect(new IPv4('0.0.0.0').isGlobalUnicast()).toBe(false);
      expect(new IPv4('255.255.255.255').isGlobalUnicast()).toBe(false);
    });
  });

  describe('operational methods', () => {
    const ip = new IPv4('192.168.1.1');

    it('should check for equality', () => {
      expect(ip.equals('192.168.1.1')).toBe(true);
      expect(ip.equals(new IPv4('192.168.1.1'))).toBe(true);
      expect(ip.equals('192.168.1.2')).toBe(false);
    });

    it('should compare addresses correctly', () => {
      const ip1 = new IPv4('10.0.0.1');
      const ip2 = new IPv4('10.0.0.2');
      expect(ip1.compare(ip2)).toBe(-1);
      expect(ip2.compare(ip1)).toBe(1);
      expect(ip1.compare('10.0.0.1')).toBe(0);
    });

    it('should perform bitwise AND', () => {
      const ip1 = new IPv4('255.255.0.0');
      const ip2 = new IPv4('192.168.1.1');
      const result = ip1.and(ip2);
      expect(result.address).toBe('192.168.0.0');
    });

    it('should perform bitwise OR', () => {
      const ip1 = new IPv4('10.0.0.1');
      const ip2 = new IPv4('0.0.255.0');
      const result = ip1.or(ip2);
      expect(result.address).toBe('10.0.255.1');
    });

    it('should perform bitwise NOT', () => {
      const ip = new IPv4('255.255.0.0');
      const result = ip.not();
      expect(result.address).toBe('0.0.255.255');
    });

    it('should return the next IP address', () => {
      expect(ip.next().address).toBe('192.168.1.2');
      expect(ip.next(10n).address).toBe('192.168.1.11');
    });

    it('should handle overflow with next()', () => {
      const maxIp = new IPv4('255.255.255.255');
      // This will wrap around to 0.0.0.0
      expect(maxIp.next().address).toBe('0.0.0.0');
    });

    it('should return the previous IP address', () => {
      expect(ip.previous().address).toBe('192.168.1.0');
      expect(ip.previous(10n).address).toBe('192.168.0.247');
    });

    it('should handle underflow with previous()', () => {
      const minIp = new IPv4('0.0.0.0');
      // This will wrap around to 255.255.255.255
      expect(minIp.previous().address).toBe('255.255.255.255');
    });
  });
});
