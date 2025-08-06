// test/unit/infrastructure/company.repository.impl.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyRepositoryImpl } from '../../../src/infrastructure/repositories/company.repository.impl';
import { CompanyFactory } from '../../../src/domain/factories/company.factory';
import { COMPANY_TYPES } from '../../../src/domain/value-objects/company-type.constants';
import { CompanyEntity } from '../../../src/infrastructure/database/entities/company.entity';
import { TransferEntity } from '../../../src/infrastructure/database/entities/transfer.entity';

describe('CompanyRepositoryImpl', () => {
  let repository: CompanyRepositoryImpl;
  let mockCompanyRepository: jest.Mocked<Repository<CompanyEntity>>;

  beforeEach(async () => {
    const mockCompanyRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockTransferRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyRepositoryImpl,
        {
          provide: getRepositoryToken(CompanyEntity),
          useValue: mockCompanyRepo,
        },
        {
          provide: getRepositoryToken(TransferEntity),
          useValue: mockTransferRepo,
        },
      ],
    }).compile();

    repository = module.get<CompanyRepositoryImpl>(CompanyRepositoryImpl);
    mockCompanyRepository = module.get(getRepositoryToken(CompanyEntity));
  });

  describe('save', () => {
    it('should save a PYME company successfully', async () => {
      const company = CompanyFactory.createPyme(
        '20-12345678-9',
        'Test PYME Company',
      );

      const companyEntity = {
        id: company.id,
        cuit: '20-12345678-9',
        businessName: 'Test PYME Company',
        joinedAt: expect.any(Date),
        type: COMPANY_TYPES.PYME,
      };

      mockCompanyRepository.save.mockResolvedValue(
        companyEntity as CompanyEntity,
      );

      const result = await repository.save(company);

      expect(mockCompanyRepository.save).toHaveBeenCalled();
      expect(result.getType()).toBe(COMPANY_TYPES.PYME);
      expect(result.calculateTransferFee(1000)).toBe(50);
    });

    it('should save a Corporate company successfully', async () => {
      const company = CompanyFactory.createCorporate(
        '30-87654321-0',
        'Test Corporate Company',
      );

      const companyEntity = {
        id: company.id,
        cuit: '30-87654321-0',
        businessName: 'Test Corporate Company',
        joinedAt: expect.any(Date),
        type: COMPANY_TYPES.CORPORATE,
      };

      mockCompanyRepository.save.mockResolvedValue(
        companyEntity as CompanyEntity,
      );

      const result = await repository.save(company);

      expect(mockCompanyRepository.save).toHaveBeenCalled();
      expect(result.getType()).toBe(COMPANY_TYPES.CORPORATE);
      expect(result.calculateTransferFee(1000)).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a PYME company when found', async () => {
      const companyEntity = {
        id: '1',
        cuit: '20-12345678-9',
        businessName: 'Test PYME Company',
        joinedAt: new Date(),
        type: COMPANY_TYPES.PYME,
      };

      mockCompanyRepository.findOne.mockResolvedValue(
        companyEntity as CompanyEntity,
      );

      const result = await repository.findById('1');

      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result?.getType()).toBe(COMPANY_TYPES.PYME);
      expect(result?.id).toBe('1');
    });

    it('should return null when not found', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('1');

      expect(result).toBeNull();
    });
  });

  describe('findByCuit', () => {
    it('should return a company when found by CUIT', async () => {
      const companyEntity = {
        id: '1',
        cuit: '20-12345678-9',
        businessName: 'Test Company',
        joinedAt: new Date(),
        type: COMPANY_TYPES.CORPORATE,
      };

      mockCompanyRepository.findOne.mockResolvedValue(
        companyEntity as CompanyEntity,
      );

      const result = await repository.findByCuit('20-12345678-9');

      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { cuit: '20-12345678-9' },
      });
      expect(result?.getType()).toBe(COMPANY_TYPES.CORPORATE);
    });
  });

  describe('findAll', () => {
    it('should return all companies with correct polymorphic types', async () => {
      const companyEntities = [
        {
          id: '1',
          cuit: '20-12345678-9',
          businessName: 'PYME Company',
          joinedAt: new Date(),
          type: COMPANY_TYPES.PYME,
        },
        {
          id: '2',
          cuit: '30-87654321-0',
          businessName: 'Corporate Company',
          joinedAt: new Date(),
          type: COMPANY_TYPES.CORPORATE,
        },
      ];

      mockCompanyRepository.find.mockResolvedValue(
        companyEntities as CompanyEntity[],
      );

      const result = await repository.findAll();

      expect(mockCompanyRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);

      const pymeCompany = result.find(
        (c) => c.getType() === COMPANY_TYPES.PYME,
      );
      const corporateCompany = result.find(
        (c) => c.getType() === COMPANY_TYPES.CORPORATE,
      );

      expect(pymeCompany?.calculateTransferFee(1000)).toBe(50);
      expect(corporateCompany?.calculateTransferFee(1000)).toBe(1);
    });
  });

  describe('findCompaniesByFilter', () => {
    it('should find companies with date filter', async () => {
      const filter = {
        joinedFrom: new Date('2023-12-01T00:00:00Z'),
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getMany: jest.fn().mockResolvedValue([]),
      } as any;

      mockCompanyRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findCompaniesByFilter(filter);

      expect(mockCompanyRepository.createQueryBuilder).toHaveBeenCalledWith(
        'c',
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('c.joinedAt >= :jf', {
        jf: filter.joinedFrom,
      });
      expect(result).toEqual([]);
    });
  });
});
