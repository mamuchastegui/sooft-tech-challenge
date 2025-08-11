// test/unit/policies/transfer-limit.policy.spec.ts

import { PymeLimitPolicy } from '../../../src/domain/policies/pyme-limit.policy';
import { CorporateLimitPolicy } from '../../../src/domain/policies/corporate-limit.policy';

describe('Transfer Limit Policies', () => {
  describe('PymeLimitPolicy', () => {
    let policy: PymeLimitPolicy;

    beforeEach(() => {
      policy = new PymeLimitPolicy();
    });

    describe('limits', () => {
      it('should return correct daily limit', () => {
        expect(policy.getDailyLimit()).toBe(50000);
      });

      it('should return correct monthly limit', () => {
        expect(policy.getMonthlyLimit()).toBe(500000);
      });
    });

    describe('isTransferAllowed', () => {
      it('should allow transfer within daily and monthly limits', () => {
        const result = policy.isTransferAllowed(10000, 20000, 100000);

        expect(result).toBe(true);
      });

      it('should allow transfer that exactly reaches daily limit', () => {
        const result = policy.isTransferAllowed(10000, 40000, 100000);

        expect(result).toBe(true);
      });

      it('should allow transfer that exactly reaches monthly limit', () => {
        const result = policy.isTransferAllowed(50000, 0, 450000);

        expect(result).toBe(true);
      });

      it('should reject transfer that exceeds daily limit', () => {
        const result = policy.isTransferAllowed(10000, 45000, 100000);

        expect(result).toBe(false);
      });

      it('should reject transfer that exceeds monthly limit', () => {
        const result = policy.isTransferAllowed(100000, 10000, 450000);

        expect(result).toBe(false);
      });

      it('should reject transfer with zero usage that exceeds daily limit', () => {
        const result = policy.isTransferAllowed(60000, 0, 0);

        expect(result).toBe(false);
      });

      it('should reject transfer with zero usage that exceeds monthly limit', () => {
        const result = policy.isTransferAllowed(600000, 0, 0);

        expect(result).toBe(false);
      });

      it('should handle edge case with maximum daily and monthly usage', () => {
        const result = policy.isTransferAllowed(1, 49999, 499999);

        expect(result).toBe(true);
      });

      it('should reject when daily usage equals limit before transfer', () => {
        const result = policy.isTransferAllowed(1, 50000, 100000);

        expect(result).toBe(false);
      });

      it('should reject when monthly usage equals limit before transfer', () => {
        const result = policy.isTransferAllowed(1, 10000, 500000);

        expect(result).toBe(false);
      });

      it('should handle zero transfer amount', () => {
        const result = policy.isTransferAllowed(0, 49999, 499999);

        expect(result).toBe(true);
      });

      it('should handle large transfer amounts', () => {
        const result = policy.isTransferAllowed(1000000, 0, 0);

        expect(result).toBe(false);
      });
    });
  });

  describe('CorporateLimitPolicy', () => {
    let policy: CorporateLimitPolicy;

    beforeEach(() => {
      policy = new CorporateLimitPolicy();
    });

    describe('limits', () => {
      it('should return correct daily limit', () => {
        expect(policy.getDailyLimit()).toBe(1000000);
      });

      it('should return correct monthly limit', () => {
        expect(policy.getMonthlyLimit()).toBe(10000000);
      });
    });

    describe('isTransferAllowed', () => {
      it('should allow transfer within daily and monthly limits', () => {
        const result = policy.isTransferAllowed(500000, 200000, 2000000);

        expect(result).toBe(true);
      });

      it('should reject transfer that exceeds daily limit', () => {
        const result = policy.isTransferAllowed(500000, 600000, 2000000);

        expect(result).toBe(false);
      });

      it('should reject transfer that exceeds monthly limit', () => {
        const result = policy.isTransferAllowed(2000000, 200000, 9000000);

        expect(result).toBe(false);
      });

      it('should allow large corporate transfers within limits', () => {
        const result = policy.isTransferAllowed(800000, 100000, 1000000);

        expect(result).toBe(true);
      });

      it('should reject when approaching corporate daily limit', () => {
        const result = policy.isTransferAllowed(200000, 900000, 1000000);

        expect(result).toBe(false);
      });

      it('should reject when approaching corporate monthly limit', () => {
        const result = policy.isTransferAllowed(2000000, 100000, 9000000);

        expect(result).toBe(false);
      });
    });
  });

  describe('Policy Comparison', () => {
    let pymePolicy: PymeLimitPolicy;
    let corporatePolicy: CorporateLimitPolicy;

    beforeEach(() => {
      pymePolicy = new PymeLimitPolicy();
      corporatePolicy = new CorporateLimitPolicy();
    });

    it('should have corporate limits higher than pyme limits', () => {
      expect(corporatePolicy.getDailyLimit()).toBeGreaterThan(
        pymePolicy.getDailyLimit(),
      );
      expect(corporatePolicy.getMonthlyLimit()).toBeGreaterThan(
        pymePolicy.getMonthlyLimit(),
      );
    });

    it('should allow same transfer for corporate but reject for pyme', () => {
      const amount = 80000;
      const dailyUsed = 10000;
      const monthlyUsed = 100000;

      const pymeResult = pymePolicy.isTransferAllowed(
        amount,
        dailyUsed,
        monthlyUsed,
      );
      const corporateResult = corporatePolicy.isTransferAllowed(
        amount,
        dailyUsed,
        monthlyUsed,
      );

      expect(pymeResult).toBe(false); // Exceeds pyme daily limit
      expect(corporateResult).toBe(true); // Within corporate limits
    });
  });
});
