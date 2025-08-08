// src/domain/value-objects/cuit.ts

import { DomainError } from '../errors/domain.error';

export class Cuit {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Cuit {
    if (!raw || typeof raw !== 'string') {
      throw new DomainError('CUIT must be a non-empty string');
    }

    const normalized = raw.trim();

    if (!this.isValidFormat(normalized)) {
      throw new DomainError('CUIT must follow the format XX-XXXXXXXX-X');
    }

    if (!this.isValidChecksum(normalized)) {
      throw new DomainError('Invalid CUIT checksum');
    }

    return new Cuit(normalized);
  }

  private static isValidFormat(cuit: string): boolean {
    const cuitRegex = /^\d{2}-\d{8}-\d$/;
    return cuitRegex.test(cuit);
  }

  private static isValidChecksum(cuit: string): boolean {
    // Remove dashes and convert to digits
    const digits = cuit.replace(/-/g, '').split('').map(Number);

    if (digits.length !== 11) {
      return false;
    }

    // CUIT checksum algorithm multipliers
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const sum = multipliers.reduce(
      (acc, mult, index) => acc + mult * digits[index],
      0,
    );

    const remainder = sum % 11;
    let expectedCheckDigit = 11 - remainder;

    if (expectedCheckDigit === 11) expectedCheckDigit = 0;
    if (expectedCheckDigit === 10) expectedCheckDigit = 9;

    return digits[10] === expectedCheckDigit;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Cuit): boolean {
    if (!other || !(other instanceof Cuit)) {
      return false;
    }
    return this.value === other.value;
  }

  get raw(): string {
    return this.value;
  }
}
