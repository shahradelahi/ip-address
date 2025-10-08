import { InvalidIPAddressError } from './errors';
import type { IPVersion } from './typings';

/**
 * Quickly determines the IP version from a string.
 * @param probablyIp The IP address string.
 * @returns The IP version (4 or 6).
 * @throws {InvalidIPAddressError} If the string is not recognizable as an IP address.
 */
export function fastIpVersion(probablyIp: string): IPVersion {
  if (probablyIp.includes('.')) {
    return 4;
  }
  if (probablyIp.includes(':')) {
    return 6;
  }
  throw new InvalidIPAddressError(`Invalid IP address: ${probablyIp}`);
}

/**
 * Converts an IPv4 address string to a BigInt.
 * @param ip The IPv4 address string.
 * @returns The BigInt representation.
 * @internal
 */
function ipv4ToBigInt(ip: string): bigint {
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part) || Number(part) > 255)) {
    throw new InvalidIPAddressError(`Invalid IPv4 address: ${ip}`);
  }
  return parts.reduce((acc, octet) => (acc << 8n) | BigInt(parseInt(octet, 10)), 0n);
}

/**
 * Expands the `::` shorthand in an IPv6 address.
 * @param parts An array of IPv6 address segments.
 * @returns The expanded array of segments.
 * @internal
 */
function expandIPv6Shorthand(parts: string[]): string[] {
  const index = parts.indexOf('');
  if (index !== -1) {
    const missingParts = 8 - parts.length + 1;
    parts.splice(index, 1, ...Array(missingParts).fill(''));
  }
  return parts;
}

/**
 * Converts an IPv6 address string to a BigInt.
 * @param ip The IPv6 address string.
 * @returns The BigInt representation.
 * @internal
 */
function ipv6ToBigInt(ip: string): bigint {
  if (ip.includes('%')) {
    ip = /(.+)%(.+)/.exec(ip)![1];
  }

  const ipv4MappedMatch = /^(::ffff:)(?:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))$/.exec(ip);
  if (ipv4MappedMatch) {
    const ipv4Part = ipv4MappedMatch[2];
    const ipv4BigInt = ipv4ToBigInt(ipv4Part);
    return (0x00000000000000000000ffffn << 32n) | ipv4BigInt;
  }

  let parts = ip.split(':');
  parts = expandIPv6Shorthand(parts);

  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-fA-F]*$/.test(part) || part.length > 4)) {
    throw new InvalidIPAddressError(`Invalid IPv6 address: ${ip}`);
  }

  let number = 0n;
  let exp = 0n;

  const r = parts.map((part) => (part === '' ? 0n : BigInt(Number.parseInt(part, 16)))).reverse();
  for (const n of r) {
    number += n * 2n ** exp;
    exp += 16n;
  }

  return number;
}

/**
 * Converts an IP address string to its BigInt representation.
 *
 * @param ip The IP address string to convert.
 * @param version The IP version (4 or 6). If not provided, it will be detected automatically.
 * @returns The BigInt representation of the IP address.
 * @throws {InvalidIPAddressError} If the IP address is invalid.
 */
export function ipToBigInt(ip: string, version?: IPVersion): bigint {
  const $version = version ?? fastIpVersion(ip);

  if ($version === 4) {
    return ipv4ToBigInt(ip);
  }

  return ipv6ToBigInt(ip);
}

/**
 * Converts a BigInt to its IP address string representation.
 *
 * @param number The BigInt to convert.
 * @param version The IP version (4 or 6).
 * @param compress Whether to compress the IPv6 address (e.g., remove leading zeros and use `::`).
 * @returns The IP address string.
 */
export function bigIntToIp(number: bigint, version: IPVersion, compress = true): string {
  if (version === 4) {
    return `${(number >> 24n) & 0xffn}.${(number >> 16n) & 0xffn}.${(number >> 8n) & 0xffn}.${number & 0xffn}`;
  }

  // Check for IPv4-mapped address (::ffff:a.b.c.d)
  if (number >> 32n === 0xffffn) {
    const ipv4Part = number & 0xffffffffn;
    const ipv4String = bigIntToIp(ipv4Part, 4);
    return `::ffff:${ipv4String}`;
  }

  const parts = [];
  for (let i = 0; i < 8; i++) {
    parts.push((number >> BigInt(112 - i * 16)) & 0xffffn);
  }

  const to16 = parts.map((n) => n.toString(16));

  if (compress) {
    return compressIPv6(to16);
  }
  return to16.map((part) => part.padStart(4, '0')).join(':');
}

/**
 * Compresses an IPv6 address by replacing the longest sequence of "0" segments with "::".
 *
 * @param parts An array of hexadecimal strings representing the segments of an IPv6 address.
 * @returns The compressed IPv6 address string.
 * @internal
 */
function compressIPv6(parts: string[]): string {
  let longest: Set<number> | null = null;
  let current: Set<number> | null = null;
  for (let i = 0, len = parts.length; i < len; i++) {
    const part = parts[i];
    if (part === '0') {
      current ??= new Set();
      current.add(i);
    } else if (current) {
      if (!longest || current.size > longest.size) {
        longest = current;
      }
      current = null;
    }
  }
  if ((!longest && current) || (current && longest && current.size > longest.size)) {
    longest = current;
  }

  for (const index of longest || []) {
    parts[index] = ':';
  }

  return parts.filter(Boolean).join(':').replace(/:{2,}/, '::');
}
