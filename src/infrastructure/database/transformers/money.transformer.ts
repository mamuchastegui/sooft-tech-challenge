// src/infrastructure/database/transformers/money.transformer.ts

import { ValueTransformer } from 'typeorm';
import { Money } from '../../../domain/value-objects/money.vo';

export class MoneyTransformer implements ValueTransformer {
  to(value: Money | null): number | null {
    return value ? value.toNumber() : null;
  }

  from(value: number | null): Money | null {
    return value !== null && value !== undefined ? Money.create(value) : null;
  }
}
