// src/domain/value-objects/account-id.vo.ts

import { DomainError } from '../errors/domain.error';

export class AccountId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): AccountId {
    if (!raw || typeof raw !== 'string') {
      throw new DomainError('Account ID must be a non-empty string');
    }

    const normalized = raw.trim();

    if (!this.isValidFormat(normalized)) {
      throw new DomainError('Account ID must be exactly 13 digits');
    }

    return new AccountId(normalized);
  }

  private static isValidFormat(accountId: string): boolean {
    // Must be exactly 13 digits
    const accountRegex = /^\d{13}$/;
    return accountRegex.test(accountId);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AccountId): boolean {
    if (!other || !(other instanceof AccountId)) {
      return false;
    }
    return this.value === other.value;
  }

  get raw(): string {
    return this.value;
  }

  // Format for display (e.g., "1234567890123" -> "1234-5678-90123")
  toFormattedString(): string {
    return `${this.value.slice(0, 4)}-${this.value.slice(4, 8)}-${this.value.slice(8)}`;
  }
}
