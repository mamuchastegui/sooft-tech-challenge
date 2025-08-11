// test/unit/value-objects/alias-account.vo.spec.ts

import { AliasAccount } from '../../../src/domain/value-objects/alias-account';
import { DomainError } from '../../../src/domain/errors/domain.error';

describe('AliasAccount Value Object', () => {
  describe('create', () => {
    it('should create a valid alias with lowercase normalization', () => {
      const validAlias = 'MY.WALLET';
      const alias = AliasAccount.create(validAlias);

      expect(alias).toBeInstanceOf(AliasAccount);
      expect(alias.toString()).toBe('my.wallet');
      expect(alias.raw).toBe('my.wallet');
    });

    it('should create alias with minimum length (6 characters)', () => {
      const alias = AliasAccount.create('wallet');
      expect(alias.toString()).toBe('wallet');
    });

    it('should create alias with maximum length (20 characters)', () => {
      const alias = AliasAccount.create('my.super.long.wall12'); // Exactly 20 chars
      expect(alias.toString()).toBe('my.super.long.wall12');
    });

    it('should accept alphanumeric characters', () => {
      const alias = AliasAccount.create('wallet123');
      expect(alias.toString()).toBe('wallet123');
    });

    it('should accept dots', () => {
      const alias = AliasAccount.create('my.wallet');
      expect(alias.toString()).toBe('my.wallet');
    });

    it('should accept underscores', () => {
      const alias = AliasAccount.create('my_wallet');
      expect(alias.toString()).toBe('my_wallet');
    });

    it('should accept hyphens', () => {
      const alias = AliasAccount.create('my-wallet');
      expect(alias.toString()).toBe('my-wallet');
    });

    it('should accept mixed valid characters', () => {
      const alias = AliasAccount.create('My.Wallet_123-Test');
      expect(alias.toString()).toBe('my.wallet_123-test');
    });

    it('should trim whitespace from input', () => {
      const aliasWithSpaces = '  my.wallet  ';
      const alias = AliasAccount.create(aliasWithSpaces);

      expect(alias.toString()).toBe('my.wallet');
    });

    it('should throw DomainError for null or undefined input', () => {
      expect(() => AliasAccount.create(null as any)).toThrow(DomainError);
      expect(() => AliasAccount.create(undefined as any)).toThrow(DomainError);
      expect(() => AliasAccount.create('')).toThrow(DomainError);
    });

    it('should throw DomainError for non-string input', () => {
      expect(() => AliasAccount.create(123456 as any)).toThrow(DomainError);
      expect(() => AliasAccount.create({} as any)).toThrow(DomainError);
      expect(() => AliasAccount.create([] as any)).toThrow(DomainError);
    });

    it('should throw DomainError for too short alias', () => {
      const tooShort = [
        'a', // 1 character
        'ab', // 2 characters
        'abc', // 3 characters
        'abcd', // 4 characters
        'abcde', // 5 characters
      ];

      tooShort.forEach((shortAlias) => {
        expect(() => AliasAccount.create(shortAlias)).toThrow(DomainError);
        expect(() => AliasAccount.create(shortAlias)).toThrow(
          /must be between 6 and 20 characters/,
        );
      });
    });

    it('should throw DomainError for too long alias', () => {
      const tooLong = [
        'abcdefghijklmnopqrstuv', // 21 characters
        'abcdefghijklmnopqrstuvwxyz', // 26 characters
        'a'.repeat(50), // 50 characters
      ];

      tooLong.forEach((longAlias) => {
        expect(() => AliasAccount.create(longAlias)).toThrow(DomainError);
        expect(() => AliasAccount.create(longAlias)).toThrow(
          /must be between 6 and 20 characters/,
        );
      });
    });

    it('should throw DomainError for invalid characters', () => {
      const invalidCharacters = [
        'my wallet', // Space
        'my@wallet', // @
        'my#wallet', // #
        'my$wallet', // $
        'my%wallet', // %
        'my&wallet', // &
        'my*wallet', // *
        'my+wallet', // +
        'my=wallet', // =
        'my!wallet', // !
        'my?wallet', // ?
        'my|wallet', // |
        'my\\wallet', // Backslash
        'my/wallet', // Forward slash
        'my<wallet', // <
        'my>wallet', // >
        'my(wallet)', // Parentheses
        'my[wallet]', // Brackets
        'my{wallet}', // Braces
        'my:wallet', // Colon
        'my;wallet', // Semicolon
        'my"wallet"', // Quotes
        "my'wallet'", // Single quotes
        'my,wallet', // Comma
        'my`wallet', // Backtick
        'my~wallet', // Tilde
        'my^wallet', // Caret
      ];

      invalidCharacters.forEach((invalidAlias) => {
        expect(() => AliasAccount.create(invalidAlias)).toThrow(DomainError);
        expect(() => AliasAccount.create(invalidAlias)).toThrow(
          /can only contain letters, numbers, dots, underscores, and hyphens/,
        );
      });
    });

    it('should throw DomainError for unicode characters', () => {
      const unicodeAliases = [
        'mywallet🏦', // Emoji
        'mywallé', // Accented character
        'mywalletñ', // Spanish ñ
        'mywallet中', // Chinese character
        'mywallet😀', // Emoji
      ];

      unicodeAliases.forEach((unicodeAlias) => {
        expect(() => AliasAccount.create(unicodeAlias)).toThrow(DomainError);
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal aliases', () => {
      const alias1 = AliasAccount.create('my.wallet');
      const alias2 = AliasAccount.create('my.wallet');

      expect(alias1.equals(alias2)).toBe(true);
    });

    it('should return false for different aliases', () => {
      const alias1 = AliasAccount.create('my.wallet');
      const alias2 = AliasAccount.create('your.wallet');

      expect(alias1.equals(alias2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const alias = AliasAccount.create('my.wallet');

      expect(alias.equals(null as any)).toBe(false);
      expect(alias.equals(undefined as any)).toBe(false);
    });

    it('should return false when comparing with non-AliasAccount object', () => {
      const alias = AliasAccount.create('my.wallet');

      expect(alias.equals('my.wallet' as any)).toBe(false);
      expect(alias.equals({ raw: 'my.wallet' } as any)).toBe(false);
      expect(alias.equals(123456 as any)).toBe(false);
    });

    it('should handle case insensitive comparison', () => {
      const alias1 = AliasAccount.create('MY.WALLET');
      const alias2 = AliasAccount.create('my.wallet');

      expect(alias1.equals(alias2)).toBe(true);
    });

    it('should handle whitespace normalization in comparison', () => {
      const alias1 = AliasAccount.create('  my.wallet  ');
      const alias2 = AliasAccount.create('my.wallet');

      expect(alias1.equals(alias2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the normalized alias string', () => {
      const alias = AliasAccount.create('MY.WALLET');

      expect(alias.toString()).toBe('my.wallet');
    });
  });

  describe('toMaskedString', () => {
    it('should mask short aliases (6-8 chars) showing first 2 and last 2', () => {
      const testCases = [
        { input: 'wallet', expected: 'wa**et' },
        { input: 'my.wall', expected: 'my***ll' },
        { input: 'test1234', expected: 'te****34' },
      ];

      testCases.forEach(({ input, expected }) => {
        const alias = AliasAccount.create(input);
        expect(alias.toMaskedString()).toBe(expected);
      });
    });

    it('should mask medium aliases (9-16 chars) showing quarter chars each side', () => {
      const testCases = [
        { input: 'my.wallet', expected: 'my*****et' }, // 9 chars: 2 + 5 + 2
        { input: 'test.wallet.1', expected: 'te*******1' }, // 13 chars: 3 + 7 + 3
        { input: 'user123_test', expected: 'us******st' }, // 12 chars: 3 + 6 + 3
      ];

      testCases.forEach(({ input, expected }) => {
        const alias = AliasAccount.create(input);
        expect(alias.toMaskedString()).toBe(expected);
      });
    });

    it('should mask long aliases (17-20 chars) showing quarter chars each side', () => {
      const testCases = [
        { input: 'my.super.long.wall12', expected: 'my.su**********ll12' }, // 20 chars: 5 + 10 + 5  
        { input: 'user.wallet.test.123', expected: 'user.**********23' }, // 20 chars: 5 + 10 + 5
        { input: 'very.long.alias.name', expected: 'very.**********me' }, // 20 chars: 5 + 10 + 5
      ];

      testCases.forEach(({ input, expected }) => {
        const alias = AliasAccount.create(input);
        expect(alias.toMaskedString()).toBe(expected);
      });
    });

    it('should handle edge case of exactly 4 characters visible (minimum mask)', () => {
      const alias = AliasAccount.create('test12'); // 6 chars, should show 2+2
      expect(alias.toMaskedString()).toBe('te**12');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const alias = AliasAccount.create('my.wallet');
      const originalValue = alias.toString();

      // Object should be frozen
      expect(Object.isFrozen(alias)).toBe(true);

      // Attempt to modify should throw in strict mode
      expect(() => {
        (alias as any).value = 'different-value';
      }).toThrow();

      // The original value should be unchanged
      expect(alias.toString()).toBe(originalValue);
    });
  });

  describe('edge cases', () => {
    it('should handle exactly 6 character alias', () => {
      const alias = AliasAccount.create('wallet');

      expect(alias.toString()).toBe('wallet');
      expect(alias.toMaskedString()).toBe('wa**et');
    });

    it('should handle exactly 20 character alias', () => {
      const alias = AliasAccount.create('my.super.long.wall12'); // Exactly 20 chars

      expect(alias.toString()).toBe('my.super.long.wall12');
      expect(alias.toMaskedString()).toBe('my.su**********ll12');
    });

    it('should handle all valid special characters', () => {
      const alias = AliasAccount.create('Test._-123');

      expect(alias.toString()).toBe('test._-123');
      expect(alias.toMaskedString()).toBe('te****23'); // 9 chars: 2 + 4 + 3 = 9
    });

    it('should handle consecutive dots', () => {
      const alias = AliasAccount.create('my..wallet');

      expect(alias.toString()).toBe('my..wallet');
      expect(alias.toMaskedString()).toBe('my****et'); // 10 chars: 2 + 6 + 2
    });

    it('should handle consecutive underscores', () => {
      const alias = AliasAccount.create('my__wallet');

      expect(alias.toString()).toBe('my__wallet');
      expect(alias.toMaskedString()).toBe('my****et');
    });

    it('should handle consecutive hyphens', () => {
      const alias = AliasAccount.create('my--wallet');

      expect(alias.toString()).toBe('my--wallet');
      expect(alias.toMaskedString()).toBe('my****et');
    });

    it('should handle mixed case input', () => {
      const alias = AliasAccount.create('MyWaLLeT.TeSt123');

      expect(alias.toString()).toBe('mywallet.test123');
      expect(alias.toMaskedString()).toBe('myw*******t123');
    });
  });

  describe('normalization', () => {
    it('should normalize to lowercase', () => {
      const testCases = [
        { input: 'MYWALLET', expected: 'mywallet' },
        { input: 'MyWallet', expected: 'mywallet' },
        { input: 'MY.WALLET', expected: 'my.wallet' },
        { input: 'My_Wallet', expected: 'my_wallet' },
        { input: 'MY-WALLET', expected: 'my-wallet' },
        { input: 'MiXeD.CaSe_123', expected: 'mixed.case_123' },
      ];

      testCases.forEach(({ input, expected }) => {
        const alias = AliasAccount.create(input);
        expect(alias.toString()).toBe(expected);
      });
    });

    it('should preserve valid characters after normalization', () => {
      const alias = AliasAccount.create('Test123._-ABC');

      expect(alias.toString()).toBe('test123._-abc');
    });
  });
});
