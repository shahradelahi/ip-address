export class InvalidIPAddressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIPAddressError';
  }
}
