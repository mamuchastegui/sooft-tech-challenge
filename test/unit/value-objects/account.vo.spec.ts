// test/unit/value-objects/account.vo.spec.ts

import {
  Account,
  parseAccount,
  createCbuAccount,
  createCvuAccount,
  createAliasAccount,
  accountToString,
  accountToMaskedString,
} from '../../../src/domain/value-objects/account';
import { Cbu } from '../../../src/domain/value-objects/cbu';
import { Cvu } from '../../../src/domain/value-objects/cvu';
import { AliasAccount } from '../../../src/domain/value-objects/alias-account';
import { DomainError } from '../../../src/domain/errors/domain.error';
import { VALID_TEST_ACCOUNTS } from '../../helpers/test-accounts.helper';

describe('Account Union Type and Helpers', () => {
  describe('parseAccount', () => {
    describe('CBU parsing', () => {
      it('should parse valid 22-digit string as CBU', () => {
        const cbuString = VALID_TEST_ACCOUNTS.CBU_MACRO;
        const account = parseAccount(cbuString);

        expect(account.kind).toBe('CBU');
        expect(account.value).toBeInstanceOf(Cbu);
        expect(account.value.toString()).toBe(cbuString);
      });

      it('should parse formatted CBU string', () => {
        const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
        const formattedCbu = validCbu.match(/.{1,4}/g)?.join(' ') || validCbu;
        const account = parseAccount(formattedCbu);

        expect(account.kind).toBe('CBU');
        expect(account.value.toString()).toBe(validCbu);
      });

      it('should parse hyphenated CBU string', () => {
        const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
        const hyphenatedCbu = validCbu.slice(0, 18) + '-' + validCbu.slice(18, 20) + '-' + validCbu.slice(20);
        const account = parseAccount(hyphenatedCbu);

        expect(account.kind).toBe('CBU');
        expect(account.value.toString()).toBe(validCbu);
      });
    });

    describe('CVU parsing', () => {
      it('should parse valid CVU when CBU parsing fails', () => {
        const cvuString = VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO;
        const account = parseAccount(cvuString);

        expect(account.kind).toBe('CVU');
        expect(account.value).toBeInstanceOf(Cvu);
        expect(account.value.toString()).toBe(cvuString);
      });

      it('should parse formatted CVU string', () => {
        const validCvu = VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO;
        const formattedCvu = validCvu.match(/.{1,3}/g)?.join(' ') || validCvu;
        const account = parseAccount(formattedCvu);

        expect(account.kind).toBe('CVU');
        expect(account.value.toString()).toBe(validCvu);
      });
    });

    describe('Alias parsing', () => {
      it('should parse valid alias string', () => {
        const aliasString = 'my.wallet';
        const account = parseAccount(aliasString);

        expect(account.kind).toBe('ALIAS');
        expect(account.value).toBeInstanceOf(AliasAccount);
        expect(account.value.toString()).toBe(aliasString);
      });

      it('should parse alias with case normalization', () => {
        const aliasString = 'MY.WALLET';
        const account = parseAccount(aliasString);

        expect(account.kind).toBe('ALIAS');
        expect(account.value.toString()).toBe('my.wallet');
      });

      it('should parse alias with special characters', () => {
        const aliasString = 'test_wallet-123';
        const account = parseAccount(aliasString);

        expect(account.kind).toBe('ALIAS');
        expect(account.value.toString()).toBe(aliasString);
      });
    });

    describe('error cases', () => {
      it('should throw error for empty string', () => {
        expect(() => parseAccount('')).toThrow(DomainError);
        expect(() => parseAccount('')).toThrow(
          /Account input must be a non-empty string/,
        );
      });

      it('should throw error for whitespace-only string', () => {
        expect(() => parseAccount('   ')).toThrow(DomainError);
        expect(() => parseAccount('   ')).toThrow(
          /Invalid account format/,
        );
      });

      it('should throw error for invalid 22-digit number', () => {
        const invalid22Digit = '1234567890123456789012'; // Invalid control digits for both CBU and CVU
        expect(() => parseAccount(invalid22Digit)).toThrow(DomainError);
      });

      it('should throw error for invalid alias format', () => {
        const invalidAlias = 'a'; // Too short for alias
        expect(() => parseAccount(invalidAlias)).toThrow(DomainError);
      });

      it('should throw error for completely invalid input', () => {
        const invalid = 'invalid@account';
        expect(() => parseAccount(invalid)).toThrow(DomainError);
        expect(() => parseAccount(invalid)).toThrow(
          /Invalid account format/,
        );
      });
    });

    describe('input normalization', () => {
      it('should trim whitespace before parsing', () => {
        const aliasWithSpaces = '  my.wallet  ';
        const account = parseAccount(aliasWithSpaces);

        expect(account.kind).toBe('ALIAS');
        expect(account.value.toString()).toBe('my.wallet');
      });

      it('should handle mixed formatting in numeric inputs', () => {
        const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
        const mixedFormat = ' ' + validCbu.slice(0, 3) + '-' + validCbu.slice(3, 9) + ' ' + validCbu.slice(9, 18) + ' ' + validCbu.slice(18) + ' ';
        const account = parseAccount(mixedFormat);

        expect(account.kind).toBe('CBU');
        expect(account.value.toString()).toBe(validCbu);
      });
    });
  });

  describe('createCbuAccount', () => {
    it('should create CBU account from valid string', () => {
      const cbuString = VALID_TEST_ACCOUNTS.CBU_MACRO;
      const account = createCbuAccount(cbuString);

      expect(account.kind).toBe('CBU');
      expect(account.value).toBeInstanceOf(Cbu);
      expect(account.value.toString()).toBe(cbuString);
    });

    it('should throw error for invalid CBU', () => {
      const invalidCbu = '1234567890123456789012';
      expect(() => createCbuAccount(invalidCbu)).toThrow(DomainError);
    });
  });

  describe('createCvuAccount', () => {
    it('should create CVU account from valid string', () => {
      const cvuString = VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO;
      const account = createCvuAccount(cvuString);

      expect(account.kind).toBe('CVU');
      expect(account.value).toBeInstanceOf(Cvu);
      expect(account.value.toString()).toBe(cvuString);
    });

    it('should throw error for invalid CVU', () => {
      const invalidCvu = '1234567890123456789012';
      expect(() => createCvuAccount(invalidCvu)).toThrow(DomainError);
    });
  });

  describe('createAliasAccount', () => {
    it('should create Alias account from valid string', () => {
      const aliasString = 'my.wallet';
      const account = createAliasAccount(aliasString);

      expect(account.kind).toBe('ALIAS');
      expect(account.value).toBeInstanceOf(AliasAccount);
      expect(account.value.toString()).toBe(aliasString);
    });

    it('should throw error for invalid alias', () => {
      const invalidAlias = 'ab'; // Too short
      expect(() => createAliasAccount(invalidAlias)).toThrow(DomainError);
    });
  });

  describe('accountToString', () => {
    it('should convert CBU account to string', () => {
      const account = createCbuAccount(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const result = accountToString(account);

      expect(result).toBe(VALID_TEST_ACCOUNTS.CBU_MACRO);
    });

    it('should convert CVU account to string', () => {
      const account = createCvuAccount(VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO);
      const result = accountToString(account);

      expect(result).toBe(VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO);
    });

    it('should convert Alias account to string', () => {
      const account = createAliasAccount('my.wallet');
      const result = accountToString(account);

      expect(result).toBe('my.wallet');
    });
  });

  describe('accountToMaskedString', () => {
    it('should convert CBU account to masked string', () => {
      const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
      const account = createCbuAccount(validCbu);
      const result = accountToMaskedString(account);

      expect(result).toBe(validCbu.slice(0, 3) + '*'.repeat(16) + validCbu.slice(-3));
    });

    it('should convert CVU account to masked string', () => {
      const validCvu = VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO;
      const account = createCvuAccount(validCvu);
      const result = accountToMaskedString(account);

      expect(result).toBe(validCvu.slice(0, 3) + '*'.repeat(16) + validCvu.slice(-3));
    });

    it('should convert Alias account to masked string', () => {
      const account = createAliasAccount('my.wallet');
      const result = accountToMaskedString(account);

      expect(result).toBe('my*****et');
    });
  });

  describe('type safety', () => {
    it('should maintain proper type discrimination for CBU', () => {
      const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
      const account: Account = createCbuAccount(validCbu);

      if (account.kind === 'CBU') {
        // TypeScript should know this is a Cbu
        expect(account.value.getBankCode).toBeDefined();
        expect(account.value.getBankCode()).toBe(validCbu.slice(0, 3));
      } else {
        fail('Account should be CBU type');
      }
    });

    it('should maintain proper type discrimination for CVU', () => {
      const account: Account = createCvuAccount(VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO);

      if (account.kind === 'CVU') {
        // TypeScript should know this is a Cvu
        expect(account.value.getEntityCode).toBeDefined();
        expect(account.value.getEntityCode()).toBe('0000');
      } else {
        fail('Account should be CVU type');
      }
    });

    it('should maintain proper type discrimination for Alias', () => {
      const account: Account = createAliasAccount('my.wallet');

      if (account.kind === 'ALIAS') {
        // TypeScript should know this is an AliasAccount
        expect(account.value.toMaskedString).toBeDefined();
        expect(account.value.toMaskedString()).toBe('my*****et');
      } else {
        fail('Account should be ALIAS type');
      }
    });
  });

  describe('integration tests', () => {
    it('should handle round-trip parsing and conversion', () => {
      const testCases = [
        { input: VALID_TEST_ACCOUNTS.CBU_MACRO, expectedKind: 'CBU' as const },
        { input: VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO, expectedKind: 'CVU' as const },
        { input: 'my.wallet', expectedKind: 'ALIAS' as const },
        { input: 'test_account-123', expectedKind: 'ALIAS' as const },
      ];

      testCases.forEach(({ input, expectedKind }) => {
        const account = parseAccount(input);
        expect(account.kind).toBe(expectedKind);

        const stringified = accountToString(account);
        const reparsed = parseAccount(stringified);

        expect(reparsed.kind).toBe(expectedKind);
        expect(accountToString(reparsed)).toBe(stringified);
      });
    });

    it('should handle masking for all account types', () => {
      const accounts = [
        {
          account: parseAccount(VALID_TEST_ACCOUNTS.CBU_MACRO),
          expectedMask: VALID_TEST_ACCOUNTS.CBU_MACRO.slice(0, 3) + '*'.repeat(16) + VALID_TEST_ACCOUNTS.CBU_MACRO.slice(-3),
        },
        {
          account: parseAccount(VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO),
          expectedMask: VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO.slice(0, 3) + '*'.repeat(16) + VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO.slice(-3),
        },
        { account: parseAccount('my.wallet'), expectedMask: 'my*****et' },
        { account: parseAccount('short.alias'), expectedMask: 'sh*******as' },
      ];

      accounts.forEach(({ account, expectedMask }) => {
        const masked = accountToMaskedString(account);
        expect(masked).toBe(expectedMask);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle special CBU/CVU edge cases', () => {
      // All zeros - valid for both CBU and CVU, but should be parsed as CBU first
      const allZeros = '0000000000000000000000';
      const account = parseAccount(allZeros);

      // Should be parsed as CBU since it tries CBU first
      expect(account.kind).toBe('CBU');
    });

    it('should handle minimum and maximum alias lengths', () => {
      const minAlias = 'wallet'; // 6 chars
      const maxAlias = VALID_TEST_ACCOUNTS.ALIAS_LONG; // 20 chars exactly

      const minAccount = parseAccount(minAlias);
      const maxAccount = parseAccount(maxAlias);

      expect(minAccount.kind).toBe('ALIAS');
      expect(maxAccount.kind).toBe('ALIAS');
      expect(accountToString(minAccount)).toBe(minAlias);
      expect(accountToString(maxAccount)).toBe(maxAlias);
    });

    it('should handle case sensitivity in alias parsing', () => {
      const upperCase = 'MY.WALLET';
      const lowerCase = 'my.wallet';

      const upperAccount = parseAccount(upperCase);
      const lowerAccount = parseAccount(lowerCase);

      expect(upperAccount.kind).toBe('ALIAS');
      expect(lowerAccount.kind).toBe('ALIAS');
      expect(accountToString(upperAccount)).toBe(lowerCase);
      expect(accountToString(lowerAccount)).toBe(lowerCase);
    });
  });
});
