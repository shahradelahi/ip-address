import { CIDR } from './cidr';
import { InvalidIPAddressError } from './errors';
import { IPv4 } from './ipv4';
import { IPv6 } from './ipv6';
import type { IP } from './typings';

export { CIDR } from './cidr';
export { IPv4 } from './ipv4';
export { IPv6 } from './ipv6';
export * from './utils';
export * from './errors';

export type * from './typings';

/**
 * A factory function that parses an IP address string and returns
 * an instance of the appropriate class (IPv4 or IPv6).
 *
 * @param address The IP address string.
 * @returns An instance of IPv4 or IPv6.
 * @throws {InvalidIPAddressError} if the address is not a valid v4 or v6 address.
 */
export function parseIP(address: string): IP {
  if (address.includes('.')) {
    return new IPv4(address);
  }
  if (address.includes(':')) {
    return new IPv6(address);
  }
  throw new InvalidIPAddressError(`Invalid IP address: ${address}`);
}

/**
 * A factory function that parses a CIDR string and returns
 * an instance of the CIDR class.
 *
 * @param cidr The CIDR string.
 * @returns An instance of CIDR.
 * @throws {InvalidIPAddressError} if the cidr is not a valid v4 or v6 cidr.
 */
export function parseCIDR(cidr: string): CIDR<IP> {
  return new CIDR(cidr);
}
