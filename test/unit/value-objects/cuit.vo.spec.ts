// test/unit/value-objects/cuit.vo.spec.ts

import { Cuit } from '../../../src/domain/value-objects/cuit';
import { DomainError } from '../../../src/domain/errors/domain.error';

describe('Cuit Value Object', () => {
  describe('create', () => {
    it('should create a valid CUIT with correct format and checksum', () => {
      const validCuit = '30-12345678-1'; // Valid CUIT with correct checksum
      const cuit = Cuit.create(validCuit);

      expect(cuit).toBeInstanceOf(Cuit);
      expect(cuit.toString()).toBe(validCuit);
      expect(cuit.raw).toBe(validCuit);
    });

    it('should create CUIT with different valid checksums', () => {
      const testCases = ['30-12345678-1', '20-11111111-2', '27-95555554-1'];

      testCases.forEach((cuitString) => {
        const cuit = Cuit.create(cuitString);
        expect(cuit.toString()).toBe(cuitString);
      });
    });

    it('should trim whitespace from input', () => {
      const cuitWithSpaces = '  30-12345678-1  ';
      const cuit = Cuit.create(cuitWithSpaces);

      expect(cuit.toString()).toBe('30-12345678-1');
    });

    it('should throw DomainError for null or undefined input', () => {
      expect(() => Cuit.create(null as any)).toThrow(DomainError);
      expect(() => Cuit.create(undefined as any)).toThrow(DomainError);
      expect(() => Cuit.create('' as any)).toThrow(DomainError);
    });

    it('should throw DomainError for non-string input', () => {
      expect(() => Cuit.create(123 as any)).toThrow(DomainError);
      expect(() => Cuit.create({} as any)).toThrow(DomainError);
      expect(() => Cuit.create([] as any)).toThrow(DomainError);
    });

    it('should throw DomainError for invalid format', () => {
      const invalidFormats = [
        '12345678901', // No dashes
        '123-4567890-1', // Wrong segment lengths
        '12-345678901', // Wrong segment lengths
        '12-3456789-01', // Wrong segment lengths
        'AB-12345678-9', // Letters in first segment
        '30-ABCDEFGH-9', // Letters in middle segment
        '30-12345678-X', // Letter in check digit
        '30-12345678', // Missing check digit
        '30-12345678-', // Missing check digit
        '30--12345678-9', // Double dash
      ];

      invalidFormats.forEach((invalidCuit) => {
        expect(() => Cuit.create(invalidCuit)).toThrow(DomainError);
      });
    });

    it('should throw DomainError for invalid checksum', () => {
      const invalidChecksums = [
        '30-12345678-0', // Wrong checksum (should be 1)
        '30-12345678-9', // Wrong checksum (should be 1)
        '30-12345678-8', // Wrong checksum (should be 1)
      ];

      invalidChecksums.forEach((invalidCuit) => {
        expect(() => Cuit.create(invalidCuit)).toThrow(DomainError);
      });
    });

    it('should throw DomainError for invalid DV (verification digit)', () => {
      // Test specific cases where DV calculation fails
      const invalidDVCases = [
        '20-12345678-5', // Should be 6
        '27-12345678-5', // Should be 0  
        '30-50123456-7', // Should be 3
        '33-55555555-4', // Should be 8
        '34-99999999-1', // Should be 6
      ];

      invalidDVCases.forEach((invalidCuit) => {
        expect(() => Cuit.create(invalidCuit)).toThrow(DomainError);
        expect(() => Cuit.create(invalidCuit)).toThrow(/Invalid CUIT checksum/);
      });
    });
  });

  describe('equals', () => {
    it('should return true for equal CUITs', () => {
      const cuit1 = Cuit.create('30-12345678-1');
      const cuit2 = Cuit.create('30-12345678-1');

      expect(cuit1.equals(cuit2)).toBe(true);
    });

    it('should return false for different CUITs', () => {
      const cuit1 = Cuit.create('30-12345678-1');
      const cuit2 = Cuit.create('20-11111111-2');

      expect(cuit1.equals(cuit2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const cuit = Cuit.create('30-12345678-1');

      expect(cuit.equals(null as any)).toBe(false);
      expect(cuit.equals(undefined as any)).toBe(false);
    });

    it('should return false when comparing with non-CUIT object', () => {
      const cuit = Cuit.create('30-12345678-1');

      expect(cuit.equals('30-12345678-1' as any)).toBe(false);
      expect(cuit.equals({ raw: '30-12345678-1' } as any)).toBe(false);
      expect(cuit.equals(123 as any)).toBe(false);
    });

    it('should handle whitespace normalization in comparison', () => {
      const cuit1 = Cuit.create('  30-12345678-1  ');
      const cuit2 = Cuit.create('30-12345678-1');

      expect(cuit1.equals(cuit2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return the CUIT string representation', () => {
      const cuitString = '30-12345678-1';
      const cuit = Cuit.create(cuitString);

      expect(cuit.toString()).toBe(cuitString);
    });
  });

  describe('checksum validation', () => {
    it('should handle special checksum cases (11 -> 0, 10 -> 9)', () => {
      // These are test cases where the algorithm produces 11 or 10
      // and should be converted to 0 or 9 respectively
      const specialCases = [
        '20-00000006-0', // Results in checksum 11 -> 0
        '20-00000001-9', // Results in checksum 10 -> 9
      ];

      specialCases.forEach((cuitString) => {
        expect(() => Cuit.create(cuitString)).not.toThrow();
      });
    });

    it('should validate checksum algorithm correctly', () => {
      // Test a few manually calculated CUITs
      const validCuits = [
        '20-12345678-6', // From our generator
        '27-12345678-0', // From our generator
        '30-50123456-3', // From our generator
      ];

      validCuits.forEach((cuitString) => {
        expect(() => Cuit.create(cuitString)).not.toThrow();
        const cuit = Cuit.create(cuitString);
        expect(cuit.toString()).toBe(cuitString);
      });
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const cuit = Cuit.create('30-12345678-1');
      const originalValue = cuit.toString();

      // Object should be frozen
      expect(Object.isFrozen(cuit)).toBe(true);

      // Attempt to modify should throw in strict mode (Jest runs in strict mode)
      expect(() => {
        (cuit as any).value = 'different-value';
      }).toThrow();

      // Value should remain unchanged
      expect(cuit.toString()).toBe(originalValue);
    });
  });
});
