// src/domain/policies/fee-policy.interface.ts

export interface FeePolicy {
  calculateTransferFee(amount: number): number;
  getMaxTransferAmount(): number;
}
