// src/domain/value-objects/money.ts

import { DomainError } from '../errors/domain.error';

type Currency = 'ARS' | 'USD' | 'EUR' | 'BRL';

export class Money {
  private constructor(
    private readonly cents: bigint,
    private readonly currency: Currency,
  ) {
    Object.freeze(this);
  }

  static of(cents: bigint | number, currency: Currency): Money {
    if (typeof cents === 'number') {
      if (!Number.isInteger(cents)) {
        throw new DomainError('Money cents must be an integer');
      }
      cents = BigInt(cents);
    }

    if (cents < 0n) {
      throw new DomainError('Money amount cannot be negative');
    }

    if (!Money.isValidCurrency(currency)) {
      throw new DomainError(`Invalid currency: ${currency}`);
    }

    return new Money(cents, currency);
  }

  static create(amount: number | string, currency: Currency = 'ARS'): Money {
    if (amount === null || amount === undefined) {
      throw new DomainError('Money amount cannot be null or undefined');
    }

    let numericAmount: number;

    if (typeof amount === 'string') {
      const trimmed = amount.trim();
      if (trimmed === '') {
        throw new DomainError('Money amount must be a valid number');
      }
      // Allow digits, decimal point, and leading + or -
      if (!/^[+-]?\d*\.?\d+$/.test(trimmed)) {
        throw new DomainError('Money amount must be a valid number');
      }
      numericAmount = parseFloat(trimmed);
      if (isNaN(numericAmount)) {
        throw new DomainError('Money amount must be a valid number');
      }
    } else if (typeof amount === 'number') {
      numericAmount = amount;
    } else {
      throw new DomainError('Money amount must be a number or numeric string');
    }

    if (!isFinite(numericAmount)) {
      throw new DomainError('Money amount must be finite');
    }

    if (numericAmount < 0) {
      throw new DomainError('Money amount cannot be negative');
    }

    // Convert to cents using banker's rounding
    const cents = Math.round(numericAmount * 100);

    return Money.of(BigInt(cents), currency);
  }

  static zero(currency: Currency = 'ARS'): Money {
    return new Money(0n, currency);
  }

  private static isValidCurrency(currency: string): currency is Currency {
    return ['ARS', 'USD', 'EUR', 'BRL'].includes(currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.cents - other.cents;
    if (result < 0n) {
      throw new DomainError('Money amount cannot be negative');
    }
    return new Money(result, this.currency);
  }

  multiply(
    factor: number,
    roundingMode: 'BANKERS' | 'HALF_UP' = 'BANKERS',
  ): Money {
    if (!isFinite(factor) || factor < 0) {
      throw new DomainError(
        'Money multiplication factor must be a positive finite number',
      );
    }

    const result = Number(this.cents) * factor;
    const rounded =
      roundingMode === 'BANKERS'
        ? this.bankersRounding(result)
        : Math.round(result);

    return new Money(BigInt(rounded), this.currency);
  }

  divide(
    divisor: number,
    roundingMode: 'BANKERS' | 'HALF_UP' = 'BANKERS',
  ): Money {
    if (!isFinite(divisor) || divisor <= 0) {
      throw new DomainError(
        'Money division divisor must be a positive finite number',
      );
    }

    const result = Number(this.cents) / divisor;
    const rounded =
      roundingMode === 'BANKERS'
        ? this.bankersRounding(result)
        : Math.round(result);

    return new Money(BigInt(rounded), this.currency);
  }

  private bankersRounding(value: number): number {
    const rounded = Math.round(value);
    const diff = value - rounded;

    // If exactly 0.5, round to even
    if (Math.abs(diff) === 0.5) {
      return rounded % 2 === 0 ? rounded : rounded - Math.sign(diff);
    }

    return rounded;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError(
        `Cannot perform operation between ${this.currency} and ${other.currency}`,
      );
    }
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents > other.cents;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents >= other.cents;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents < other.cents;
  }

  isLessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents <= other.cents;
  }

  equals(other: Money): boolean {
    if (!other || !(other instanceof Money)) {
      return false;
    }
    return this.cents === other.cents && this.currency === other.currency;
  }

  toString(): string {
    return this.toDecimal().toFixed(2);
  }

  toNumber(): number {
    return this.toDecimal();
  }

  toDecimal(): number {
    return Number(this.cents) / 100;
  }

  getCents(): bigint {
    return this.cents;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  // Format as currency with locale support
  format(locale: string = 'es-AR'): string {
    const amount = this.toDecimal();

    const currencySymbols: Record<Currency, string> = {
      ARS: '$',
      USD: 'US$',
      EUR: '€',
      BRL: 'R$',
    };

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: this.currency,
        currencyDisplay: 'symbol',
      }).format(amount);
    } catch {
      // Fallback if locale is not supported
      const symbol = currencySymbols[this.currency];
      return `${symbol}${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  }

  // Legacy compatibility method
  toCurrencyString(symbol: string = '$'): string {
    const amount = this.toDecimal();
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  toJSON(): { cents: string; currency: Currency } {
    return {
      cents: this.cents.toString(),
      currency: this.currency,
    };
  }

  get raw(): number {
    // Legacy compatibility - returns decimal value
    return this.toDecimal();
  }
}
