// test/unit/infrastructure/company.repository.impl.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyRepositoryImpl } from '../../../src/infrastructure/repositories/company.repository.impl';
import { Company } from '../../../src/domain/entities/company.entity';
import { CompanyTypeVO, CompanyType } from '../../../src/domain/value-objects/company-type.value-object';
import { CompanyEntity } from '../../../src/infrastructure/database/entities/company.entity';
import { TransferEntity } from '../../../src/infrastructure/database/entities/transfer.entity';

describe('CompanyRepositoryImpl', () => {
  let repository: CompanyRepositoryImpl;
  let mockCompanyRepository: jest.Mocked<Repository<CompanyEntity>>;
  let mockTransferRepository: jest.Mocked<Repository<TransferEntity>>;

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
    mockTransferRepository = module.get(getRepositoryToken(TransferEntity));
  });

  describe('save', () => {
    it('should save a company successfully', async () => {
      const company = new Company(
        '1',
        '20-12345678-9',
        'Test Company',
        new Date(),
        new CompanyTypeVO(CompanyType.CORPORATE),
      );

      const companyEntity = {
        id: '1',
        cuit: '20-12345678-9',
        businessName: 'Test Company',
        joinedAt: expect.any(Date),
        type: CompanyType.CORPORATE,
      };

      mockCompanyRepository.create.mockReturnValue(companyEntity as CompanyEntity);
      mockCompanyRepository.save.mockResolvedValue(companyEntity as CompanyEntity);

      const result = await repository.save(company);

      expect(mockCompanyRepository.create).toHaveBeenCalledWith({
        id: '1',
        cuit: '20-12345678-9',
        businessName: 'Test Company',
        joinedAt: expect.any(Date),
        type: CompanyType.CORPORATE,
      });
      expect(mockCompanyRepository.save).toHaveBeenCalledWith(companyEntity);
      expect(result).toBeInstanceOf(Company);
    });
  });

  describe('findById', () => {
    it('should return a company when found', async () => {
      const companyEntity = {
        id: '1',
        cuit: '20-12345678-9',
        businessName: 'Test Company',
        joinedAt: new Date(),
        type: CompanyType.CORPORATE,
      };

      mockCompanyRepository.findOne.mockResolvedValue(companyEntity as CompanyEntity);

      const result = await repository.findById('1');

      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toBeInstanceOf(Company);
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
        type: CompanyType.CORPORATE,
      };

      mockCompanyRepository.findOne.mockResolvedValue(companyEntity as CompanyEntity);

      const result = await repository.findByCuit('20-12345678-9');

      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({ where: { cuit: '20-12345678-9' } });
      expect(result).toBeInstanceOf(Company);
    });
  });

  describe('findAll', () => {
    it('should return all companies', async () => {
      const companyEntities = [
        {
          id: '1',
          cuit: '20-12345678-9',
          businessName: 'Company 1',
          joinedAt: new Date(),
          type: CompanyType.CORPORATE,
        },
        {
          id: '2',
          cuit: '27-87654321-0',
          businessName: 'Company 2',
          joinedAt: new Date(),
          type: CompanyType.PYME,
        },
      ];

      mockCompanyRepository.find.mockResolvedValue(companyEntities as CompanyEntity[]);

      const result = await repository.findAll();

      expect(mockCompanyRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Company);
      expect(result[1]).toBeInstanceOf(Company);
    });
  });

  describe('findCompaniesByFilter', () => {
    it('should find companies with date filter', async () => {
      const filter = {
        joinedFrom: new Date('2023-12-01T00:00:00Z'),
      };

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any;

      mockCompanyRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findCompaniesByFilter(filter);

      expect(mockCompanyRepository.createQueryBuilder).toHaveBeenCalledWith('company');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('company.joinedAt >= :joinedFrom', { joinedFrom: filter.joinedFrom });
      expect(result).toEqual([]);
    });
  });
});