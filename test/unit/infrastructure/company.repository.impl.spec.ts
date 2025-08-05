// test/unit/infrastructure/company.repository.impl.spec.ts

import { CompanyRepositoryImpl } from '../../../src/infrastructure/repositories/company.repository.impl';
import { Company } from '../../../src/domain/entities/company.entity';
import { CompanyTypeVO, CompanyType } from '../../../src/domain/value-objects/company-type.value-object';
import { MockData } from '../../../src/infrastructure/database/mock-data';

jest.mock('../../../src/infrastructure/database/mock-data');

describe('CompanyRepositoryImpl', () => {
  let repository: CompanyRepositoryImpl;
  let mockDataSpy: jest.Mocked<typeof MockData>;

  beforeEach(() => {
    repository = new CompanyRepositoryImpl();
    mockDataSpy = MockData as jest.Mocked<typeof MockData>;
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a company', async () => {
      const company = new Company(
        '1',
        '20-12345678-9',
        'Test Company',
        new Date(),
        new CompanyTypeVO(CompanyType.CORPORATE),
      );

      mockDataSpy.addCompany = jest.fn();

      const result = await repository.save(company);

      expect(mockDataSpy.addCompany).toHaveBeenCalledWith(company);
      expect(result).toBe(company);
    });
  });

  describe('findById', () => {
    it('should find company by id', async () => {
      const company = new Company(
        '1',
        '20-12345678-9',
        'Test Company',
        new Date(),
        new CompanyTypeVO(CompanyType.CORPORATE),
      );

      mockDataSpy.getCompanies.mockReturnValue([company]);

      const result = await repository.findById('1');

      expect(result).toBe(company);
    });

    it('should return null when company not found', async () => {
      mockDataSpy.getCompanies.mockReturnValue([]);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByCuit', () => {
    it('should find company by CUIT', async () => {
      const company = new Company(
        '1',
        '20-12345678-9',
        'Test Company',
        new Date(),
        new CompanyTypeVO(CompanyType.CORPORATE),
      );

      mockDataSpy.getCompanies.mockReturnValue([company]);

      const result = await repository.findByCuit('20-12345678-9');

      expect(result).toBe(company);
    });

    it('should return null when company with CUIT not found', async () => {
      mockDataSpy.getCompanies.mockReturnValue([]);

      const result = await repository.findByCuit('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findCompaniesJoinedInLastMonth', () => {
    it('should return companies joined in last month', async () => {
      const recentCompany = new Company(
        '1',
        '20-12345678-9',
        'Recent Company',
        new Date(),
        new CompanyTypeVO(CompanyType.CORPORATE),
      );

      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 2);
      const oldCompany = new Company(
        '2',
        '27-87654321-0',
        'Old Company',
        oldDate,
        new CompanyTypeVO(CompanyType.PYME),
      );

      mockDataSpy.getCompanies.mockReturnValue([recentCompany, oldCompany]);

      const result = await repository.findCompaniesJoinedInLastMonth();

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(recentCompany);
    });
  });
});