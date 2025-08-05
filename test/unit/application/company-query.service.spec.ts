// test/unit/application/company-query.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { CompanyQueryService } from '../../../src/application/services/company-query.service';
import { CompanyRepository } from '../../../src/domain/repositories/company.repository.interface';
import { DateProvider } from '../../../src/infrastructure/providers/date.provider';
import { Company } from '../../../src/domain/entities/company.entity';
import {
  CompanyTypeVO,
  CompanyType,
} from '../../../src/domain/value-objects/company-type.value-object';
import { COMPANY_REPOSITORY_TOKEN } from '../../../src/domain/repositories/company.repository.token';

describe('CompanyQueryService', () => {
  let service: CompanyQueryService;
  let mockRepository: jest.Mocked<CompanyRepository>;
  let mockDateProvider: jest.Mocked<DateProvider>;

  beforeEach(async () => {
    const mockCompanyRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCuit: jest.fn(),
      findAll: jest.fn(),
      findCompaniesByFilter: jest.fn(),
    };

    const mockDateProviderService = {
      now: jest.fn(),
      parseISO: jest.fn(),
      isValidISOString: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyQueryService,
        {
          provide: COMPANY_REPOSITORY_TOKEN,
          useValue: mockCompanyRepository,
        },
        {
          provide: DateProvider,
          useValue: mockDateProviderService,
        },
      ],
    }).compile();

    service = module.get<CompanyQueryService>(CompanyQueryService);
    mockRepository = module.get(COMPANY_REPOSITORY_TOKEN);
    mockDateProvider = module.get(DateProvider);
  });

  describe('findCompanies', () => {
    it('should find companies with no filters', async () => {
      const companies = [
        new Company(
          '1',
          '20-12345678-9',
          'Test Company',
          new Date(),
          new CompanyTypeVO(CompanyType.CORPORATE),
        ),
      ];

      mockRepository.findCompaniesByFilter.mockResolvedValue(companies);

      const result = await service.findCompanies({});

      expect(mockRepository.findCompaniesByFilter).toHaveBeenCalledWith({});
      expect(result).toHaveLength(1);
      expect(result[0].businessName).toBe('Test Company');
    });

    it('should find companies with joinedAfter filter', async () => {
      const filterDate = new Date('2023-12-01T00:00:00Z');
      const companies = [
        new Company(
          '1',
          '20-12345678-9',
          'Recent Company',
          new Date('2023-12-15T00:00:00Z'),
          new CompanyTypeVO(CompanyType.PYME),
        ),
      ];

      mockDateProvider.parseISO.mockReturnValue(filterDate);
      mockRepository.findCompaniesByFilter.mockResolvedValue(companies);

      const result = await service.findCompanies({
        joinedFrom: '2023-12-01T00:00:00Z',
      });

      expect(mockDateProvider.parseISO).toHaveBeenCalledWith(
        '2023-12-01T00:00:00Z',
      );
      expect(mockRepository.findCompaniesByFilter).toHaveBeenCalledWith({
        joinedFrom: filterDate,
      });
      expect(result).toHaveLength(1);
    });

    it('should find companies with transfersSince filter', async () => {
      const filterDate = new Date('2023-11-01T00:00:00Z');
      const companies = [
        new Company(
          '1',
          '20-12345678-9',
          'Active Company',
          new Date('2023-10-15T00:00:00Z'),
          new CompanyTypeVO(CompanyType.CORPORATE),
        ),
      ];

      mockDateProvider.parseISO.mockReturnValue(filterDate);
      mockRepository.findCompaniesByFilter.mockResolvedValue(companies);

      const result = await service.findCompanies({
        transferFrom: '2023-11-01T00:00:00Z',
      });

      expect(mockDateProvider.parseISO).toHaveBeenCalledWith(
        '2023-11-01T00:00:00Z',
      );
      expect(mockRepository.findCompaniesByFilter).toHaveBeenCalledWith({
        transferFrom: filterDate,
      });
      expect(result).toHaveLength(1);
    });

    it('should find companies with both filters', async () => {
      const joinedDate = new Date('2023-12-01T00:00:00Z');
      const transferDate = new Date('2023-11-01T00:00:00Z');
      const companies = [
        new Company(
          '1',
          '20-12345678-9',
          'Filtered Company',
          new Date('2023-12-15T00:00:00Z'),
          new CompanyTypeVO(CompanyType.PYME),
        ),
      ];

      mockDateProvider.parseISO
        .mockReturnValueOnce(joinedDate)
        .mockReturnValueOnce(transferDate);
      mockRepository.findCompaniesByFilter.mockResolvedValue(companies);

      const result = await service.findCompanies({
        joinedFrom: '2023-12-01T00:00:00Z',
        transferFrom: '2023-11-01T00:00:00Z',
      });

      expect(mockRepository.findCompaniesByFilter).toHaveBeenCalledWith({
        joinedFrom: joinedDate,
        transferFrom: transferDate,
      });
      expect(result).toHaveLength(1);
    });
  });
});
