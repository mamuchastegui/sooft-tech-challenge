// test/integration/company.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyRepositoryImpl } from '../../src/infrastructure/repositories/company.repository.impl';
import {
  CompanyEntity,
  PymeCompanyEntity,
  CorporateCompanyEntity,
} from '../../src/infrastructure/database/entities/company.entity';
import { TransferEntity } from '../../src/infrastructure/database/entities/transfer.entity';
import { CompanyFactory } from '../../src/domain/factories/company.factory';
import { PymeCompany } from '../../src/domain/entities/pyme-company.entity';
import { CorporateCompany } from '../../src/domain/entities/corporate-company.entity';
import { COMPANY_TYPES } from '../../src/domain/value-objects/company-type.constants';
import { Money } from '../../src/domain/value-objects/money';

describe('CompanyRepository Integration', () => {
  let repository: CompanyRepositoryImpl;
  let module: TestingModule;
  let companyEntityRepository: Repository<CompanyEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            CompanyEntity,
            PymeCompanyEntity,
            CorporateCompanyEntity,
            TransferEntity,
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([CompanyEntity, TransferEntity]),
      ],
      providers: [CompanyRepositoryImpl],
    }).compile();

    repository = module.get<CompanyRepositoryImpl>(CompanyRepositoryImpl);
    companyEntityRepository = module.get('CompanyEntityRepository');
  }, 15000);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    await companyEntityRepository.clear();
  });

  describe('save and retrieve', () => {
    it('should save and retrieve PYME company with correct polymorphic behavior', async () => {
      const pymeCompany = CompanyFactory.createPyme(
        '20-12345678-6',
        'Test PYME Company',
      );

      const savedCompany = await repository.save(pymeCompany);
      const retrievedCompany = await repository.findById(savedCompany.id);

      expect(retrievedCompany).toBeInstanceOf(PymeCompany);
      expect(retrievedCompany!.getType()).toBe(COMPANY_TYPES.PYME);
      expect(retrievedCompany!.calculateTransferFee(Money.create(1000))).toBe(
        50,
      );
      expect(
        (retrievedCompany as PymeCompany).isEligibleForGovernmentSupport(),
      ).toBe(true);
    });

    it('should save and retrieve Corporate company with correct polymorphic behavior', async () => {
      const corporateCompany = CompanyFactory.createCorporate(
        '30-87654321-0',
        'Test Corporate Company',
      );

      const savedCompany = await repository.save(corporateCompany);
      const retrievedCompany = await repository.findById(savedCompany.id);

      expect(retrievedCompany).toBeInstanceOf(CorporateCompany);
      expect(retrievedCompany!.getType()).toBe(COMPANY_TYPES.CORPORATE);
      expect(retrievedCompany!.calculateTransferFee(Money.create(1000))).toBe(
        1,
      );
      expect(
        (retrievedCompany as CorporateCompany).requiresComplianceReporting(),
      ).toBe(true);
    });

    it('should handle mixed company types in findAll', async () => {
      const pymeCompany = CompanyFactory.createPyme(
        '20-12345678-6',
        'PYME Company',
      );
      const corporateCompany = CompanyFactory.createCorporate(
        '30-87654321-0',
        'Corporate Company',
      );

      await repository.save(pymeCompany);
      await repository.save(corporateCompany);

      const companies = await repository.findAll();

      expect(companies).toHaveLength(2);

      const types = companies.map((c) => c.getType());
      expect(types).toContain(COMPANY_TYPES.PYME);
      expect(types).toContain(COMPANY_TYPES.CORPORATE);

      const pymeResult = companies.find(
        (c) => c.getType() === COMPANY_TYPES.PYME,
      );
      const corporateResult = companies.find(
        (c) => c.getType() === COMPANY_TYPES.CORPORATE,
      );

      expect(pymeResult).toBeInstanceOf(PymeCompany);
      expect(corporateResult).toBeInstanceOf(CorporateCompany);
    });

    it('should find company by CUIT regardless of type', async () => {
      const cuit = '20-12345678-6';
      const pymeCompany = CompanyFactory.createPyme(cuit, 'Test Company');

      await repository.save(pymeCompany);
      const found = await repository.findByCuit(cuit);

      expect(found).toBeInstanceOf(PymeCompany);
      expect(found!.cuit.toString()).toBe(cuit);
    });
  });

  describe('business logic validation', () => {
    it('should preserve business logic across persistence boundary', async () => {
      const pymeCompany = CompanyFactory.createPyme(
        '20-12345678-6',
        'PYME Company',
      );

      const savedCompany = await repository.save(pymeCompany);
      const retrievedCompany = (await repository.findById(
        savedCompany.id,
      )) as PymeCompany;

      // Test that business logic is preserved
      expect(retrievedCompany.getRequiredDocuments()).toContain(
        'PYME Certificate',
      );
      expect(retrievedCompany.getDailyLimit()).toBe(50000);
      expect(retrievedCompany.getMonthlyLimit()).toBe(500000);
    });

    it('should differentiate business rules between company types', async () => {
      const pymeCompany = CompanyFactory.createPyme(
        '20-12345678-6',
        'PYME Company',
      );
      const corporateCompany = CompanyFactory.createCorporate(
        '30-87654321-0',
        'Corporate Company',
      );

      await repository.save(pymeCompany);
      await repository.save(corporateCompany);

      const retrievedPyme = (await repository.findById(
        pymeCompany.id,
      )) as PymeCompany;
      const retrievedCorporate = (await repository.findById(
        corporateCompany.id,
      )) as CorporateCompany;

      // Different fee calculations
      expect(retrievedPyme.calculateTransferFee(Money.create(10000))).toBe(50);
      expect(retrievedCorporate.calculateTransferFee(Money.create(10000))).toBe(
        10,
      );

      // Different document requirements
      expect(retrievedPyme.getRequiredDocuments()).toHaveLength(4);
      expect(retrievedCorporate.getRequiredDocuments()).toHaveLength(6);

      // Different support eligibility
      expect(retrievedPyme.isEligibleForGovernmentSupport()).toBe(true);
      expect(retrievedCorporate.isEligibleForGovernmentSupport()).toBe(false);
    });
  });
});
