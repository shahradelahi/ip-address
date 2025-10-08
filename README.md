# @se-oss/ip-address

[![CI](https://github.com/shahradelahi/ip-address/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/shahradelahi/ip-address/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/@se-oss/ip-address.svg)](https://www.npmjs.com/package/@se-oss/ip-address)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](/LICENSE)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@se-oss/ip-address)
[![Install Size](https://packagephobia.com/badge?p=@se-oss/ip-address)](https://packagephobia.com/result?p=@se-oss/ip-address)

_@se-oss/ip-address_ is a modern, immutable, and zero-dependency library for working with IPv4 and IPv6 addresses in JavaScript and TypeScript.

---

- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#license)

## 📦 Installation

```bash
npm install @se-oss/ip-address
```

<details>
<summary>Install using your favorite package manager</summary>

**pnpm**

```bash
pnpm install @se-oss/ip-address
```

**yarn**

```bash
yarn add @se-oss/ip-address
```

</details>

## 📖 Usage

This library makes working with IP addresses a breeze. Here are a few common scenarios:

### Parsing and Validation

You can easily parse any IP address string. The library will automatically figure out the version and throw an error if the address is invalid.

```typescript
import { IPv4, IPv6, parseIP } from '@se-oss/ip-address';

// Let the factory do the work
const ip = parseIP('192.168.1.1'); // Returns an IPv4 instance
const ip6 = parseIP('2001:db8::1'); // Returns an IPv6 instance

console.log(ip.version); // 4
console.log(ip6.version); // 6

// Or validate without creating an instance
if (IPv4.isValid('10.0.0.1')) {
  console.log('Yep, a valid IPv4 address.');
}

try {
  parseIP('not.an.ip');
} catch (error) {
  console.error(error.message); // "Invalid IP address: not.an.ip"
}
```

### Working with IPv4 Addresses

Once you have an `IPv4` instance, you can perform all sorts of checks and conversions.

```typescript
import { IPv4 } from '@se-oss/ip-address';

const ip = new IPv4('192.168.1.1');

// Check its type
console.log(ip.isPrivate()); // true
console.log(ip.isLoopback()); // false

// Convert it
console.log(ip.toBigInt()); // 3232235777n
console.log(ip.toBytes()); // [192, 168, 1, 1]
console.log(ip.toArpa()); // "1.1.168.192.in-addr.arpa"

// Get the next IP
const nextIp = ip.next();
console.log(nextIp.address); // "192.168.1.2"
```

### Working with IPv6 Addresses

IPv6 is just as easy, with full support for its unique features.

```typescript
import { IPv6 } from '@se-oss/ip-address';

const ip6 = new IPv6('2001:db8::8a2e:370:7334');

// Get compressed vs. expanded address
console.log(ip6.address); // "2001:db8::8a2e:370:7334"
console.log(ip6.expandedAddress); // "2001:0db8:0000:0000:0000:8a2e:0370:7334"

// Check its type
console.log(ip6.isGlobalUnicast()); // true
console.log(ip6.isLinkLocal()); // false

// Handle IPv4-mapped addresses
const mappedIp = new IPv6('::ffff:192.168.1.1');
console.log(mappedIp.isIPv4Mapped()); // true
const ipv4 = mappedIp.toIPv4();
console.log(ipv4.address); // "192.168.1.1"
```

### Handling CIDR Blocks

Need to work with subnets? The `CIDR` class has you covered.

```typescript
import { CIDR } from '@se-oss/ip-address';

const cidr = new CIDR('10.0.0.0/24');

// Get network details
console.log(cidr.network.address); // "10.0.0.0"
console.log(cidr.broadcast.address); // "10.0.0.255"
console.log(cidr.first.address); // "10.0.0.1"
console.log(cidr.last.address); // "10.0.0.254"

// Check if an IP falls within the range
console.log(cidr.contains('10.0.0.123')); // true
console.log(cidr.contains('10.0.1.1')); // false
```

## 📚 Documentation

For all configuration options, please see [the API docs](https://www.jsdocs.io/package/@se-oss/ip-address).

## 🤝 Contributing

Want to contribute? Awesome! To show your support is to star the project, or to raise issues on [GitHub](https://github.com/shahradelahi/ip-address)

Thanks again for your support, it is much appreciated! 🙏

## License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi) and [contributors](https://github.com/shahradelahi/ip-address/graphs/contributors).
