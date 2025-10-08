import type { IPVersion } from './typings';

export const BITS: Record<IPVersion, bigint> = {
  4: 32n,
  6: 128n,
};

export const MAX_IP: Record<IPVersion, bigint> = {
  4: 0xffffffffn, // (2n ** 32n) - 1n
  6: 0xffffffffffffffffffffffffffffffffn, // (2n ** 128n) - 1n
};

const IPV6_SEGMENT = '[0-9A-Fa-f]{1,4}';
const IPV4_PART = '(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])';
const IPV4_ADDRESS_PATTERN = `${IPV4_PART}\\.${IPV4_PART}\\.${IPV4_PART}\\.${IPV4_PART}`;
export const IPV4_ADDRESS_REGEX = new RegExp(`^${IPV4_ADDRESS_PATTERN}$`);

// Regular expression for matching IPv6 addresses.
// https://www.rfc-editor.org/rfc/rfc5952.html
const IPV6_STANDARD = `(?:${IPV6_SEGMENT}:){7}${IPV6_SEGMENT}`;
const IPV6_COMPRESSED_1 = `(?:${IPV6_SEGMENT}:){1,7}:`;
const IPV6_COMPRESSED_2 = `:(?::${IPV6_SEGMENT}){1,7}`;
const IPV6_COMPRESSED_3 = `(?:${IPV6_SEGMENT}:){1,6}:${IPV6_SEGMENT}`;
const IPV6_COMPRESSED_4 = `(?:${IPV6_SEGMENT}:){1,5}(?::${IPV6_SEGMENT}){1,2}`;
const IPV6_COMPRESSED_5 = `(?:${IPV6_SEGMENT}:){1,4}(?::${IPV6_SEGMENT}){1,3}`;
const IPV6_COMPRESSED_6 = `(?:${IPV6_SEGMENT}:){1,3}(?::${IPV6_SEGMENT}){1,4}`;
const IPV6_COMPRESSED_7 = `(?:${IPV6_SEGMENT}:){1,2}(?::${IPV6_SEGMENT}){1,5}`;
const IPV6_COMPRESSED_8 = `${IPV6_SEGMENT}:(?::${IPV6_SEGMENT}){1,6}`;
const IPV6_COMPRESSED_9 = `::(?:${IPV6_SEGMENT}:){0,5}${IPV6_SEGMENT}`;
const IPV6_COMPRESSED_10 = '::';
const IPV6_IPV4_MAPPED = `(?:(?:${IPV6_SEGMENT}:){6}|::(?:${IPV6_SEGMENT}:){0,5}|(?:${IPV6_SEGMENT}:){0,5}::(?:${IPV6_SEGMENT}:){0,5})${IPV4_ADDRESS_PATTERN}`;

const IPV6_COMBINED = [
  IPV6_STANDARD,
  IPV6_COMPRESSED_1,
  IPV6_COMPRESSED_2,
  IPV6_COMPRESSED_3,
  IPV6_COMPRESSED_4,
  IPV6_COMPRESSED_5,
  IPV6_COMPRESSED_6,
  IPV6_COMPRESSED_7,
  IPV6_COMPRESSED_8,
  IPV6_COMPRESSED_9,
  IPV6_COMPRESSED_10,
  IPV6_IPV4_MAPPED,
]
  .map((s) => `(?:${s})`)
  .join('|');

export const IPV6_VALIDATION_REGEX = new RegExp(`^(?:${IPV6_COMBINED})$`);
