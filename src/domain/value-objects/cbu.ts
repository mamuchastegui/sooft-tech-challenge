// src/domain/value-objects/cbu.ts

import { DomainError } from '../errors/domain.error';

export class Cbu {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Cbu {
    if (!raw || typeof raw !== 'string') {
      throw new DomainError('CBU must be a non-empty string');
    }

    // Normalize by removing spaces and non-digit characters
    const normalized = raw.replace(/\D/g, '');

    if (!this.isValidFormat(normalized)) {
      throw new DomainError('CBU must be exactly 22 digits');
    }

    if (!this.isValidChecksum(normalized)) {
      throw new DomainError('CBU has invalid control digits');
    }

    return new Cbu(normalized);
  }

  private static isValidFormat(cbu: string): boolean {
    // Must be exactly 22 digits
    return /^\d{22}$/.test(cbu);
  }

  private static isValidChecksum(cbu: string): boolean {
    // CBU format: BBBBAAAAAAAAAAAAAACC
    // BBBB = Bank code (4 digits)
    // AAAAAAAAAAAAAAAA = Account number (16 digits)
    // CC = Control digits (2 digits)

    const bankCode = cbu.substring(0, 4);
    const accountNumber = cbu.substring(4, 20);
    const controlDigits = cbu.substring(20, 22);

    // First control digit: mod 10 checksum on bank code
    const firstControl = this.calculateMod10Checksum(bankCode);
    if (parseInt(controlDigits[0]) !== firstControl) {
      return false;
    }

    // Second control digit: mod 10 checksum on account number
    const secondControl = this.calculateMod10Checksum(accountNumber);
    if (parseInt(controlDigits[1]) !== secondControl) {
      return false;
    }

    return true;
  }

  private static calculateMod10Checksum(digits: string): number {
    // BCRA mod 10 algorithm
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
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
    // Show first 3 and last 3 digits: "285***************201"
    if (this.value.length !== 22) {
      return this.value;
    }
    return (
      this.value.substring(0, 3) + '*'.repeat(16) + this.value.substring(19)
    );
  }

  equals(other: Cbu): boolean {
    if (!other || !(other instanceof Cbu)) {
      return false;
    }
    return this.value === other.value;
  }

  get raw(): string {
    return this.value;
  }

  // Format for display (e.g., "2850590940090418135201" -> "285-059094-00904181352-01")
  toFormattedString(): string {
    return `${this.value.substring(0, 3)}-${this.value.substring(3, 9)}-${this.value.substring(9, 20)}-${this.value.substring(20)}`;
  }

  getBankCode(): string {
    return this.value.substring(0, 3);
  }

  getAccountIdentifier(): string {
    return this.value.substring(4, 20);
  }

  getAccountNumber(): string {
    return this.value.substring(4, 20);
  }

  getControlDigits(): string {
    return this.value.substring(20, 22);
  }
}
