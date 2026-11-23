import { IPV4_ADDRESS_REGEX, IPV6_VALIDATION_REGEX } from './constants';
import { InvalidIPAddressError } from './errors';
import type { IPVersion } from './typings';

/**
 * Quickly determines the IP version from a string.
 * @param probablyIp The IP address string.
 * @returns The IP version (4 or 6).
 * @throws {InvalidIPAddressError} If the string is not recognizable as an IP address.
 */
export function fastIpVersion(probablyIp: string): IPVersion {
  if (probablyIp.includes(':')) {
    return 6;
  }
  if (probablyIp.includes('.')) {
    return 4;
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
  if (!IPV4_ADDRESS_REGEX.test(ip)) {
    throw new InvalidIPAddressError(`Invalid IPv4 address: ${ip}`);
  }
  const parts = ip.split('.');
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
  const percentIndex = ip.indexOf('%');
  if (percentIndex !== -1) {
    if (percentIndex === 0 || percentIndex === ip.length - 1) {
      throw new InvalidIPAddressError(`Invalid IPv6 address: ${ip}`);
    }
    ip = ip.slice(0, percentIndex);
  }

  if (!IPV6_VALIDATION_REGEX.test(ip)) {
    throw new InvalidIPAddressError(`Invalid IPv6 address: ${ip}`);
  }

  if (ip.includes('.')) {
    const lastColon = ip.lastIndexOf(':');
    const prefix = ip.slice(0, lastColon + 1);
    const ipv4BigInt = ipv4ToBigInt(ip.slice(lastColon + 1));
    const high = ((ipv4BigInt >> 16n) & 0xffffn).toString(16);
    const low = (ipv4BigInt & 0xffffn).toString(16);
    ip = `${prefix}${high}:${low}`;
  }

  const parts = expandIPv6Shorthand(ip.split(':'));

  let number = 0n;
  for (const part of parts) {
    number = (number << 16n) | (part === '' ? 0n : BigInt(Number.parseInt(part, 16)));
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
  if (compress && number >> 32n === 0xffffn) {
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
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '0') {
      if (curStart === -1) {
        curStart = i;
        curLen = 1;
      } else {
        curLen++;
      }
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  if (bestLen < 2) {
    return parts.join(':');
  }

  const before = parts.slice(0, bestStart).join(':');
  const after = parts.slice(bestStart + bestLen).join(':');
  return `${before}::${after}`;
}
