// src/domain/value-objects/cvu.ts

import { DomainError } from '../errors/domain.error';

export class Cvu {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Cvu {
    if (!raw || typeof raw !== 'string') {
      throw new DomainError('CVU must be a non-empty string');
    }

    // Normalize by removing spaces and non-digit characters
    const normalized = raw.replace(/\D/g, '');

    if (!this.isValidFormat(normalized)) {
      throw new DomainError('CVU must be exactly 22 digits');
    }

    if (!this.isValidChecksum(normalized)) {
      throw new DomainError('CVU has invalid control digits');
    }

    return new Cvu(normalized);
  }

  private static isValidFormat(cvu: string): boolean {
    // Must be exactly 22 digits
    return /^\d{22}$/.test(cvu);
  }

  private static isValidChecksum(cvu: string): boolean {
    // CVU format: EEEEAAAAAAAAAAAAAACC
    // EEEE = PSP Entity code (4 digits, usually starts with 0000)
    // AAAAAAAAAAAAAAAA = Account identifier (16 digits)
    // CC = Control digits (2 digits)

    const entityCode = cvu.substring(0, 4);
    const accountIdentifier = cvu.substring(4, 20);
    const controlDigits = cvu.substring(20, 22);

    // CVU uses a similar mod 10 algorithm but with different weighting
    const firstControl = this.calculateCvuMod10Checksum(entityCode);
    if (parseInt(controlDigits[0]) !== firstControl) {
      return false;
    }

    const secondControl = this.calculateCvuMod10Checksum(accountIdentifier);
    if (parseInt(controlDigits[1]) !== secondControl) {
      return false;
    }

    return true;
  }

  private static calculateCvuMod10Checksum(digits: string): number {
    // CVU mod 10 algorithm (similar to CBU but with CVU-specific weights)
    const weights = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      const digit = parseInt(digits[i]);
      const weight = weights[i % weights.length];
      let product = digit * weight;

      // If product > 9, sum digits (e.g., 14 -> 1+4 = 5)
      if (product > 9) {
        product = Math.floor(product / 10) + (product % 10);
      }

      sum += product;
    }

    // Control digit = (10 - (sum mod 10)) mod 10
    return (10 - (sum % 10)) % 10;
  }

  toString(): string {
    return this.value;
  }

  toMaskedString(): string {
    // Show first 3 and last 3 digits: "000***************001"
    if (this.value.length !== 22) {
      return this.value;
    }
    return (
      this.value.substring(0, 3) + '*'.repeat(16) + this.value.substring(19)
    );
  }

  equals(other: Cvu): boolean {
    if (!other || !(other instanceof Cvu)) {
      return false;
    }
    return this.value === other.value;
  }

  get raw(): string {
    return this.value;
  }

  // Format for display (e.g., "0000003100010000000001" -> "0000-003100-01000000000-01")
  toFormattedString(): string {
    return `${this.value.substring(0, 4)}-${this.value.substring(4, 10)}-${this.value.substring(10, 21)}-${this.value.substring(21)}`;
  }

  getEntityCode(): string {
    return this.value.substring(0, 4);
  }

  getAccountIdentifier(): string {
    return this.value.substring(4, 20);
  }

  getControlDigits(): string {
    return this.value.substring(20, 22);
  }
}
