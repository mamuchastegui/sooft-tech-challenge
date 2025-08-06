// src/domain/policies/pyme-limit.policy.ts

import { TransferLimitPolicy } from './transfer-limit-policy.interface';

export class PymeLimitPolicy implements TransferLimitPolicy {
  private static readonly DAILY_LIMIT = 50000; // $50k per day
  private static readonly MONTHLY_LIMIT = 500000; // $500k per month

  getDailyLimit(): number {
    return PymeLimitPolicy.DAILY_LIMIT;
  }

  getMonthlyLimit(): number {
    return PymeLimitPolicy.MONTHLY_LIMIT;
  }

  isTransferAllowed(
    amount: number,
    dailyUsed: number,
    monthlyUsed: number,
  ): boolean {
    const newDailyTotal = dailyUsed + amount;
    const newMonthlyTotal = monthlyUsed + amount;

    return (
      newDailyTotal <= this.getDailyLimit() &&
      newMonthlyTotal <= this.getMonthlyLimit()
    );
  }
}
