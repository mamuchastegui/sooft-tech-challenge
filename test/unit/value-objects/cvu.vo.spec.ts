// test/unit/value-objects/cvu.vo.spec.ts

import { Cvu } from '../../../src/domain/value-objects/cvu';
import { DomainError } from '../../../src/domain/errors/domain.error';
import { VALID_TEST_ACCOUNTS, generateValidCvu } from '../../helpers/test-accounts.helper';

describe('CVU Value Object', () => {
  describe('create', () => {
    it('should create a valid CVU with proper control digits', () => {
      // Valid CVU with correct control digits
      const validCvu = VALID_TEST_ACCOUNTS.CVU_MERCADOPAGO;
      const cvu = Cvu.create(validCvu);

      expect(cvu).toBeInstanceOf(Cvu);
      expect(cvu.toString()).toBe(validCvu);
      expect(cvu.raw).toBe(validCvu);
    });

    it('should create CVU with all zeros (test case)', () => {
      const cvu = Cvu.create('0000000000000000000000');
      expect(cvu.toString()).toBe('0000000000000000000000');
    });

    it('should trim whitespace from input', () => {
      const cvuWithSpaces = '  0000003100010000000001  ';
      const cvu = Cvu.create(cvuWithSpaces);

      expect(cvu.toString()).toBe('0000003100010000000001');
    });

    it('should normalize hyphenated input', () => {
      const hyphenatedCvu = '000000310001000000-00-01';
      const cvu = Cvu.create(hyphenatedCvu);

      expect(cvu.toString()).toBe('0000003100010000000001');
    });

    it('should normalize spaced input', () => {
      const spacedCvu = '000 000 310 001 000 000 00 01';
      const cvu = Cvu.create(spacedCvu);

      expect(cvu.toString()).toBe('0000003100010000000001');
    });

    it('should throw DomainError for null or undefined input', () => {
      expect(() => Cvu.create(null as any)).toThrow(DomainError);
      expect(() => Cvu.create(undefined as any)).toThrow(DomainError);
      expect(() => Cvu.create('')).toThrow(DomainError);
    });

    it('should throw DomainError for non-string input', () => {
      expect(() => Cvu.create(31000100000000001 as any)).toThrow(DomainError);
      expect(() => Cvu.create({} as any)).toThrow(DomainError);
      expect(() => Cvu.create([] as any)).toThrow(DomainError);
    });

    it('should throw DomainError for wrong length', () => {
      const wrongLengths = [
        '000000310001000000001', // 21 digits
        '00000031000100000000011', // 23 digits
        '0000003100010000000', // 19 digits
        '000000310001000000001234', // 24 digits
        '1', // 1 digit
        '', // 0 digits
      ];

      wrongLengths.forEach((wrongLength) => {
        expect(() => Cvu.create(wrongLength)).toThrow(DomainError);
        expect(() => Cvu.create(wrongLength)).toThrow(
          /must be exactly 22 digits/,
        );
      });
    });

    it('should throw DomainError for non-numeric characters', () => {
      const invalidCvus = [
        'A000003100010000000001', // Letter at start
        '000000310001000000000A', // Letter at end
        '000000-31001000000000A', // Contains hyphen after normalization
        '0000003100010000000.01', // Decimal point
        '000000310001000000000 1', // Space at end
      ];

      invalidCvus.forEach((invalidCvu) => {
        expect(() => Cvu.create(invalidCvu)).toThrow(DomainError);
      });
    });

    it('should throw DomainError for invalid control digits', () => {
      // Test cases with incorrect control digits (CVU-specific checksum failure)
      const invalidControlDigits = [
        '0000003100010000000000', // Last digit wrong
        '0000003100010000000002', // Last digit wrong
        '0000003100010000000011', // Last two digits wrong
        '0000003100010000000099', // Last two digits wrong
      ];

      invalidControlDigits.forEach((invalidCvu) => {
        expect(() => Cvu.create(invalidCvu)).toThrow(DomainError);
        expect(() => Cvu.create(invalidCvu)).toThrow(
          /Invalid CVU control digits/,
        );
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal CVUs', () => {
      const cvu1 = Cvu.create('0000003100010000000001');
      const cvu2 = Cvu.create('0000003100010000000001');

      expect(cvu1.equals(cvu2)).toBe(true);
    });

    it('should return false for different CVUs', () => {
      const cvu1 = Cvu.create('0000003100010000000001');
      const cvu2 = Cvu.create('0000000000000000000000');

      expect(cvu1.equals(cvu2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const cvu = Cvu.create('0000003100010000000001');

      expect(cvu.equals(null as any)).toBe(false);
      expect(cvu.equals(undefined as any)).toBe(false);
    });

    it('should return false when comparing with non-CVU object', () => {
      const cvu = Cvu.create('0000003100010000000001');

      expect(cvu.equals('0000003100010000000001' as any)).toBe(false);
      expect(cvu.equals({ raw: '0000003100010000000001' } as any)).toBe(false);
      expect(cvu.equals(3100010000000001 as any)).toBe(false);
    });

    it('should handle whitespace normalization in comparison', () => {
      const cvu1 = Cvu.create('  0000003100010000000001  ');
      const cvu2 = Cvu.create('0000003100010000000001');

      expect(cvu1.equals(cvu2)).toBe(true);
    });

    it('should handle format normalization in comparison', () => {
      const cvu1 = Cvu.create('000 000 310 001 000 000 00 01');
      const cvu2 = Cvu.create('0000003100010000000001');

      expect(cvu1.equals(cvu2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the normalized CVU string', () => {
      const cvu = Cvu.create('0000003100010000000001');

      expect(cvu.toString()).toBe('0000003100010000000001');
    });
  });

  describe('toFormattedString', () => {
    it('should format CVU with spaces (XXXX XXXX XXXX XXXX XXXX XX)', () => {
      const cvu = Cvu.create('0000003100010000000001');

      expect(cvu.toFormattedString()).toBe('0000 0031 0001 0000 0000 01');
    });

    it('should format different CVUs correctly', () => {
      const testCases = [
        {
          input: '0000000000000000000000',
          expected: '0000 0000 0000 0000 0000 00',
        },
        {
          input: '1111111111111111111111',
          expected: '1111 1111 1111 1111 1111 11',
        },
        {
          input: '9999999999999999999999',
          expected: '9999 9999 9999 9999 9999 99',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const cvu = Cvu.create(input);
        expect(cvu.toFormattedString()).toBe(expected);
      });
    });
  });

  describe('toMaskedString', () => {
    it('should mask CVU keeping first 3 and last 3 digits', () => {
      const cvu = Cvu.create('0000003100010000000001');

      expect(cvu.toMaskedString()).toBe('000***************001');
    });

    it('should mask different CVUs correctly', () => {
      const testCases = [
        { input: '0000000000000000000000', expected: '000***************000' },
        { input: '1111111111111111111111', expected: '111***************111' },
        { input: '9999999999999999999999', expected: '999***************999' },
      ];

      testCases.forEach(({ input, expected }) => {
        const cvu = Cvu.create(input);
        expect(cvu.toMaskedString()).toBe(expected);
      });
    });
  });

  describe('getEntityCode', () => {
    it('should extract entity code (first 4 digits)', () => {
      const cvu = Cvu.create('0000003100010000000001');

      expect(cvu.getEntityCode()).toBe('0000');
    });

    it('should extract entity code for different entities', () => {
      const testCases = [
        { cvu: '0000003100010000000001', expected: '0000' }, // MercadoPago
        { cvu: '0000070100010000000002', expected: '0000' }, // Different provider
        { cvu: '1234567890123456789012', expected: '1234' }, // Hypothetical
      ];

      testCases.forEach(({ cvu, expected }) => {
        const cvuObject = Cvu.create(cvu);
        expect(cvuObject.getEntityCode()).toBe(expected);
      });
    });
  });

  describe('getAccountIdentifier', () => {
    it('should extract account identifier (digits 5-20)', () => {
      const cvu = Cvu.create('0000003100010000000001');

      expect(cvu.getAccountIdentifier()).toBe('0031000100000000');
    });
  });

  describe('getControlDigits', () => {
    it('should extract control digits (last 2 digits)', () => {
      const cvu = Cvu.create('0000003100010000000001');

      expect(cvu.getControlDigits()).toBe('01');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const cvu = Cvu.create('0000003100010000000001');
      const originalValue = cvu.toString();

      // Object should be frozen
      expect(Object.isFrozen(cvu)).toBe(true);

      // Attempt to modify should throw in strict mode
      expect(() => {
        (cvu as any).value = 'different-value';
      }).toThrow();

      // The original value should be unchanged
      expect(cvu.toString()).toBe(originalValue);
    });
  });

  describe('edge cases', () => {
    it('should handle leading zeros correctly', () => {
      const cvu = Cvu.create('0000001234567890123456');

      expect(cvu.toString()).toBe('0000001234567890123456');
      expect(cvu.getEntityCode()).toBe('0000');
    });

    it('should handle consecutive identical digits', () => {
      const cvu = Cvu.create('1111111111111111111111');

      expect(cvu.toString()).toBe('1111111111111111111111');
      expect(cvu.getEntityCode()).toBe('1111');
      expect(cvu.getControlDigits()).toBe('11');
    });
  });

  describe('checksum validation', () => {
    it('should validate entity code control digit (first part)', () => {
      // CVU structure: [4 digits entity][16 digits account][2 control digits]
      const validEntityCodes = [
        '0000', // MercadoPago
        '0001', // Other provider
        '9999', // Test case
      ];

      validEntityCodes.forEach((entityPrefix) => {
        const testCvu = entityPrefix + '000000000000000000'; // Pad to 22 digits
        // This test assumes the control digit calculation is correct
        expect(() => Cvu.create(testCvu)).not.toThrow();
      });
    });

    it('should validate account section control digits', () => {
      // Test that the last 2 digits are valid control digits for the preceding 20 digits
      const validCvus = [
        '0000003100010000000001',
        '0000000000000000000000', // Special case: all zeros
      ];

      validCvus.forEach((cvuString) => {
        expect(() => Cvu.create(cvuString)).not.toThrow();
        const cvu = Cvu.create(cvuString);
        expect(cvu.toString()).toBe(cvuString);
      });
    });
  });

  describe('CVU vs CBU differentiation', () => {
    it('should be distinguishable from CBU through entity codes', () => {
      // CVUs typically start with 0000 for digital wallets
      // CBUs typically start with bank codes (like 285 for Macro)
      const cvu = Cvu.create('0000003100010000000001');
      expect(cvu.getEntityCode()).toBe('0000');

      // This differentiates it from bank codes that are typically 3 digits + 1 control
    });

    it('should handle MercadoPago CVU format', () => {
      const mercadoPagoCvu = '0000003100010000000001';
      const cvu = Cvu.create(mercadoPagoCvu);

      expect(cvu.getEntityCode()).toBe('0000');
      expect(cvu.toString()).toBe(mercadoPagoCvu);
      expect(cvu.toMaskedString()).toBe('000***************001');
    });
  });
});
