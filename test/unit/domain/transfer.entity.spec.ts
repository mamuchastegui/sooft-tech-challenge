// test/unit/domain/transfer.entity.spec.ts

import { Transfer } from '../../../src/domain/entities/transfer.entity';

describe('Transfer Entity', () => {
  describe('constructor', () => {
    it('should create a valid transfer', () => {
      const createdAt = new Date();

      const transfer = new Transfer(
        '1',
        1000.5,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        createdAt,
      );

      expect(transfer.id).toBe('1');
      expect(transfer.amount).toBe(1000.5);
      expect(transfer.companyId).toBe('company-1');
      expect(transfer.debitAccount).toBe('001-123456-01');
      expect(transfer.creditAccount).toBe('002-654321-02');
      expect(transfer.createdAt).toBe(createdAt);
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        new Transfer(
          '1',
          -100,
          'company-1',
          '001-123456-01',
          '002-654321-02',
          new Date(),
        );
      }).toThrow('Transfer amount must be greater than zero');
    });

    it('should throw error for zero amount', () => {
      expect(() => {
        new Transfer(
          '1',
          0,
          'company-1',
          '001-123456-01',
          '002-654321-02',
          new Date(),
        );
      }).toThrow('Transfer amount must be greater than zero');
    });

    it('should throw error for invalid amount', () => {
      expect(() => {
        new Transfer(
          '1',
          NaN,
          'company-1',
          '001-123456-01',
          '002-654321-02',
          new Date(),
        );
      }).toThrow('Transfer amount must be a valid number');
    });

    it('should throw error for invalid debit account format', () => {
      expect(() => {
        new Transfer(
          '1',
          1000,
          'company-1',
          '123456',
          '002-654321-02',
          new Date(),
        );
      }).toThrow('Invalid debit account format. Expected: XXX-XXXXXX-XX');
    });

    it('should throw error for invalid credit account format', () => {
      expect(() => {
        new Transfer(
          '1',
          1000,
          'company-1',
          '001-123456-01',
          '654321',
          new Date(),
        );
      }).toThrow('Invalid credit account format. Expected: XXX-XXXXXX-XX');
    });

    it('should throw error for empty company ID', () => {
      expect(() => {
        new Transfer(
          '1',
          1000,
          '',
          '001-123456-01',
          '002-654321-02',
          new Date(),
        );
      }).toThrow('Company ID cannot be empty');
    });
  });

  describe('toPlainObject', () => {
    it('should return plain object representation', () => {
      const createdAt = new Date();

      const transfer = new Transfer(
        '1',
        1000.5,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        createdAt,
      );

      const plainObject = transfer.toPlainObject();

      expect(plainObject).toEqual({
        id: '1',
        amount: 1000.5,
        companyId: 'company-1',
        debitAccount: '001-123456-01',
        creditAccount: '002-654321-02',
        createdAt,
      });
    });
  });
});
