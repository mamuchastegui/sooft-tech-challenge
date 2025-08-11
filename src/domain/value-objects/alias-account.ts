// src/domain/value-objects/alias-account.ts

import { DomainError } from '../errors/domain.error';

export class AliasAccount {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): AliasAccount {
    if (!raw || typeof raw !== 'string') {
      throw new DomainError('Alias must be a non-empty string');
    }

    // Normalize to lowercase and trim
    const normalized = raw.trim().toLowerCase();

    this.isValidFormat(normalized);

    return new AliasAccount(normalized);
  }

  private static isValidFormat(alias: string): boolean {
    // Check length first for better error messages
    if (alias.length < 6 || alias.length > 20) {
      throw new DomainError('Alias must be between 6 and 20 characters');
    }

    // Check characters
    const aliasRegex = /^[A-Za-z0-9._-]+$/;
    if (!aliasRegex.test(alias)) {
      throw new DomainError(
        'Alias can only contain letters, numbers, dots, underscores, and hyphens',
      );
    }

    return true;
  }

  toString(): string {
    return this.value;
  }

  toMaskedString(): string {
    // Mask the middle half of the alias
    if (this.value.length <= 4) {
      return this.value; // Too short to mask meaningfully
    }

    const visibleChars = Math.max(2, Math.floor(this.value.length / 4));
    const startVisible = this.value.substring(0, visibleChars);
    const endVisible = this.value.substring(this.value.length - visibleChars);
    const maskLength = this.value.length - 2 * visibleChars;

    return startVisible + '*'.repeat(maskLength) + endVisible;
  }

  equals(other: AliasAccount): boolean {
    if (!other || !(other instanceof AliasAccount)) {
      return false;
    }
    return this.value === other.value;
  }

  get raw(): string {
    return this.value;
  }

  get length(): number {
    return this.value.length;
  }
}
