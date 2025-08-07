// src/domain/entities/transfer.entity.ts

import { Money } from '../value-objects/money.vo';
import { AccountId } from '../value-objects/account-id.vo';

export class Transfer {
  constructor(
    public readonly id: string,
    public readonly amount: Money,
    public readonly companyId: string,
    public readonly debitAccount: AccountId,
    public readonly creditAccount: AccountId,
    public readonly createdAt: Date,
  ) {
    this.validateCompanyId(companyId);
  }

  private validateCompanyId(companyId: string): void {
    if (!companyId || companyId.trim().length === 0) {
      throw new Error('Company ID cannot be empty');
    }
  }

  public toPlainObject() {
    return {
      id: this.id,
      amount: this.amount.toNumber(),
      companyId: this.companyId,
      debitAccount: this.debitAccount.toString(),
      creditAccount: this.creditAccount.toString(),
      createdAt: this.createdAt,
    };
  }
}
