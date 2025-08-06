// src/domain/policies/transfer-limit-policy.interface.ts

export interface TransferLimitPolicy {
  getDailyLimit(): number;
  getMonthlyLimit(): number;
  isTransferAllowed(
    amount: number,
    dailyUsed: number,
    monthlyUsed: number,
  ): boolean;
}
