// test/unit/infrastructure/date.provider.spec.ts

import { DateProvider } from '../../../src/infrastructure/providers/date.provider';

describe('DateProvider', () => {
  let dateProvider: DateProvider;

  beforeEach(() => {
    dateProvider = new DateProvider();
  });

  describe('now', () => {
    it('should return current date', () => {
      const before = new Date();
      const result = dateProvider.now();
      const after = new Date();

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('parseISO', () => {
    it('should parse valid ISO string', () => {
      const isoString = '2023-12-01T10:30:00Z';
      const result = dateProvider.parseISO(isoString);

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2023-12-01T10:30:00.000Z');
    });

    it('should throw error for invalid date string', () => {
      expect(() => {
        dateProvider.parseISO('invalid-date');
      }).toThrow('Invalid date format: invalid-date');
    });
  });

  describe('isValidISOString', () => {
    it('should return true for valid ISO string', () => {
      expect(dateProvider.isValidISOString('2023-12-01T10:30:00Z')).toBe(true);
    });

    it('should return false for invalid ISO string', () => {
      expect(dateProvider.isValidISOString('invalid-date')).toBe(false);
      expect(dateProvider.isValidISOString('2023-12-01')).toBe(false);
    });
  });
});