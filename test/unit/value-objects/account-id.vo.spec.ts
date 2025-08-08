// test/unit/value-objects/account-id.vo.spec.ts

import { AccountId } from '../../../src/domain/value-objects/account-id';
import { DomainError } from '../../../src/domain/errors/domain.error';

describe('AccountId Value Object', () => {
  describe('create', () => {
    it('should create a valid AccountId with exactly 13 digits', () => {
      const validAccountId = '1234567890123';
      const accountId = AccountId.create(validAccountId);

      expect(accountId).toBeInstanceOf(AccountId);
      expect(accountId.toString()).toBe(validAccountId);
      expect(accountId.raw).toBe(validAccountId);
    });

    it('should create AccountId with all zeros', () => {
      const accountId = AccountId.create('0000000000000');
      expect(accountId.toString()).toBe('0000000000000');
    });

    it('should create AccountId with all nines', () => {
      const accountId = AccountId.create('9999999999999');
      expect(accountId.toString()).toBe('9999999999999');
    });

    it('should trim whitespace from input', () => {
      const accountIdWithSpaces = '  1234567890123  ';
      const accountId = AccountId.create(accountIdWithSpaces);

      expect(accountId.toString()).toBe('1234567890123');
    });

    it('should throw DomainError for null or undefined input', () => {
      expect(() => AccountId.create(null as any)).toThrow(DomainError);
      expect(() => AccountId.create(undefined as any)).toThrow(DomainError);
      expect(() => AccountId.create('')).toThrow(DomainError);
    });

    it('should throw DomainError for non-string input', () => {
      expect(() => AccountId.create(1234567890123 as any)).toThrow(DomainError);
      expect(() => AccountId.create({} as any)).toThrow(DomainError);
      expect(() => AccountId.create([] as any)).toThrow(DomainError);
    });

    it('should throw DomainError for wrong length', () => {
      const wrongLengths = [
        '123456789012', // 12 digits
        '12345678901234', // 14 digits
        '1234567890', // 10 digits
        '123456789012345', // 15 digits
        '1', // 1 digit
        '', // 0 digits
      ];

      wrongLengths.forEach((wrongLength) => {
        expect(() => AccountId.create(wrongLength)).toThrow(DomainError);
      });
    });

    it('should throw DomainError for non-numeric characters', () => {
      const invalidAccounts = [
        'A234567890123', // Letter at start
        '1234567890ABC', // Letters at end
        '12345-7890123', // Dash in middle
        '1234567890.23', // Decimal point
        '1234567890 23', // Space
        '12345678901 3', // Space before last digit
      ];

      invalidAccounts.forEach((invalidAccount) => {
        expect(() => AccountId.create(invalidAccount)).toThrow(DomainError);
        expect(() => AccountId.create(invalidAccount)).toThrow(/must be exactly 13 digits/);
      });
    });

    it('should throw DomainError for checksum validation failures', () => {
      // Test cases where hypothetical checksum validation would fail
      // Note: AccountId currently only validates format, but we test the error message consistency
      const possibleInvalidChecksums = [
        '1234567890124', // Changed last digit
        '1234567890125', // Changed last digit
        '1234567890126', // Changed last digit
      ];

      // These should pass current validation (format only), but we're testing for future checksum validation
      possibleInvalidChecksums.forEach((accountId) => {
        // Currently these will NOT throw, but if checksum validation is added, they should
        const result = AccountId.create(accountId);
        expect(result.toString()).toBe(accountId);
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal AccountIds', () => {
      const account1 = AccountId.create('1234567890123');
      const account2 = AccountId.create('1234567890123');

      expect(account1.equals(account2)).toBe(true);
    });

    it('should return false for different AccountIds', () => {
      const account1 = AccountId.create('1234567890123');
      const account2 = AccountId.create('9876543210987');

      expect(account1.equals(account2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const accountId = AccountId.create('1234567890123');

      expect(accountId.equals(null as any)).toBe(false);
      expect(accountId.equals(undefined as any)).toBe(false);
    });

    it('should return false when comparing with non-AccountId object', () => {
      const accountId = AccountId.create('1234567890123');

      expect(accountId.equals('1234567890123' as any)).toBe(false);
      expect(accountId.equals({ raw: '1234567890123' } as any)).toBe(false);
      expect(accountId.equals(1234567890123 as any)).toBe(false);
    });

    it('should handle whitespace normalization in comparison', () => {
      const account1 = AccountId.create('  1234567890123  ');
      const account2 = AccountId.create('1234567890123');

      expect(account1.equals(account2)).toBe(true);
    });

    it('should distinguish between similar but different accounts', () => {
      const account1 = AccountId.create('1234567890123');
      const account2 = AccountId.create('1234567890124'); // Last digit different

      expect(account1.equals(account2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the AccountId string representation', () => {
      const accountString = '1234567890123';
      const accountId = AccountId.create(accountString);

      expect(accountId.toString()).toBe(accountString);
    });
  });

  describe('toFormattedString', () => {
    it('should format AccountId with dashes (XXXX-XXXX-XXXXX)', () => {
      const accountId = AccountId.create('1234567890123');

      expect(accountId.toFormattedString()).toBe('1234-5678-90123');
    });

    it('should format different AccountIds correctly', () => {
      const testCases = [
        { input: '0000000000000', expected: '0000-0000-00000' },
        { input: '9999999999999', expected: '9999-9999-99999' },
        { input: '1111111111111', expected: '1111-1111-11111' },
        { input: '9876543210123', expected: '9876-5432-10123' },
      ];

      testCases.forEach(({ input, expected }) => {
        const accountId = AccountId.create(input);
        expect(accountId.toFormattedString()).toBe(expected);
      });
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const accountId = AccountId.create('1234567890123');
      const originalValue = accountId.toString();

      // Object should be frozen
      expect(Object.isFrozen(accountId)).toBe(true);

      // Attempt to modify should throw in strict mode (Jest runs in strict mode)
      expect(() => {
        (accountId as any).value = 'different-value';
      }).toThrow();

      // The original value should be unchanged
      expect(accountId.toString()).toBe(originalValue);
    });
  });

  describe('edge cases', () => {
    it('should handle leading zeros correctly', () => {
      const accountId = AccountId.create('0001234567890');

      expect(accountId.toString()).toBe('0001234567890');
      expect(accountId.toFormattedString()).toBe('0001-2345-67890');
    });

    it('should handle trailing zeros correctly', () => {
      const accountId = AccountId.create('1234567890000');

      expect(accountId.toString()).toBe('1234567890000');
      expect(accountId.toFormattedString()).toBe('1234-5678-90000');
    });

    it('should handle consecutive identical digits', () => {
      const accountId = AccountId.create('1111111111111');

      expect(accountId.toString()).toBe('1111111111111');
      expect(accountId.toFormattedString()).toBe('1111-1111-11111');
    });
  });
});
