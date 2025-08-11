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

    const normalized = this.normalize(raw);

    if (!this.isValidChecksum(normalized)) {
      throw new DomainError('Invalid CUIT checksum');
    }

    return new Cuit(normalized);
  }

  static normalize(raw: string): string {
    const trimmed = raw.trim();

    // Remove all non-digits
    const digitsOnly = trimmed.replace(/\D/g, '');

    if (digitsOnly.length !== 11) {
      throw new DomainError('CUIT must have exactly 11 digits');
    }

    // Format as XX-XXXXXXXX-X
    return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 10)}-${digitsOnly.slice(10)}`;
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

  toMasked(): string {
    // Format: 20-XXXXXXXX-3 -> 20-****XXXX-3
    const parts = this.value.split('-');
    const middlePart = parts[1];
    const maskedMiddle = '****' + middlePart.slice(-4);
    return `${parts[0]}-${maskedMiddle}-${parts[2]}`;
  }

  toNormalized(): string {
    // Return digits only (11 chars) for database storage
    return this.value.replace(/-/g, '');
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
