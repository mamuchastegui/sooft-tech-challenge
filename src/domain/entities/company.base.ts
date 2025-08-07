// src/domain/entities/company.base.ts

import { FeePolicy } from '../policies/fee-policy.interface';
import { TransferLimitPolicy } from '../policies/transfer-limit-policy.interface';
import { CompanyType } from '../value-objects/company-type.constants';
import { Cuit } from '../value-objects/cuit.vo';
import { Money } from '../value-objects/money.vo';

export abstract class Company {
  protected constructor(
    protected readonly _id: string,
    protected readonly _cuit: Cuit,
    protected readonly _businessName: string,
    protected readonly _joinedAt: Date,
    protected readonly _feePolicy: FeePolicy,
    protected readonly _limitPolicy: TransferLimitPolicy,
  ) {
    this.validateBusinessName(_businessName);
  }

  get id(): string {
    return this._id;
  }

  get cuit(): Cuit {
    return this._cuit;
  }

  get businessName(): string {
    return this._businessName;
  }

  get joinedAt(): Date {
    return this._joinedAt;
  }

  abstract getType(): CompanyType;

  calculateTransferFee(amount: Money): number {
    return this._feePolicy.calculateTransferFee(amount.toNumber());
  }

  getMaxTransferAmount(): number {
    return this._feePolicy.getMaxTransferAmount();
  }

  getDailyLimit(): number {
    return this._limitPolicy.getDailyLimit();
  }

  getMonthlyLimit(): number {
    return this._limitPolicy.getMonthlyLimit();
  }

  canTransfer(amount: Money, dailyUsed: number, monthlyUsed: number): boolean {
    if (amount.toNumber() > this.getMaxTransferAmount()) {
      return false;
    }
    return this._limitPolicy.isTransferAllowed(
      amount.toNumber(),
      dailyUsed,
      monthlyUsed,
    );
  }

  toPlainObject() {
    return {
      id: this._id,
      cuit: this._cuit.toString(),
      businessName: this._businessName,
      joinedAt: this._joinedAt,
      type: this.getType(),
    };
  }

  private validateBusinessName(businessName: string): void {
    if (!businessName || businessName.trim().length === 0) {
      throw new Error('Business name cannot be empty');
    }
    if (businessName.length > 255) {
      throw new Error('Business name cannot exceed 255 characters');
    }
  }
}
