// src/domain/entities/company.base.ts

import { FeePolicy } from '../policies/fee-policy.interface';
import { TransferLimitPolicy } from '../policies/transfer-limit-policy.interface';
import { CompanyType } from '../value-objects/company-type.constants';

export abstract class Company {
  protected constructor(
    protected readonly _id: string,
    protected readonly _cuit: string,
    protected readonly _businessName: string,
    protected readonly _joinedAt: Date,
    protected readonly _feePolicy: FeePolicy,
    protected readonly _limitPolicy: TransferLimitPolicy,
  ) {
    this.validateCuit(_cuit);
    this.validateBusinessName(_businessName);
  }

  get id(): string {
    return this._id;
  }

  get cuit(): string {
    return this._cuit;
  }

  get businessName(): string {
    return this._businessName;
  }

  get joinedAt(): Date {
    return this._joinedAt;
  }

  abstract getType(): CompanyType;

  calculateTransferFee(amount: number): number {
    return this._feePolicy.calculateTransferFee(amount);
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

  canTransfer(amount: number, dailyUsed: number, monthlyUsed: number): boolean {
    if (amount > this.getMaxTransferAmount()) {
      return false;
    }
    return this._limitPolicy.isTransferAllowed(amount, dailyUsed, monthlyUsed);
  }

  toPlainObject() {
    return {
      id: this._id,
      cuit: this._cuit,
      businessName: this._businessName,
      joinedAt: this._joinedAt,
      type: this.getType(),
    };
  }

  private validateCuit(cuit: string): void {
    const cuitPattern = /^\d{2}-\d{8}-\d$/;
    if (!cuitPattern.test(cuit)) {
      throw new Error('CUIT must follow the format XX-XXXXXXXX-X');
    }
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
