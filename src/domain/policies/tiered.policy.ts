// src/domain/policies/tiered.policy.ts

import { FeePolicy } from './fee-policy.interface';

export class TieredPolicy implements FeePolicy {
  private static readonly TIER_1_LIMIT = 10000; // Up to $10k
  private static readonly TIER_2_LIMIT = 100000; // Up to $100k
  private static readonly TIER_1_RATE = 0.001; // 0.1%
  private static readonly TIER_2_RATE = 0.005; // 0.5%
  private static readonly TIER_3_RATE = 0.01; // 1.0%
  private static readonly MAX_TRANSFER = 1000000; // $1M max for Corporate

  calculateTransferFee(amount: number): number {
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    if (amount <= TieredPolicy.TIER_1_LIMIT) {
      return amount * TieredPolicy.TIER_1_RATE;
    } else if (amount <= TieredPolicy.TIER_2_LIMIT) {
      return amount * TieredPolicy.TIER_2_RATE;
    } else {
      return amount * TieredPolicy.TIER_3_RATE;
    }
  }

  getMaxTransferAmount(): number {
    return TieredPolicy.MAX_TRANSFER;
  }
}
