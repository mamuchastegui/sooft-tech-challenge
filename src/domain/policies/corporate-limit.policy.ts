// src/domain/policies/corporate-limit.policy.ts

import { TransferLimitPolicy } from './transfer-limit-policy.interface';

export class CorporateLimitPolicy implements TransferLimitPolicy {
  private static readonly DAILY_LIMIT = 1000000; // $1M per day
  private static readonly MONTHLY_LIMIT = 10000000; // $10M per month

  getDailyLimit(): number {
    return CorporateLimitPolicy.DAILY_LIMIT;
  }

  getMonthlyLimit(): number {
    return CorporateLimitPolicy.MONTHLY_LIMIT;
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
