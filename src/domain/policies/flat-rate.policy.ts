// src/domain/policies/flat-rate.policy.ts

import { FeePolicy } from './fee-policy.interface';

export class FlatRatePolicy implements FeePolicy {
  private static readonly FLAT_FEE = 50; // $50 flat fee for PYME
  private static readonly MAX_TRANSFER = 100000; // $100,000 max

  calculateTransferFee(amount: number): number {
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }
    return FlatRatePolicy.FLAT_FEE;
  }

  getMaxTransferAmount(): number {
    return FlatRatePolicy.MAX_TRANSFER;
  }
}
