import { describe, expect, it } from 'vitest';

import { CIDR } from './cidr';
import { InvalidIPAddressError } from './errors';
import { IPv4 } from './ipv4';
import { IPv6 } from './ipv6';

describe('CIDR', () => {
  describe('IPv4', () => {
    const cidr = new CIDR('192.168.1.100/24');

    it('should parse correctly', () => {
      expect(cidr.address).toBeInstanceOf(IPv4);
      expect(cidr.address.address).toBe('192.168.1.100');
      expect(cidr.prefix).toBe(24);
      expect(cidr.version).toBe(4);
    });

    it('should calculate netmask', () => {
      expect(cidr.netmask.address).toBe('255.255.255.0');
    });

    it('should calculate network address', () => {
      expect(cidr.network.address).toBe('192.168.1.0');
    });

    it('should calculate broadcast address', () => {
      expect(cidr.broadcast.address).toBe('192.168.1.255');
    });

    it('should get the first usable address', () => {
      expect(cidr.first.address).toBe('192.168.1.1');
    });

    it('should get the last usable address', () => {
      expect(cidr.last.address).toBe('192.168.1.254');
    });

    it('should handle /31 and /32 subnets for first/last', () => {
      const cidr31 = new CIDR('192.168.1.0/31');
      expect(cidr31.first.address).toBe('192.168.1.0');
      expect(cidr31.last.address).toBe('192.168.1.1');

      const cidr32 = new CIDR('192.168.1.0/32');
      expect(cidr32.first.address).toBe('192.168.1.0');
      expect(cidr32.last.address).toBe('192.168.1.0');
    });

    it('should check if it contains an IP', () => {
      expect(cidr.contains('192.168.1.50')).toBe(true);
      expect(cidr.contains(new IPv4('192.168.1.255'))).toBe(true);
      expect(cidr.contains('192.168.2.1')).toBe(false);
      expect(cidr.contains(new IPv6('::1'))).toBe(false);
    });

    it('should convert to string', () => {
      expect(cidr.toString()).toBe('192.168.1.100/24');
      expect(cidr.toJSON()).toBe('192.168.1.100/24');
    });

    it('should throw on invalid CIDR', () => {
      expect(() => new CIDR('192.168.1.1/33')).toThrow(InvalidIPAddressError);
      expect(() => new CIDR('192.168.1.1/foo')).toThrow(InvalidIPAddressError);
      expect(() => new CIDR('256.0.0.0/24')).toThrow(InvalidIPAddressError);
    });
  });

  describe('IPv6', () => {
    const cidr = new CIDR('2001:db8::1/64');

    it('should parse correctly', () => {
      expect(cidr.address).toBeInstanceOf(IPv6);
      expect(cidr.address.address).toBe('2001:db8::1');
      expect(cidr.prefix).toBe(64);
      expect(cidr.version).toBe(6);
    });

    it('should calculate netmask', () => {
      expect(cidr.netmask.address).toBe('ffff:ffff:ffff:ffff::');
    });

    it('should calculate network address', () => {
      expect(cidr.network.address).toBe('2001:db8::');
    });

    it('should calculate broadcast address', () => {
      expect(cidr.broadcast.address).toBe('2001:db8::ffff:ffff:ffff:ffff');
    });

    it('should get the first usable address', () => {
      expect(cidr.first.address).toBe('2001:db8::');
    });

    it('should get the last usable address', () => {
      expect(cidr.last.address).toBe('2001:db8::ffff:ffff:ffff:ffff');
    });

    it('should check if it contains an IP', () => {
      expect(cidr.contains('2001:db8::dead:beef')).toBe(true);
      expect(cidr.contains(new IPv6('2001:db8::'))).toBe(true);
      expect(cidr.contains('2001:db9::1')).toBe(false);
      expect(cidr.contains(new IPv4('1.2.3.4'))).toBe(false);
    });

    it('should convert to string', () => {
      expect(cidr.toString()).toBe('2001:db8::1/64');
      expect(cidr.toJSON()).toBe('2001:db8::1/64');
    });

    it('should throw on invalid CIDR', () => {
      expect(() => new CIDR('2001:db8::1/129')).toThrow(InvalidIPAddressError);
      expect(() => new CIDR('2001:db8::1/foo')).toThrow(InvalidIPAddressError);
      expect(() => new CIDR('2001::g/64')).toThrow(InvalidIPAddressError);
    });
  });

  describe('from single IP', () => {
    it('should handle a single IPv4 address as a /32', () => {
      const cidr = new CIDR('192.168.1.1');
      expect(cidr.prefix).toBe(32);
      expect(cidr.address.address).toBe('192.168.1.1');
      expect(cidr.toString()).toBe('192.168.1.1/32');
    });

    it('should handle a single IPv6 address as a /128', () => {
      const cidr = new CIDR('2001:db8::1');
      expect(cidr.prefix).toBe(128);
      expect(cidr.address.address).toBe('2001:db8::1');
      expect(cidr.toString()).toBe('2001:db8::1/128');
    });
  });
});
