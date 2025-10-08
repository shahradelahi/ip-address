import { IPV6_VALIDATION_REGEX, MAX_IP } from './constants';
import { InvalidIPAddressError } from './errors';
import { IPv4 } from './ipv4';
import { bigIntToIp, ipToBigInt } from './utils';

/**
 * Represents a single IPv6 address, providing methods for validation,
 * classification, and manipulation.
 *
 * @example
 * const ip = new IPv6('2001:db8::1');
 * console.log(ip.address); // "2001:db8::1"
 * console.log(ip.isLinkLocal()); // false
 */
export class IPv6 {
  readonly #address: bigint;

  /**
   * @param address An IPv6 address string (e.g., "2001:db8::1").
   * @throws {InvalidIPAddressError} If the address is not a valid IPv6 address.
   */
  constructor(address: string) {
    if (!IPv6.isValid(address)) {
      throw new InvalidIPAddressError(`Invalid IPv6 address: ${address}`);
    }
    this.#address = ipToBigInt(address, 6);
  }

  // --- Static Methods ---
  /**
   * Creates an IPv6 instance from a BigInt.
   * @param value The BigInt representation of an IPv6 address.
   * @returns A new IPv6 instance.
   *
   * @example
   * const ip = IPv6.fromBigInt(1n);
   * console.log(ip.address); // "::1"
   */
  static fromBigInt(value: bigint): IPv6 {
    const ip = bigIntToIp(value, 6);
    return new IPv6(ip);
  }

  /**
   * Creates an IPv6 instance from an array of 16 bytes.
   * @param bytes An array of 16 numbers (0-255).
   * @returns A new IPv6 instance.
   * @throws {InvalidIPAddressError} If the byte array is not 16 bytes long.
   *
   * @example
   * const bytes = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1];
   * const ip = IPv6.fromBytes(bytes);
   * console.log(ip.address); // "::1"
   */
  static fromBytes(bytes: number[]): IPv6 {
    if (bytes.length !== 16) {
      throw new InvalidIPAddressError('IPv6 addresses must be 16 bytes long');
    }
    const value = bytes.reduce((acc, octet) => (acc << 8n) | BigInt(octet), 0n);
    return IPv6.fromBigInt(value);
  }

  /**
   * Checks if a string is a valid IPv6 address.
   * @param address The string to validate.
   * @returns True if the string is a valid IPv6 address.
   *
   * @example
   * IPv6.isValid('2001:db8::1'); // true
   * IPv6.isValid('2001:db8::g'); // false
   */
  static isValid(address: string): boolean {
    if (address.includes('/')) {
      return false;
    }
    return IPV6_VALIDATION_REGEX.test(address);
  }

  // --- Getters ---
  /**
   * The IP version number.
   * @returns {6}
   */
  get version(): 6 {
    return 6;
  }
  /**
   * The compressed, canonical IPv6 address string.
   * @returns {string}
   */
  get address(): string {
    return bigIntToIp(this.#address, 6, true);
  }
  /**
   * The fully expanded IPv6 address string.
   * @returns {string}
   */
  get expandedAddress(): string {
    return bigIntToIp(this.#address, 6, false);
  }

  // --- Conversion Methods ---
  /**
   * Converts the IP address to its BigInt representation.
   * @returns {bigint}
   */
  toBigInt(): bigint {
    return this.#address;
  }
  /**
   * Converts the IP address to an array of 16 bytes.
   * @returns {number[]}
   */
  toBytes(): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < 16; i++) {
      bytes.push(Number((this.#address >> BigInt(120 - i * 8)) & 0xffn));
    }
    return bytes;
  }
  /**
   * Returns the string representation of the IP address.
   * @returns {string}
   */
  toString(): string {
    return this.address;
  }
  /**
   * Returns the string representation for JSON serialization.
   * @returns {string}
   */
  toJSON(): string {
    return this.address;
  }
  /**
   * Converts an IPv4-mapped address to an IPv4 instance, otherwise returns null.
   * @returns {IPv4 | null}
   */
  toIPv4(): IPv4 | null {
    if (!this.isIPv4Mapped()) {
      return null;
    }
    const ipv4Address = this.#address & 0xffffffffn;
    return IPv4.fromBigInt(ipv4Address);
  }

  /**
   * Returns the reverse DNS (ARPA) name for the IP address.
   * @returns {string}
   *
   * @example
   * const ip = new IPv6('2001:db8::1');
   * console.log(ip.toArpa()); // "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa"
   */
  toArpa(): string {
    const hex = this.expandedAddress.replace(/:/g, '');
    return `${hex.split('').reverse().join('.')}.ip6.arpa`;
  }

  // --- Classification Methods ---
  /**
   * Checks if the address is the unspecified address (::).
   * @returns {boolean}
   */
  isUnspecified(): boolean {
    return this.#address === 0n;
  }
  /**
   * Checks if the address is the loopback address (::1).
   * @returns {boolean}
   */
  isLoopback(): boolean {
    return this.#address === 1n;
  }
  /**
   * Checks if the address is a multicast address (ff00::/8).
   * @returns {boolean}
   */
  isMulticast(): boolean {
    // ff00::/8
    return this.#address >> 120n === 0xffn;
  }
  /**
   * Checks if the address is a link-local address (fe80::/10).
   * @returns {boolean}
   */
  isLinkLocal(): boolean {
    // fe80::/10
    return this.#address >> 118n === 0x3fan;
  }
  /**
   * Checks if the address is a unique local address (fc00::/7).
   * @returns {boolean}
   */
  isUniqueLocal(): boolean {
    // fc00::/7
    return this.#address >> 121n === 0x7en;
  }
  /**
   * Checks if the address is an IPv4-mapped address (::ffff:0:0/96).
   * @returns {boolean}
   */
  isIPv4Mapped(): boolean {
    // ::ffff:0:0/96
    return this.#address >> 32n === 0xffffn;
  }

  /**
   * Checks if the address is reserved by IANA. This includes ranges for
   * documentation, benchmarking, and other special purposes.
   * @returns {boolean}
   */
  isReserved(): boolean {
    const addr = this.#address;
    // 100::/64 - Discard-Only
    if (addr >> 64n === 0x100000000000000n) return true;
    // 2001:2::/48 - Benchmarking
    if (addr >> 80n === 0x200100020000n) return true;
    // 2001:db8::/32 - Documentation
    if (addr >> 96n === 0x20010db8n) return true;
    // 2001::/32 - Teredo tunneling (2001:0000::/32)
    if (addr >> 96n === 0x20010000n) return true;
    // 2002::/16 - 6to4
    if (addr >> 112n === 0x2002n) return true;

    return false;
  }

  /**
   * Checks if the address is a global unicast address.
   * @returns {boolean}
   */
  isGlobalUnicast(): boolean {
    // Global Unicast addresses are in the 2000::/3 range
    const isGlobalRange = this.#address >> 125n === 0x1n;

    return (
      isGlobalRange &&
      !this.isUnspecified() &&
      !this.isLoopback() &&
      !this.isMulticast() &&
      !this.isLinkLocal() &&
      !this.isUniqueLocal() &&
      !this.isIPv4Mapped() &&
      !this.isReserved()
    );
  }

  // --- Operational Methods ---
  /**
   * Checks for exact equality between this and another IPv6 address.
   * @param other The other IPv6 address to compare with.
   * @returns {boolean}
   */
  equals(other: IPv6 | string): boolean {
    const otherIp = typeof other === 'string' ? new IPv6(other) : other;
    return this.#address === otherIp.#address;
  }

  /**
   * Compares this IP address with another.
   * @param other The other IPv6 address to compare with.
   * @returns `-1` if this address is less than the other, `0` if they are equal, `1` if it is greater.
   */
  compare(other: IPv6 | string): -1 | 0 | 1 {
    const otherIp = typeof other === 'string' ? new IPv6(other) : other;
    if (this.#address < otherIp.#address) return -1;
    if (this.#address > otherIp.#address) return 1;
    return 0;
  }

  /**
   * Performs a bitwise AND operation with another IPv6 address.
   * @param other The other IPv6 address.
   * @returns A new IPv6 instance with the result of the AND operation.
   */
  and(other: IPv6 | string): IPv6 {
    const otherIp = typeof other === 'string' ? new IPv6(other) : other;
    return IPv6.fromBigInt(this.#address & otherIp.#address);
  }

  /**
   * Performs a bitwise OR operation with another IPv6 address.
   * @param other The other IPv6 address.
   * @returns A new IPv6 instance with the result of the OR operation.
   */
  or(other: IPv6 | string): IPv6 {
    const otherIp = typeof other === 'string' ? new IPv6(other) : other;
    return IPv6.fromBigInt(this.#address | otherIp.#address);
  }

  /**
   * Performs a bitwise NOT operation on the address.
   * @returns A new IPv6 instance with the result of the NOT operation.
   */
  not(): IPv6 {
    return IPv6.fromBigInt(~this.#address & MAX_IP[6]);
  }

  /**
   * Returns the next IP address.
   * @param [count=1n] The number of addresses to increment by.
   * @returns {IPv6}
   */
  next(count = 1n): IPv6 {
    return IPv6.fromBigInt((this.#address + count) & MAX_IP[6]);
  }

  /**
   * Returns the previous IP address.
   * @param [count=1n] The number of addresses to decrement by.
   * @returns {IPv6}
   */
  previous(count = 1n): IPv6 {
    return IPv6.fromBigInt((this.#address - count) & MAX_IP[6]);
  }
}
