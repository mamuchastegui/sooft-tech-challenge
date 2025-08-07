// test/unit/company.fees.spec.ts

import { PymeCompany } from '../../src/domain/entities/pyme-company.entity';
import { CorporateCompany } from '../../src/domain/entities/corporate-company.entity';
import { CompanyFactory } from '../../src/domain/factories/company.factory';
import { COMPANY_TYPES } from '../../src/domain/value-objects/company-type.constants';
import { Money } from '../../src/domain/value-objects/money.vo';

describe('Company Fee Calculation', () => {
  describe('PymeCompany', () => {
    let pymeCompany: PymeCompany;

    beforeEach(() => {
      pymeCompany = CompanyFactory.createPyme(
        '20-12345678-6',
        'PYME Test Company',
      );
    });

    it('should calculate flat fee for PYME transfers', () => {
      expect(pymeCompany.calculateTransferFee(Money.create(1000))).toBe(50);
      expect(pymeCompany.calculateTransferFee(Money.create(50000))).toBe(50);
      expect(pymeCompany.calculateTransferFee(Money.create(100000))).toBe(50);
    });

    it('should have correct transfer limits for PYME', () => {
      expect(pymeCompany.getMaxTransferAmount()).toBe(100000);
      expect(pymeCompany.getDailyLimit()).toBe(50000);
      expect(pymeCompany.getMonthlyLimit()).toBe(500000);
    });

    it('should validate transfer limits correctly', () => {
      expect(pymeCompany.canTransfer(Money.create(30000), 10000, 100000)).toBe(
        true,
      );
      expect(pymeCompany.canTransfer(Money.create(30000), 30000, 100000)).toBe(
        false,
      ); // Exceeds daily
      expect(pymeCompany.canTransfer(Money.create(30000), 10000, 480000)).toBe(
        false,
      ); // Exceeds monthly
      expect(pymeCompany.canTransfer(Money.create(150000), 0, 0)).toBe(false); // Exceeds max transfer
    });

    it('should be eligible for government support', () => {
      expect(pymeCompany.isEligibleForGovernmentSupport()).toBe(true);
    });

    it('should return correct type', () => {
      expect(pymeCompany.getType()).toBe(COMPANY_TYPES.PYME);
    });
  });

  describe('CorporateCompany', () => {
    let corporateCompany: CorporateCompany;

    beforeEach(() => {
      corporateCompany = CompanyFactory.createCorporate(
        '30-87654321-0',
        'Corporate Test Company',
      );
    });

    it('should calculate tiered fees for Corporate transfers', () => {
      expect(corporateCompany.calculateTransferFee(Money.create(5000))).toBe(5); // 0.1% up to 10k
      expect(corporateCompany.calculateTransferFee(Money.create(10000))).toBe(
        10,
      ); // 0.1% up to 10k
      expect(corporateCompany.calculateTransferFee(Money.create(50000))).toBe(
        250,
      ); // 0.5% from 10k-100k
      expect(corporateCompany.calculateTransferFee(Money.create(200000))).toBe(
        2000,
      ); // 1.0% above 100k
    });

    it('should have correct transfer limits for Corporate', () => {
      expect(corporateCompany.getMaxTransferAmount()).toBe(1000000);
      expect(corporateCompany.getDailyLimit()).toBe(1000000);
      expect(corporateCompany.getMonthlyLimit()).toBe(10000000);
    });

    it('should validate transfer limits correctly', () => {
      expect(
        corporateCompany.canTransfer(Money.create(500000), 200000, 2000000),
      ).toBe(true);
      expect(
        corporateCompany.canTransfer(Money.create(500000), 800000, 2000000),
      ).toBe(false); // Exceeds daily
      expect(
        corporateCompany.canTransfer(Money.create(500000), 200000, 9800000),
      ).toBe(false); // Exceeds monthly
      expect(corporateCompany.canTransfer(Money.create(1500000), 0, 0)).toBe(
        false,
      ); // Exceeds max transfer
    });

    it('should not be eligible for government support', () => {
      expect(corporateCompany.isEligibleForGovernmentSupport()).toBe(false);
    });

    it('should require compliance reporting', () => {
      expect(corporateCompany.requiresComplianceReporting()).toBe(true);
    });

    it('should return correct type', () => {
      expect(corporateCompany.getType()).toBe(COMPANY_TYPES.CORPORATE);
    });
  });

  describe('CompanyFactory', () => {
    it('should create correct company type based on input', () => {
      const pymeCompany = CompanyFactory.create({
        cuit: '20-12345678-6',
        businessName: 'Test PYME',
        type: COMPANY_TYPES.PYME,
      });

      const corporateCompany = CompanyFactory.create({
        cuit: '30-87654321-0',
        businessName: 'Test Corporate',
        type: COMPANY_TYPES.CORPORATE,
      });

      expect(pymeCompany).toBeInstanceOf(PymeCompany);
      expect(corporateCompany).toBeInstanceOf(CorporateCompany);
    });

    it('should throw error for unknown company type', () => {
      expect(() =>
        CompanyFactory.create({
          cuit: '20-12345678-6',
          businessName: 'Test Company',
          type: 'UNKNOWN' as any,
        }),
      ).toThrow('Unknown company type: UNKNOWN');
    });
  });
});
