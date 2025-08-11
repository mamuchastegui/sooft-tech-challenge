// src/domain/value-objects/account.ts

import { DomainError } from '../errors/domain.error';
import { Cbu } from './cbu';
import { Cvu } from './cvu';
import { AliasAccount } from './alias-account';

export type Account =
  | { kind: 'CBU'; value: Cbu }
  | { kind: 'CVU'; value: Cvu }
  | { kind: 'ALIAS'; value: AliasAccount };

export function parseAccount(input: string): Account {
  if (!input || typeof input !== 'string') {
    throw new DomainError('Account input must be a non-empty string');
  }

  const trimmed = input.trim();

  // Check if it looks like a 22-digit number (CBU or CVU)
  const normalized = trimmed.replace(/\D/g, '');

  if (normalized.length === 22 && /^\d{22}$/.test(normalized)) {
    // Try CBU first, then CVU
    try {
      const cbu = Cbu.create(normalized);
      return { kind: 'CBU', value: cbu };
    } catch {
      // If CBU validation fails, try CVU
      try {
        const cvu = Cvu.create(normalized);
        return { kind: 'CVU', value: cvu };
      } catch {
        throw new DomainError('Invalid CBU/CVU format or control digits');
      }
    }
  }

  // Otherwise, try as alias
  try {
    const alias = AliasAccount.create(trimmed);
    return { kind: 'ALIAS', value: alias };
  } catch {
    throw new DomainError(
      'Invalid account format: must be a valid CBU (22 digits), CVU (22 digits), or Alias (6-20 alphanumeric characters with .-_)',
    );
  }
}

export function accountToString(account: Account): string {
  return account.value.toString();
}

export function accountToMaskedString(account: Account): string {
  return account.value.toMaskedString();
}

export function accountEquals(account1: Account, account2: Account): boolean {
  if (account1.kind !== account2.kind) {
    return false;
  }

  // Use type-safe equals based on account kind
  switch (account1.kind) {
    case 'CBU':
      return account1.value.equals(
        (account2 as { kind: 'CBU'; value: Cbu }).value,
      );
    case 'CVU':
      return account1.value.equals(
        (account2 as { kind: 'CVU'; value: Cvu }).value,
      );
    case 'ALIAS':
      return account1.value.equals(
        (account2 as { kind: 'ALIAS'; value: AliasAccount }).value,
      );
    default:
      return false;
  }
}

export function createCbuAccount(cbu: string): Account {
  return { kind: 'CBU', value: Cbu.create(cbu) };
}

export function createCvuAccount(cvu: string): Account {
  return { kind: 'CVU', value: Cvu.create(cvu) };
}

export function createAliasAccount(alias: string): Account {
  return { kind: 'ALIAS', value: AliasAccount.create(alias) };
}
