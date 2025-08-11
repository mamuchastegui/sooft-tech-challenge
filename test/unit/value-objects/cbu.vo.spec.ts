// test/unit/value-objects/cbu.vo.spec.ts

import { Cbu } from '../../../src/domain/value-objects/cbu';
import { DomainError } from '../../../src/domain/errors/domain.error';
import { VALID_TEST_ACCOUNTS, generateValidCbu } from '../../helpers/test-accounts.helper';

describe('CBU Value Object', () => {
  describe('create', () => {
    it('should create a valid CBU with proper control digits', () => {
      // Valid CBU with correct control digits
      const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
      const cbu = Cbu.create(validCbu);

      expect(cbu).toBeInstanceOf(Cbu);
      expect(cbu.toString()).toBe(validCbu);
      expect(cbu.raw).toBe(validCbu);
    });

    it('should create different valid CBUs', () => {
      const cbuNacion = Cbu.create(VALID_TEST_ACCOUNTS.CBU_BANCO_NACION);
      const cbuGalicia = Cbu.create(VALID_TEST_ACCOUNTS.CBU_GALICIA);
      
      expect(cbuNacion.toString()).toBe(VALID_TEST_ACCOUNTS.CBU_BANCO_NACION);
      expect(cbuGalicia.toString()).toBe(VALID_TEST_ACCOUNTS.CBU_GALICIA);
    });

    it('should trim whitespace from input', () => {
      const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
      const cbuWithSpaces = `  ${validCbu}  `;
      const cbu = Cbu.create(cbuWithSpaces);

      expect(cbu.toString()).toBe(validCbu);
    });

    it('should normalize hyphenated input', () => {
      const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
      const hyphenatedCbu = validCbu.slice(0, 18) + '-' + validCbu.slice(18, 20) + '-' + validCbu.slice(20);
      const cbu = Cbu.create(hyphenatedCbu);

      expect(cbu.toString()).toBe(validCbu);
    });

    it('should normalize spaced input', () => {
      const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
      const spacedCbu = validCbu.match(/.{1,3}/g)?.join(' ') || validCbu;
      const cbu = Cbu.create(spacedCbu);

      expect(cbu.toString()).toBe(validCbu);
    });

    it('should throw DomainError for null or undefined input', () => {
      expect(() => Cbu.create(null as any)).toThrow(DomainError);
      expect(() => Cbu.create(undefined as any)).toThrow(DomainError);
      expect(() => Cbu.create('')).toThrow(DomainError);
    });

    it('should throw DomainError for non-string input', () => {
      expect(() => Cbu.create(123 as any)).toThrow(DomainError);
      expect(() => Cbu.create({} as any)).toThrow(DomainError);
      expect(() => Cbu.create([] as any)).toThrow(DomainError);
    });

    it('should throw DomainError for wrong length', () => {
      const wrongLengths = [
        '285059094009041813520', // 21 digits
        VALID_TEST_ACCOUNTS.CBU_MACRO + '1', // 23 digits
        '2850590940090418135', // 19 digits
        VALID_TEST_ACCOUNTS.CBU_MACRO + '23', // 24 digits
        '1', // 1 digit
      ];

      wrongLengths.forEach((wrongLength) => {
        expect(() => Cbu.create(wrongLength)).toThrow(DomainError);
        expect(() => Cbu.create(wrongLength)).toThrow(
          /must be exactly 22 digits/,
        );
      });
    });

    it('should throw DomainError for non-numeric characters', () => {
      const invalidCbus = [
        'A850590940090418135201', // Letter at start
        '285059094009041813520A', // Letter at end
        '285059-94009041813520A', // Contains hyphen after normalization
        '2850590940090418135.01', // Decimal point
        '285059094009041813520 1', // Space at end
      ];

      invalidCbus.forEach((invalidCbu) => {
        expect(() => Cbu.create(invalidCbu)).toThrow(DomainError);
      });
    });

    it('should throw DomainError for invalid control digits', () => {
      // Test cases with incorrect control digits (mod 10 checksum failure)
      const invalidControlDigits = [
        '2850590940090418135200', // Last digit wrong
        '2850590940090418135202', // Last digit wrong
        '2850590940090418135211', // Last two digits wrong
        '2850590940090418135299', // Last two digits wrong
      ];

      invalidControlDigits.forEach((invalidCbu) => {
        expect(() => Cbu.create(invalidCbu)).toThrow(DomainError);
        expect(() => Cbu.create(invalidCbu)).toThrow(
          /CBU has invalid control digits/,
        );
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal CBUs', () => {
      const cbu1 = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const cbu2 = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);

      expect(cbu1.equals(cbu2)).toBe(true);
    });

    it('should return false for different CBUs', () => {
      const cbu1 = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const cbu2 = Cbu.create(VALID_TEST_ACCOUNTS.CBU_BANCO_NACION);

      expect(cbu1.equals(cbu2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);

      expect(cbu.equals(null as any)).toBe(false);
      expect(cbu.equals(undefined as any)).toBe(false);
    });

    it('should return false when comparing with non-CBU object', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);

      expect(cbu.equals(VALID_TEST_ACCOUNTS.CBU_MACRO as any)).toBe(false);
      expect(cbu.equals({ raw: VALID_TEST_ACCOUNTS.CBU_MACRO } as any)).toBe(false);
      expect(cbu.equals('invalid' as any)).toBe(false);
    });

    it('should handle whitespace normalization in comparison', () => {
      const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
      const cbu1 = Cbu.create(`  ${validCbu}  `);
      const cbu2 = Cbu.create(validCbu);

      expect(cbu1.equals(cbu2)).toBe(true);
    });

    it('should handle format normalization in comparison', () => {
      const validCbu = VALID_TEST_ACCOUNTS.CBU_MACRO;
      // Create spaced version of the valid CBU
      const spacedCbu = validCbu.match(/.{1,4}/g)?.join(' ') || validCbu;
      const cbu1 = Cbu.create(spacedCbu);
      const cbu2 = Cbu.create(validCbu);

      expect(cbu1.equals(cbu2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the normalized CBU string', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);

      expect(cbu.toString()).toBe(VALID_TEST_ACCOUNTS.CBU_MACRO);
    });
  });

  describe('toFormattedString', () => {
    it('should format CBU with dashes (XXX-XXXXXX-XXXXXXXXXXX-XX)', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const formatted = cbu.toFormattedString();
      
      // Should have dashes in correct positions
      expect(formatted).toMatch(/^\d{3}-\d{6}-\d{11}-\d{2}$/);
      // Should maintain same content when dashes are removed
      expect(formatted.replace(/-/g, '')).toBe(VALID_TEST_ACCOUNTS.CBU_MACRO);
    });

    it('should format different valid CBUs correctly', () => {
      const testCases = [
        VALID_TEST_ACCOUNTS.CBU_BANCO_NACION,
        VALID_TEST_ACCOUNTS.CBU_GALICIA,
        VALID_TEST_ACCOUNTS.CBU_SANTANDER,
      ];

      testCases.forEach((cbuValue) => {
        const cbu = Cbu.create(cbuValue);
        const formatted = cbu.toFormattedString();
        
        // Should match pattern
        expect(formatted).toMatch(/^\d{3}-\d{6}-\d{11}-\d{2}$/);
        // Should maintain same content when dashes are removed
        expect(formatted.replace(/-/g, '')).toBe(cbuValue);
      });
    });
  });

  describe('toMaskedString', () => {
    it('should mask CBU keeping first 3 and last 3 digits', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const masked = cbu.toMaskedString();
      const original = VALID_TEST_ACCOUNTS.CBU_MACRO;

      expect(masked).toBe(original.slice(0, 3) + '*'.repeat(16) + original.slice(-3));
    });

    it('should mask different valid CBUs correctly', () => {
      const testCases = [
        VALID_TEST_ACCOUNTS.CBU_BANCO_NACION,
        VALID_TEST_ACCOUNTS.CBU_GALICIA,
        VALID_TEST_ACCOUNTS.CBU_SANTANDER,
      ];

      testCases.forEach((cbuValue) => {
        const cbu = Cbu.create(cbuValue);
        const masked = cbu.toMaskedString();
        const expectedMask = cbuValue.slice(0, 3) + '*'.repeat(16) + cbuValue.slice(-3);
        
        expect(masked).toBe(expectedMask);
      });
    });
  });

  describe('getBankCode', () => {
    it('should extract bank code (first 3 digits)', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const bankCode = cbu.getBankCode();

      expect(bankCode).toBe(VALID_TEST_ACCOUNTS.CBU_MACRO.slice(0, 3));
      expect(bankCode).toHaveLength(3);
      expect(/^\d{3}$/.test(bankCode)).toBe(true);
    });

    it('should extract bank code for different banks', () => {
      const testCases = [
        { cbu: VALID_TEST_ACCOUNTS.CBU_BANCO_NACION, expectedPrefix: '017' },
        { cbu: VALID_TEST_ACCOUNTS.CBU_MACRO, expectedPrefix: '285' },
        { cbu: VALID_TEST_ACCOUNTS.CBU_GALICIA, expectedPrefix: '007' },
        { cbu: VALID_TEST_ACCOUNTS.CBU_SANTANDER, expectedPrefix: '072' },
      ];

      testCases.forEach(({ cbu, expectedPrefix }) => {
        const cbuObject = Cbu.create(cbu);
        const bankCode = cbuObject.getBankCode();
        
        expect(bankCode).toBe(expectedPrefix);
        expect(bankCode).toHaveLength(3);
      });
    });
  });

  describe('getAccountIdentifier', () => {
    it('should extract account identifier (digits 4-20)', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const expectedAccount = VALID_TEST_ACCOUNTS.CBU_MACRO.substring(4, 20);

      expect(cbu.getAccountIdentifier()).toBe(expectedAccount);
    });
  });

  describe('getControlDigits', () => {
    it('should extract control digits (last 2 digits)', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const expectedControlDigits = VALID_TEST_ACCOUNTS.CBU_MACRO.substring(20, 22);

      expect(cbu.getControlDigits()).toBe(expectedControlDigits);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_MACRO);
      const originalValue = cbu.toString();

      // Object should be frozen
      expect(Object.isFrozen(cbu)).toBe(true);

      // Attempt to modify should throw in strict mode
      expect(() => {
        (cbu as any).value = 'different-value';
      }).toThrow();

      // The original value should be unchanged
      expect(cbu.toString()).toBe(originalValue);
    });
  });

  describe('edge cases', () => {
    it('should handle leading zeros correctly', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_BANCO_NACION); // Bank code starts with '017'

      expect(cbu.toString()).toBe(VALID_TEST_ACCOUNTS.CBU_BANCO_NACION);
      expect(cbu.getBankCode()).toBe('017');
    });

    it('should handle different bank codes correctly', () => {
      const cbu = Cbu.create(VALID_TEST_ACCOUNTS.CBU_SANTANDER);

      expect(cbu.toString()).toBe(VALID_TEST_ACCOUNTS.CBU_SANTANDER);
      expect(cbu.getBankCode()).toBe('072');
      expect(cbu.getControlDigits()).toBe(VALID_TEST_ACCOUNTS.CBU_SANTANDER.slice(-2));
    });
  });

  describe('checksum validation', () => {
    it('should validate bank code control digit (first part)', () => {
      // CBU structure: [3 digits bank][1 control][16 digits account][2 control digits]
      // The 4th digit is control for first 3 digits
      const validCbus = [
        VALID_TEST_ACCOUNTS.CBU_BANCO_NACION, // Bank code '017' with valid control
        VALID_TEST_ACCOUNTS.CBU_MACRO, // Bank code '285' with valid control
        VALID_TEST_ACCOUNTS.CBU_SANTANDER, // Bank code '072' with valid control
      ];

      validCbus.forEach((cbuString) => {
        expect(() => Cbu.create(cbuString)).not.toThrow();
        const cbu = Cbu.create(cbuString);
        expect(cbu.getBankCode()).toBe(cbuString.substring(0, 3));
      });
    });

    it('should validate account section control digits', () => {
      // Test that the last 2 digits are valid control digits for the preceding 20 digits
      const validCbus = [
        VALID_TEST_ACCOUNTS.CBU_MACRO,
        VALID_TEST_ACCOUNTS.CBU_GALICIA,
        VALID_TEST_ACCOUNTS.CBU_SANTANDER,
      ];

      validCbus.forEach((cbuString) => {
        expect(() => Cbu.create(cbuString)).not.toThrow();
        const cbu = Cbu.create(cbuString);
        expect(cbu.toString()).toBe(cbuString);
      });
    });
  });
});
