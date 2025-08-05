// test/unit/application/company.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CompanyService } from '../../../src/application/services/company.service';
import { CompanyRepository } from '../../../src/domain/repositories/company.repository.interface';
import { Company } from '../../../src/domain/entities/company.entity';
import { CompanyTypeVO, CompanyType } from '../../../src/domain/value-objects/company-type.value-object';
import { CreateCompanyDto } from '../../../src/application/dto/create-company.dto';
import { COMPANY_REPOSITORY_TOKEN } from '../../../src/domain/repositories/company.repository.token';

describe('CompanyService', () => {
  let service: CompanyService;
  let mockRepository: jest.Mocked<CompanyRepository>;

  beforeEach(async () => {
    const mockCompanyRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCuit: jest.fn(),
      findAll: jest.fn(),
      findCompaniesByFilter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: COMPANY_REPOSITORY_TOKEN,
          useValue: mockCompanyRepository,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    mockRepository = module.get(COMPANY_REPOSITORY_TOKEN);
  });

  describe('createCompany', () => {
    const createCompanyDto: CreateCompanyDto = {
      cuit: '20-12345678-9',
      businessName: 'Test Company SA',
      type: CompanyType.CORPORATE,
    };

    it('should create a new company successfully', async () => {
      mockRepository.findByCuit.mockResolvedValue(null);
      
      const savedCompany = new Company(
        'generated-id',
        createCompanyDto.cuit,
        createCompanyDto.businessName,
        new Date(),
        new CompanyTypeVO(createCompanyDto.type),
      );
      
      mockRepository.save.mockResolvedValue(savedCompany);

      const result = await service.createCompany(createCompanyDto);

      expect(mockRepository.findByCuit).toHaveBeenCalledWith(createCompanyDto.cuit);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.cuit).toBe(createCompanyDto.cuit);
      expect(result.businessName).toBe(createCompanyDto.businessName);
      expect(result.type).toBe(createCompanyDto.type);
    });

    it('should throw ConflictException when company with CUIT already exists', async () => {
      const existingCompany = new Company(
        'existing-id',
        createCompanyDto.cuit,
        'Existing Company',
        new Date(),
        new CompanyTypeVO(CompanyType.PYME),
      );
      
      mockRepository.findByCuit.mockResolvedValue(existingCompany);

      await expect(service.createCompany(createCompanyDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });


  describe('getCompanyById', () => {
    it('should return company when found', async () => {
      const company = new Company(
        '1',
        '20-12345678-9',
        'Test Company',
        new Date(),
        new CompanyTypeVO(CompanyType.CORPORATE),
      );

      mockRepository.findById.mockResolvedValue(company);

      const result = await service.getCompanyById('1');

      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
      expect(result.businessName).toBe('Test Company');
    });

    it('should throw NotFoundException when company not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getCompanyById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});