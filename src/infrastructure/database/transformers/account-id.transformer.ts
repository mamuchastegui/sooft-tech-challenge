// src/infrastructure/database/transformers/account-id.transformer.ts

import { ValueTransformer } from 'typeorm';
import { AccountId } from '../../../domain/value-objects/account-id.vo';

export class AccountIdTransformer implements ValueTransformer {
  to(value: AccountId | null): string | null {
    return value ? value.toString() : null;
  }

  from(value: string | null): AccountId | null {
    return value ? AccountId.create(value) : null;
  }
}
