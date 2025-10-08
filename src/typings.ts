import type { IPv4 } from './ipv4';
import type { IPv6 } from './ipv6';

/**
 * @type IPVersion
 * @description Represents the version of an IP address.
 * - `4` for IPv4
 * - `6` for IPv6
 */
export type IPVersion = 4 | 6;

/**
 * @type IP
 * @description Represents an IP address, which can be either an IPv4 or an IPv6 address.
 */
export type IP = IPv4 | IPv6;
