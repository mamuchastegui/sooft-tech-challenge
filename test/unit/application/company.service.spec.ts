// test/unit/application/company.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CompanyService } from '../../../src/application/services/company.service';
import { CompanyRepository } from '../../../src/domain/repositories/company.repository.interface';
import { CompanyFactory } from '../../../src/domain/factories/company.factory';
import { COMPANY_TYPES } from '../../../src/domain/value-objects/company-type.constants';
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
      cuit: '20-12345678-6',
      name: 'Test Company SA',
      type: COMPANY_TYPES.CORPORATE,
    };

    it('should create a new company successfully', async () => {
      mockRepository.findByCuit.mockResolvedValue(null);

      const savedCompany = CompanyFactory.createCorporate(
        createCompanyDto.cuit,
        createCompanyDto.name,
      );

      // Set the ID for testing
      Object.defineProperty(savedCompany, '_id', {
        value: 'generated-id',
        writable: false,
      });

      mockRepository.save.mockResolvedValue(savedCompany);

      const result = await service.createCompany(createCompanyDto);

      expect(mockRepository.findByCuit).toHaveBeenCalledWith(
        createCompanyDto.cuit,
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.cuit).toBe(createCompanyDto.cuit);
      expect(result.name).toBe(createCompanyDto.name);
      expect(result.type).toBe(createCompanyDto.type);
    });

    it('should throw ConflictException when company with CUIT already exists', async () => {
      const existingCompany = CompanyFactory.createPyme(
        createCompanyDto.cuit,
        'Existing Company',
      );

      // Set the ID for testing
      Object.defineProperty(existingCompany, '_id', {
        value: 'existing-id',
        writable: false,
      });

      mockRepository.findByCuit.mockResolvedValue(existingCompany);

      await expect(service.createCompany(createCompanyDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getCompanyById', () => {
    it('should return company when found', async () => {
      const company = CompanyFactory.createCorporate(
        '20-12345678-6',
        'Test Company',
      );

      // Set the ID for testing
      Object.defineProperty(company, '_id', { value: '1', writable: false });

      mockRepository.findById.mockResolvedValue(company);

      const result = await service.getCompanyById('1');

      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
      expect(result.name).toBe('Test Company');
    });

    it('should throw NotFoundException when company not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getCompanyById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
