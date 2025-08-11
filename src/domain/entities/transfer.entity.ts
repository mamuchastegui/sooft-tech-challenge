// src/domain/entities/transfer.entity.ts

import { Money } from '../value-objects/money';
import { Account, accountToMaskedString } from '../value-objects/account';

export class Transfer {
  constructor(
    public readonly id: string,
    public readonly amount: Money,
    public readonly companyId: string,
    public readonly debitAccount: Account,
    public readonly creditAccount: Account,
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
      debitAccountType: this.debitAccount.kind,
      debitAccountValue: accountToMaskedString(this.debitAccount),
      creditAccountType: this.creditAccount.kind,
      creditAccountValue: accountToMaskedString(this.creditAccount),
      createdAt: this.createdAt,
    };
  }
}
