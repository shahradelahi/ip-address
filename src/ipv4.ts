import { IPV4_ADDRESS_REGEX, MAX_IP } from './constants';
import { InvalidIPAddressError } from './errors';
import { IPv6 } from './ipv6';
import { bigIntToIp, ipToBigInt } from './utils';

/**
 * Represents a single IPv4 address, providing methods for validation,
 * classification, and manipulation.
 *
 * @example
 * const ip = new IPv4('192.168.1.1');
 * console.log(ip.address); // "192.168.1.1"
 * console.log(ip.isPrivate()); // true
 */
export class IPv4 {
  readonly #address: bigint;

  /**
   * @param address An IPv4 address string (e.g., "192.168.1.1").
   * @throws {InvalidIPAddressError} If the address is not a valid IPv4 address.
   */
  constructor(address: string) {
    if (!IPv4.isValid(address)) {
      throw new InvalidIPAddressError(`Invalid IPv4 address: ${address}`);
    }
    this.#address = ipToBigInt(address, 4);
  }

  /**
   * Creates an IPv4 instance from a BigInt.
   * @param value The BigInt representation of an IPv4 address.
   * @returns A new IPv4 instance.
   *
   * @example
   * const ip = IPv4.fromBigInt(3232235777n);
   * console.log(ip.address); // "192.168.1.1"
   */
  static fromBigInt(value: bigint): IPv4 {
    const ip = bigIntToIp(value, 4);
    return new IPv4(ip);
  }

  /**
   * Creates an IPv4 instance from an array of 4 bytes.
   * @param bytes An array of 4 numbers (0-255).
   * @returns A new IPv4 instance.
   *
   * @example
   * const ip = IPv4.fromBytes([192, 168, 1, 1]);
   * console.log(ip.address); // "192.168.1.1"
   */
  static fromBytes(bytes: [number, number, number, number]): IPv4 {
    const value = bytes.reduce((acc, octet) => (acc << 8n) | BigInt(octet), 0n);
    return IPv4.fromBigInt(value);
  }

  /**
   * Checks if a string is a valid IPv4 address.
   * @param address The string to validate.
   * @returns True if the string is a valid IPv4 address.
   *
   * @example
   * IPv4.isValid('1.2.3.4'); // true
   * IPv4.isValid('1.2.3.256'); // false
   */
  static isValid(address: string): boolean {
    return IPV4_ADDRESS_REGEX.test(address);
  }

  // --- Getters ---
  /**
   * The IP version number.
   * @returns {4}
   */
  get version(): 4 {
    return 4;
  }

  /**
   * The IP address as a string.
   * @returns {string}
   */
  get address(): string {
    return bigIntToIp(this.#address, 4);
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
   * Converts the IP address to an array of 4 bytes.
   * @returns {[number, number, number, number]}
   */
  toBytes(): [number, number, number, number] {
    const address = this.#address;
    return [
      Number((address >> 24n) & 0xffn),
      Number((address >> 16n) & 0xffn),
      Number((address >> 8n) & 0xffn),
      Number(address & 0xffn),
    ];
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
   * Converts the IPv4 address to an IPv4-mapped IPv6 address.
   * @returns {IPv6} An IPv6 instance representing the mapped address.
   *
   * @example
   * const ipv4 = new IPv4('192.0.2.1');
   * const ipv6 = ipv4.toIPv4Mapped();
   * console.log(ipv6.address); // "::ffff:192.0.2.1"
   */
  toIPv4Mapped(): IPv6 {
    const mappedBigInt = (0xffffn << 32n) | this.#address;
    return IPv6.fromBigInt(mappedBigInt);
  }

  /**
   * Returns the reverse DNS (ARPA) name for the IP address.
   * @returns {string}
   *
   * @example
   * const ip = new IPv4('192.168.1.1');
   * console.log(ip.toArpa()); // "1.1.168.192.in-addr.arpa"
   */
  toArpa(): string {
    const parts = this.address.split('.').reverse().join('.');
    return `${parts}.in-addr.arpa`;
  }

  // --- Classification Methods ---
  /**
   * Checks if the address is in a private range (RFC 1918).
   * @returns {boolean}
   */
  isPrivate(): boolean {
    const addr = this.#address;
    // 10.0.0.0/8
    if (addr >= 167772160n && addr <= 184549375n) return true;
    // 172.16.0.0/12
    if (addr >= 2886729728n && addr <= 2887778303n) return true;
    // 192.168.0.0/16
    if (addr >= 3232235520n && addr <= 3232301055n) return true;
    return false;
  }

  /**
   * Checks if the address is a loopback address (127.0.0.0/8).
   * @returns {boolean}
   */
  isLoopback(): boolean {
    // 127.0.0.0/8
    return this.#address >= 2130706432n && this.#address <= 2147483647n;
  }

  /**
   * Checks if the address is a multicast address (224.0.0.0/4).
   * @returns {boolean}
   */
  isMulticast(): boolean {
    // 224.0.0.0/4
    return this.#address >= 3758096384n && this.#address <= 4026531839n;
  }

  /**
   * Checks if the address is a link-local address (169.254.0.0/16).
   * @returns {boolean}
   */
  isLinkLocal(): boolean {
    // 169.254.0.0/16
    return this.#address >= 2851995648n && this.#address <= 2852061183n;
  }

  /**
   * Checks if the address is the unspecified address (0.0.0.0).
   * @returns {boolean}
   */
  isUnspecified(): boolean {
    return this.#address === 0n;
  }

  /**
   * Checks if the address is the limited broadcast address (255.255.255.255).
   * Note: This does not check for subnet-directed broadcasts.
   * @returns {boolean}
   */
  isBroadcast(): boolean {
    return this.#address === 0xffffffffn;
  }

  /**
   * Checks if the address is reserved by IANA. This includes ranges for
   * private use, loopback, multicast, and other special purposes.
   * @returns {boolean}
   */
  isReserved(): boolean {
    const addr = this.#address;
    // 0.0.0.0/8 - "This" Network
    if (addr >= 0n && addr <= 16777215n) return true;
    // 100.64.0.0/10 - Shared Address Space
    if (addr >= 1681915904n && addr <= 1686110207n) return true;
    // 192.0.0.0/24 - IETF Protocol Assignments
    if (addr >= 3221225472n && addr <= 3221225727n) return true;
    // 192.0.2.0/24 - TEST-NET-1
    if (addr >= 3221225984n && addr <= 3221226239n) return true;
    // 192.88.99.0/24 - 6to4 Relay Anycast
    if (addr >= 3227017984n && addr <= 3227018239n) return true;
    // 198.18.0.0/15 - Network Interconnect Device Benchmark Testing
    if (addr >= 3323068416n && addr <= 3323199487n) return true;
    // 198.51.100.0/24 - TEST-NET-2
    if (addr >= 3325256704n && addr <= 3325256959n) return true;
    // 203.0.113.0/24 - TEST-NET-3
    if (addr >= 3405803776n && addr <= 3405804031n) return true;
    // 240.0.0.0/4 - Reserved for Future Use
    if (addr >= 4026531840n && addr <= 4294967295n) return true;

    return this.isPrivate() || this.isLoopback() || this.isLinkLocal() || this.isMulticast();
  }

  /**
   * Checks if the address is a global unicast address (i.e., a public IP).
   * @returns {boolean}
   */
  isGlobalUnicast(): boolean {
    return !this.isUnspecified() && !this.isBroadcast() && !this.isReserved();
  }

  // --- Operational Methods ---
  /**
   * Checks for exact equality between this and another IPv4 address.
   * @param other The other IPv4 address to compare with.
   * @returns {boolean}
   */
  equals(other: IPv4 | string): boolean {
    const otherIp = typeof other === 'string' ? new IPv4(other) : other;
    return this.#address === otherIp.#address;
  }

  /**
   * Compares this IP address with another.
   * @param other The other IPv4 address to compare with.
   * @returns `-1` if this address is less than the other, `0` if they are equal, `1` if it is greater.
   */
  compare(other: IPv4 | string): -1 | 0 | 1 {
    const otherIp = typeof other === 'string' ? new IPv4(other) : other;
    if (this.#address < otherIp.#address) return -1;
    if (this.#address > otherIp.#address) return 1;
    return 0;
  }

  /**
   * Performs a bitwise AND operation with another IPv4 address.
   * @param other The other IPv4 address.
   * @returns A new IPv4 instance with the result of the AND operation.
   */
  and(other: IPv4 | string): IPv4 {
    const otherIp = typeof other === 'string' ? new IPv4(other) : other;
    return IPv4.fromBigInt(this.#address & otherIp.#address);
  }

  /**
   * Performs a bitwise OR operation with another IPv4 address.
   * @param other The other IPv4 address.
   * @returns A new IPv4 instance with the result of the OR operation.
   */
  or(other: IPv4 | string): IPv4 {
    const otherIp = typeof other === 'string' ? new IPv4(other) : other;
    return IPv4.fromBigInt(this.#address | otherIp.#address);
  }

  /**
   * Performs a bitwise NOT operation on the address.
   * @returns A new IPv4 instance with the result of the NOT operation.
   */
  not(): IPv4 {
    return IPv4.fromBigInt(~this.#address & MAX_IP[4]);
  }

  /**
   * Returns the next IP address.
   * @param [count=1n] The number of addresses to increment by.
   * @returns {IPv4}
   */
  next(count = 1n): IPv4 {
    return IPv4.fromBigInt((this.#address + count) & MAX_IP[4]);
  }

  /**
   * Returns the previous IP address.
   * @param [count=1n] The number of addresses to decrement by.
   * @returns {IPv4}
   */
  previous(count = 1n): IPv4 {
    return IPv4.fromBigInt((this.#address - count) & MAX_IP[4]);
  }
}
