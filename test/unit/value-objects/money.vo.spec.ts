// test/unit/value-objects/money.vo.spec.ts

import { Money } from '../../../src/domain/value-objects/money';
import { DomainError } from '../../../src/domain/errors/domain.error';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create Money from valid number', () => {
      const money = Money.create(100.5);

      expect(money).toBeInstanceOf(Money);
      expect(money.toNumber()).toBe(100.5);
      expect(money.toString()).toBe('100.50');
      expect(money.getCurrency()).toBe('ARS');
      expect(money.getCents()).toBe(10050n);
    });

    it('should create Money from valid string', () => {
      const money = Money.create('100.50');

      expect(money.toNumber()).toBe(100.5);
      expect(money.toString()).toBe('100.50');
    });

    it('should create Money from integer', () => {
      const money = Money.create(100);

      expect(money.toNumber()).toBe(100);
      expect(money.toString()).toBe('100.00');
    });

    it('should create Money from zero', () => {
      const money = Money.create(0);

      expect(money.toNumber()).toBe(0);
      expect(money.toString()).toBe('0.00');
    });

    it('should create zero Money using static method', () => {
      const money = Money.zero();

      expect(money.toNumber()).toBe(0);
      expect(money.toString()).toBe('0.00');
      expect(money.getCurrency()).toBe('ARS');
    });

    it('should round to 2 decimal places', () => {
      const testCases = [
        { input: 100.999, expected: 101.0 },
        { input: 100.994, expected: 100.99 },
        { input: 100.995, expected: 101.0 },
        { input: 0.999, expected: 1.0 },
        { input: 0.001, expected: 0.0 },
      ];

      testCases.forEach(({ input, expected }) => {
        const money = Money.create(input);
        expect(money.toNumber()).toBe(expected);
      });
    });

    it('should throw DomainError for null or undefined', () => {
      expect(() => Money.create(null as any)).toThrow(DomainError);
      expect(() => Money.create(undefined as any)).toThrow(DomainError);
    });

    it('should throw DomainError for invalid string', () => {
      const invalidStrings = [
        'not-a-number',
        'abc',
        '',
        '100.50.50', // Multiple decimal points
        '100,50', // Comma instead of dot
      ];

      invalidStrings.forEach((invalid) => {
        expect(() => Money.create(invalid)).toThrow(DomainError);
      });
    });

    it('should throw DomainError for negative amounts', () => {
      expect(() => Money.create(-1)).toThrow(DomainError);
      expect(() => Money.create(-100.5)).toThrow(DomainError);
      expect(() => Money.create('-10.25')).toThrow(DomainError);
    });

    it('should throw DomainError for infinite values', () => {
      expect(() => Money.create(Infinity)).toThrow(DomainError);
      expect(() => Money.create(-Infinity)).toThrow(DomainError);
      expect(() => Money.create(NaN)).toThrow(DomainError);
    });
  });

  describe('arithmetic operations', () => {
    describe('add', () => {
      it('should add two Money amounts', () => {
        const money1 = Money.create(100.25);
        const money2 = Money.create(50.75);
        const result = money1.add(money2);

        expect(result.toNumber()).toBe(151.0);
        expect(result.toString()).toBe('151.00');
      });

      it('should handle adding zero', () => {
        const money = Money.create(100.5);
        const zero = Money.zero();
        const result = money.add(zero);

        expect(result.toNumber()).toBe(100.5);
      });

      it('should handle decimal precision correctly', () => {
        const money1 = Money.create(0.1);
        const money2 = Money.create(0.2);
        const result = money1.add(money2);

        // Should be rounded to 2 decimal places, avoiding floating point precision issues
        expect(result.toNumber()).toBe(0.3);
        expect(result.toString()).toBe('0.30');
      });
    });

    describe('subtract', () => {
      it('should subtract two Money amounts', () => {
        const money1 = Money.create(100.75);
        const money2 = Money.create(50.25);
        const result = money1.subtract(money2);

        expect(result.toNumber()).toBe(50.5);
        expect(result.toString()).toBe('50.50');
      });

      it('should handle subtracting zero', () => {
        const money = Money.create(100.5);
        const zero = Money.zero();
        const result = money.subtract(zero);

        expect(result.toNumber()).toBe(100.5);
      });

      it('should throw DomainError for negative result', () => {
        const money1 = Money.create(50.0);
        const money2 = Money.create(100.0);

        expect(() => money1.subtract(money2)).toThrow(DomainError);
        expect(() => money1.subtract(money2)).toThrow(/cannot be negative/);
      });

      it('should throw DomainError for near-negative result due to precision', () => {
        const money1 = Money.create(100.01);
        const money2 = Money.create(100.02);

        // This should result in a negative value after rounding
        expect(() => money1.subtract(money2)).toThrow(DomainError);
      });

      it('should handle exact subtraction to zero', () => {
        const money1 = Money.create(100.0);
        const money2 = Money.create(100.0);
        const result = money1.subtract(money2);

        expect(result.toNumber()).toBe(0);
        expect(result.toString()).toBe('0.00');
      });
    });

    describe('multiply', () => {
      it('should multiply Money by positive factor', () => {
        const money = Money.create(100.0);
        const result = money.multiply(1.5);

        expect(result.toNumber()).toBe(150.0);
        expect(result.toString()).toBe('150.00');
      });

      it('should multiply by zero', () => {
        const money = Money.create(100.0);
        const result = money.multiply(0);

        expect(result.toNumber()).toBe(0);
        expect(result.toString()).toBe('0.00');
      });

      it('should multiply by one', () => {
        const money = Money.create(100.5);
        const result = money.multiply(1);

        expect(result.toNumber()).toBe(100.5);
      });

      it('should handle decimal factors with precision', () => {
        const money = Money.create(100.0);
        const result = money.multiply(0.125);

        expect(result.toNumber()).toBe(12.5);
      });

      it('should throw DomainError for negative factor', () => {
        const money = Money.create(100.0);

        expect(() => money.multiply(-1)).toThrow(DomainError);
        expect(() => money.multiply(-0.5)).toThrow(DomainError);
      });

      it('should throw DomainError for infinite factor', () => {
        const money = Money.create(100.0);

        expect(() => money.multiply(Infinity)).toThrow(DomainError);
        expect(() => money.multiply(-Infinity)).toThrow(DomainError);
        expect(() => money.multiply(NaN)).toThrow(DomainError);
      });
    });
  });

  describe('comparison operations', () => {
    describe('isGreaterThan', () => {
      it('should return true when amount is greater', () => {
        const money1 = Money.create(100.0);
        const money2 = Money.create(50.0);

        expect(money1.isGreaterThan(money2)).toBe(true);
        expect(money2.isGreaterThan(money1)).toBe(false);
      });

      it('should return false for equal amounts', () => {
        const money1 = Money.create(100.0);
        const money2 = Money.create(100.0);

        expect(money1.isGreaterThan(money2)).toBe(false);
      });
    });

    describe('isLessThan', () => {
      it('should return true when amount is less', () => {
        const money1 = Money.create(50.0);
        const money2 = Money.create(100.0);

        expect(money1.isLessThan(money2)).toBe(true);
        expect(money2.isLessThan(money1)).toBe(false);
      });

      it('should return false for equal amounts', () => {
        const money1 = Money.create(100.0);
        const money2 = Money.create(100.0);

        expect(money1.isLessThan(money2)).toBe(false);
      });
    });

    describe('equals', () => {
      it('should return true for equal amounts', () => {
        const money1 = Money.create(100.5);
        const money2 = Money.create(100.5);

        expect(money1.equals(money2)).toBe(true);
      });

      it('should return false for different amounts', () => {
        const money1 = Money.create(100.5);
        const money2 = Money.create(100.51);

        expect(money1.equals(money2)).toBe(false);
      });

      it('should return false when comparing with null or undefined', () => {
        const money = Money.create(100.5);

        expect(money.equals(null as any)).toBe(false);
        expect(money.equals(undefined as any)).toBe(false);
      });

      it('should return false when comparing with non-Money object', () => {
        const money = Money.create(100.5);

        expect(money.equals(100.5 as any)).toBe(false);
        expect(money.equals('100.50' as any)).toBe(false);
        expect(money.equals({ amount: 100.5 } as any)).toBe(false);
      });

      it('should handle floating point precision correctly', () => {
        const money1 = Money.create(0.1 + 0.2); // JavaScript floating point issue
        const money2 = Money.create(0.3);

        expect(money1.equals(money2)).toBe(true);
      });
    });
  });

  describe('formatting', () => {
    describe('toString', () => {
      it('should format with 2 decimal places', () => {
        const testCases = [
          { input: 100, expected: '100.00' },
          { input: 100.5, expected: '100.50' },
          { input: 100.99, expected: '100.99' },
          { input: 0, expected: '0.00' },
          { input: 0.01, expected: '0.01' },
        ];

        testCases.forEach(({ input, expected }) => {
          const money = Money.create(input);
          expect(money.toString()).toBe(expected);
        });
      });
    });

    describe('toCurrencyString', () => {
      it('should format with default currency symbol ($)', () => {
        const money = Money.create(1234.56);

        expect(money.toCurrencyString()).toBe('$1,234.56');
      });

      it('should format with custom currency symbol', () => {
        const money = Money.create(1234.56);

        expect(money.toCurrencyString('€')).toBe('€1,234.56');
        expect(money.toCurrencyString('£')).toBe('£1,234.56');
      });

      it('should format large amounts with thousands separators', () => {
        const money = Money.create(1000000.99);

        expect(money.toCurrencyString()).toBe('$1,000,000.99');
      });

      it('should format small amounts correctly', () => {
        const money = Money.create(0.99);

        expect(money.toCurrencyString()).toBe('$0.99');
      });
    });
  });

  describe('immutability', () => {
    it('should be immutable - operations return new instances', () => {
      const original = Money.create(100.0);
      const added = original.add(Money.create(50.0));

      expect(original.toNumber()).toBe(100.0);
      expect(added.toNumber()).toBe(150.0);
      expect(original).not.toBe(added);
    });

    it('should prevent modification of internal state', () => {
      const money = Money.create(100.0);
      const originalAmount = money.toNumber();

      // Object should be frozen
      expect(Object.isFrozen(money)).toBe(true);

      // Attempt to modify should throw in strict mode (Jest runs in strict mode)
      expect(() => {
        (money as any).amount = 200.0;
      }).toThrow();

      // The original amount should be unchanged
      expect(money.toNumber()).toBe(originalAmount);
    });
  });

  describe('edge cases', () => {
    it('should handle very small amounts', () => {
      const money = Money.create(0.01);

      expect(money.toNumber()).toBe(0.01);
      expect(money.toString()).toBe('0.01');
    });

    it('should handle large amounts', () => {
      const money = Money.create(999999999.99);

      expect(money.toNumber()).toBe(999999999.99);
      expect(money.toString()).toBe('999999999.99');
    });

    it('should handle operations with very small differences', () => {
      const money1 = Money.create(100.001);
      const money2 = Money.create(100.002);

      // Both should round to 100.00
      expect(money1.toString()).toBe('100.00');
      expect(money2.toString()).toBe('100.00');
      expect(money1.equals(money2)).toBe(true);
    });
  });
});
