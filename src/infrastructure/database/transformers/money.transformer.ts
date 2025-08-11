// src/infrastructure/database/transformers/money.transformer.ts

import { ValueTransformer } from 'typeorm';
import { Money } from '../../../domain/value-objects/money';

/**
 * Money transformer for TypeORM - stores as cents (integer) to avoid float precision issues
 * Database column should be BIGINT to store cents
 */
export class MoneyTransformer implements ValueTransformer {
  to(value: Money | null): string | null {
    // Store as string representation of cents to handle BigInt
    return value ? value.getCents().toString() : null;
  }

  from(value: string | number | null): Money | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle both string and number from database
    const cents =
      typeof value === 'string' ? BigInt(value) : BigInt(Math.round(value));

    // Default to ARS currency - in real apps this should come from another column
    return Money.of(cents, 'ARS');
  }
}

/**
 * Legacy Money transformer for backward compatibility with existing decimal columns
 * Use this when you can't change the database schema yet
 */
export class LegacyMoneyTransformer implements ValueTransformer {
  to(value: Money | null): number | null {
    return value ? value.toNumber() : null;
  }

  from(value: number | null): Money | null {
    return value !== null && value !== undefined
      ? Money.create(value, 'ARS')
      : null;
  }
}
