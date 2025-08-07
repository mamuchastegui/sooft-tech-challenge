// test/unit/application/transfer.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransferService } from '../../../src/application/services/transfer.service';
import { TransferRepository } from '../../../src/domain/repositories/transfer.repository.interface';
import { Transfer } from '../../../src/domain/entities/transfer.entity';
import { TRANSFER_REPOSITORY_TOKEN } from '../../../src/domain/repositories/transfer.repository.token';
import { COMPANY_REPOSITORY_TOKEN } from '../../../src/domain/repositories/company.repository.token';
import { Money } from '../../../src/domain/value-objects/money.vo';
import { AccountId } from '../../../src/domain/value-objects/account-id.vo';

describe('TransferService', () => {
  let service: TransferService;
  let mockTransferRepository: jest.Mocked<TransferRepository>;

  beforeEach(async () => {
    const mockTransferRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCompanyId: jest.fn(),
      findAll: jest.fn(),
      findTransfersByCompanyIdAndDateRange: jest.fn(),
    };

    const mockCompanyRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCuit: jest.fn(),
      findAll: jest.fn(),
      findCompaniesByFilter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: TRANSFER_REPOSITORY_TOKEN,
          useValue: mockTransferRepo,
        },
        {
          provide: COMPANY_REPOSITORY_TOKEN,
          useValue: mockCompanyRepo,
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    mockTransferRepository = module.get(TRANSFER_REPOSITORY_TOKEN);
  });

  describe('getTransfersByCompanyId', () => {
    it('should return transfers for specific company', async () => {
      const amount = Money.create(1000.5);
      const debitAccount = AccountId.create('1234567890123');
      const creditAccount = AccountId.create('9876543210987');

      const transfers = [
        new Transfer(
          '1',
          amount,
          'company-1',
          debitAccount,
          creditAccount,
          new Date(),
        ),
      ];

      mockTransferRepository.findByCompanyId.mockResolvedValue(transfers);

      const result = await service.getTransfersByCompanyId('company-1');

      expect(mockTransferRepository.findByCompanyId).toHaveBeenCalledWith(
        'company-1',
      );
      expect(result).toHaveLength(1);
      expect(result[0].companyId).toBe('company-1');
    });
  });

  describe('getTransferById', () => {
    it('should return transfer when found', async () => {
      const amount = Money.create(1000.5);
      const debitAccount = AccountId.create('1234567890123');
      const creditAccount = AccountId.create('9876543210987');

      const transfer = new Transfer(
        '1',
        amount,
        'company-1',
        debitAccount,
        creditAccount,
        new Date(),
      );

      mockTransferRepository.findById.mockResolvedValue(transfer);

      const result = await service.getTransferById('1');

      expect(mockTransferRepository.findById).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
      expect(result.amount).toBe(1000.5);
    });

    it('should throw NotFoundException when transfer not found', async () => {
      mockTransferRepository.findById.mockResolvedValue(null);

      await expect(service.getTransferById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
