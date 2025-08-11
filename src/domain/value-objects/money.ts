// src/domain/value-objects/money.ts

import { DomainError } from '../errors/domain.error';

export class Money {
  private constructor(private readonly amount: number) {
    Object.freeze(this);
  }

  static create(raw: number | string): Money {
    if (raw === null || raw === undefined) {
      throw new DomainError('Money amount cannot be null or undefined');
    }

    let numericAmount: number;

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed === '') {
        throw new DomainError('Money amount must be a valid number');
      }
      // Check if string contains invalid characters (allow only digits, decimal point, and leading +)
      if (!/^[+]?\d*\.?\d+$/.test(trimmed)) {
        throw new DomainError('Money amount must be a valid number');
      }
      numericAmount = parseFloat(trimmed);
      if (isNaN(numericAmount)) {
        throw new DomainError('Money amount must be a valid number');
      }
    } else if (typeof raw === 'number') {
      numericAmount = raw;
    } else {
      throw new DomainError('Money amount must be a number or numeric string');
    }

    if (!isFinite(numericAmount)) {
      throw new DomainError('Money amount must be finite');
    }

    if (numericAmount < 0) {
      throw new DomainError('Money amount cannot be negative');
    }

    // Round to 2 decimal places to avoid floating point precision issues
    const rounded = Math.round(numericAmount * 100) / 100;

    return new Money(rounded);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    const result = this.amount + other.amount;
    return new Money(Math.round(result * 100) / 100);
  }

  subtract(other: Money): Money {
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new DomainError('Money amount cannot be negative');
    }
    return new Money(result);
  }

  multiply(factor: number): Money {
    if (!isFinite(factor) || factor < 0) {
      throw new DomainError(
        'Money multiplication factor must be a positive finite number',
      );
    }
    return new Money(Math.round(this.amount * factor * 100) / 100);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.amount >= other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  isLessThanOrEqual(other: Money): boolean {
    return this.amount <= other.amount;
  }

  equals(other: Money): boolean {
    if (!other || !(other instanceof Money)) {
      return false;
    }
    return Math.abs(this.amount - other.amount) < 0.001; // Handle floating point precision
  }

  toString(): string {
    return this.amount.toFixed(2);
  }

  toNumber(): number {
    return this.amount;
  }

  // Format as currency (e.g., "$1,234.56")
  toCurrencyString(currency: string = '$'): string {
    return `${currency}${this.amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  get raw(): number {
    return this.amount;
  }
}
