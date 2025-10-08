import { BITS, MAX_IP } from './constants';
import { InvalidIPAddressError } from './errors';
import { IPv4 } from './ipv4';
import { IPv6 } from './ipv6';
import type { IP, IPVersion } from './typings';

/**
 * Represents a CIDR block, which includes an IP address and a prefix length.
 *
 * @example
 * const cidr = new CIDR('192.168.1.0/24');
 * console.log(cidr.network.address); // "192.168.1.0"
 * console.log(cidr.broadcast.address); // "192.168.1.255"
 * console.log(cidr.contains('192.168.1.50')); // true
 */
export class CIDR<T extends IP> {
  readonly #address: T;
  readonly #prefix: number;

  /**
   * @param cidr A CIDR string (e.g., "192.168.1.0/24" or "2001:db8::/32").
   * @throws {InvalidIPAddressError} If the CIDR string is invalid.
   */
  constructor(cidr: string) {
    const [addressPart, prefixPart] = cidr.split('/');
    if (!prefixPart) {
      throw new InvalidIPAddressError(`Invalid CIDR notation: ${cidr}`);
    }

    const prefix = parseInt(prefixPart, 10);
    if (isNaN(prefix)) {
      throw new InvalidIPAddressError(`Invalid prefix: ${prefixPart}`);
    }

    let address: IP;
    let version: IPVersion;

    if (addressPart.includes('.')) {
      address = new IPv4(addressPart);
      version = 4;
    } else {
      address = new IPv6(addressPart);
      version = 6;
    }

    if (prefix < 0 || prefix > BITS[version]) {
      throw new InvalidIPAddressError(`Prefix out of range for IPv${version}: ${prefix}`);
    }

    this.#address = address as T;
    this.#prefix = prefix;
  }

  /**
   * The IP address portion of the CIDR.
   * @returns {T}
   */
  get address(): T {
    return this.#address;
  }

  /**
   * The prefix length of the CIDR.
   * @returns {number}
   */
  get prefix(): number {
    return this.#prefix;
  }

  /**
   * The IP version.
   * @returns {IPVersion}
   */
  get version(): IPVersion {
    return this.#address.version;
  }

  /**
   * The netmask for the CIDR block.
   * @returns {T}
   */
  get netmask(): T {
    const version = this.version;
    const mask = (MAX_IP[version] << (BITS[version] - BigInt(this.prefix))) & MAX_IP[version];
    if (version === 4) {
      return IPv4.fromBigInt(mask) as T;
    }
    return IPv6.fromBigInt(mask) as T;
  }

  /**
   * The network address of the CIDR block.
   * @returns {T}
   */
  get network(): T {
    const networkAddress = this.#address.toBigInt() & this.netmask.toBigInt();
    if (this.version === 4) {
      return IPv4.fromBigInt(networkAddress) as T;
    }
    return IPv6.fromBigInt(networkAddress) as T;
  }

  /**
   * The broadcast address for the CIDR block.
   * @returns {T}
   */
  get broadcast(): T {
    const networkAddress = this.network.toBigInt();
    const hostmask = MAX_IP[this.version] >> BigInt(this.prefix);
    const broadcastAddress = networkAddress | hostmask;
    if (this.version === 4) {
      return IPv4.fromBigInt(broadcastAddress) as T;
    }
    return IPv6.fromBigInt(broadcastAddress) as T;
  }

  /**
   * The first usable IP address in the CIDR block.
   * For IPv4 /31 and /32, this is the network address.
   * For IPv6, this is the network address (Subnet-Router anycast).
   * @returns {T}
   */
  get first(): T {
    if (this.version === 4) {
      if (this.prefix >= 31) {
        return this.network;
      }
      return this.network.next() as T;
    }
    return this.network;
  }

  /**
   * The last usable IP address in the CIDR block.
   * For IPv4 /31 and /32, this is the broadcast address.
   * For IPv6, this is the highest address in the range.
   * @returns {T}
   */
  get last(): T {
    if (this.version === 4) {
      if (this.prefix >= 31) {
        return this.broadcast;
      }
      return this.broadcast.previous() as T;
    }
    return this.broadcast;
  }

  /**
   * Checks if a given IP address is contained within this CIDR block.
   * @param ip The IP address to check.
   * @returns {boolean}
   */
  contains(ip: T | string): boolean {
    const ipAddress =
      typeof ip === 'string' ? (this.version === 4 ? new IPv4(ip) : new IPv6(ip)) : ip;
    if (ipAddress.version !== this.version) {
      return false;
    }
    const networkAddress = this.network.toBigInt();
    const broadcastAddress = this.broadcast.toBigInt();
    const targetAddress = ipAddress.toBigInt();

    return targetAddress >= networkAddress && targetAddress <= broadcastAddress;
  }

  /**
   * Returns the string representation of the CIDR.
   * @returns {string}
   */
  toString(): string {
    return `${this.address.address}/${this.prefix}`;
  }

  /**
   * Returns the string representation for JSON serialization.
   * @returns {string}
   */
  toJSON(): string {
    return this.toString();
  }
}
