// src/domain/entities/transfer.entity.ts

export class Transfer {
  constructor(
    public readonly id: string,
    public readonly amount: number,
    public readonly companyId: string,
    public readonly debitAccount: string,
    public readonly creditAccount: string,
    public readonly createdAt: Date,
  ) {
    this.validateAmount(amount);
    this.validateAccount(debitAccount, 'debit');
    this.validateAccount(creditAccount, 'credit');
    this.validateCompanyId(companyId);
  }

  private validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than zero');
    }
    if (!Number.isFinite(amount)) {
      throw new Error('Transfer amount must be a valid number');
    }
  }

  private validateAccount(account: string, type: 'debit' | 'credit'): void {
    if (!account || account.trim().length === 0) {
      throw new Error(`${type} account cannot be empty`);
    }
    const accountRegex = /^\d{3}-\d{6}-\d{2}$/;
    if (!accountRegex.test(account)) {
      throw new Error(
        `Invalid ${type} account format. Expected: XXX-XXXXXX-XX`,
      );
    }
  }

  private validateCompanyId(companyId: string): void {
    if (!companyId || companyId.trim().length === 0) {
      throw new Error('Company ID cannot be empty');
    }
  }

  public toPlainObject() {
    return {
      id: this.id,
      amount: this.amount,
      companyId: this.companyId,
      debitAccount: this.debitAccount,
      creditAccount: this.creditAccount,
      createdAt: this.createdAt,
    };
  }
}
