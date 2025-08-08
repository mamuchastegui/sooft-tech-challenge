// test/unit/domain/transfer.entity.spec.ts

import { Transfer } from '../../../src/domain/entities/transfer.entity';
import { Money } from '../../../src/domain/value-objects/money';
import { AccountId } from '../../../src/domain/value-objects/account-id';
import { DomainError } from '../../../src/domain/errors/domain.error';

describe('Transfer Entity', () => {
  describe('constructor', () => {
    it('should create a valid transfer', () => {
      const createdAt = new Date();
      const amount = Money.create(1000.5);
      const debitAccount = AccountId.create('1234567890123');
      const creditAccount = AccountId.create('9876543210987');

      const transfer = new Transfer(
        '1',
        amount,
        'company-1',
        debitAccount,
        creditAccount,
        createdAt,
      );

      expect(transfer.id).toBe('1');
      expect(transfer.amount).toBe(amount);
      expect(transfer.companyId).toBe('company-1');
      expect(transfer.debitAccount).toBe(debitAccount);
      expect(transfer.creditAccount).toBe(creditAccount);
      expect(transfer.createdAt).toBe(createdAt);
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        Money.create(-100);
      }).toThrow(DomainError);
    });

    it('should allow zero amount in Money object', () => {
      expect(() => {
        Money.create(0);
      }).not.toThrow();
    });

    it('should throw error for invalid amount', () => {
      expect(() => {
        Money.create(NaN);
      }).toThrow(DomainError);
    });

    it('should throw error for invalid debit account format', () => {
      expect(() => {
        AccountId.create('123456');
      }).toThrow(DomainError);
    });

    it('should throw error for invalid credit account format', () => {
      expect(() => {
        AccountId.create('654321');
      }).toThrow(DomainError);
    });

    it('should throw error for empty company ID', () => {
      const amount = Money.create(1000);
      const debitAccount = AccountId.create('1234567890123');
      const creditAccount = AccountId.create('9876543210987');

      expect(() => {
        new Transfer('1', amount, '', debitAccount, creditAccount, new Date());
      }).toThrow('Company ID cannot be empty');
    });
  });

  describe('toPlainObject', () => {
    it('should return plain object representation', () => {
      const createdAt = new Date();
      const amount = Money.create(1000.5);
      const debitAccount = AccountId.create('1234567890123');
      const creditAccount = AccountId.create('9876543210987');

      const transfer = new Transfer(
        '1',
        amount,
        'company-1',
        debitAccount,
        creditAccount,
        createdAt,
      );

      const plainObject = transfer.toPlainObject();

      expect(plainObject).toEqual({
        id: '1',
        amount: 1000.5,
        companyId: 'company-1',
        debitAccount: '1234567890123',
        creditAccount: '9876543210987',
        createdAt,
      });
    });
  });
});
