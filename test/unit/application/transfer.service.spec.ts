// test/unit/application/transfer.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransferService } from '../../../src/application/services/transfer.service';
import { TransferRepository } from '../../../src/domain/repositories/transfer.repository.interface';
import { Transfer } from '../../../src/domain/entities/transfer.entity';
import { TRANSFER_REPOSITORY_TOKEN } from '../../../src/domain/repositories/transfer.repository.token';

describe('TransferService', () => {
  let service: TransferService;
  let mockRepository: jest.Mocked<TransferRepository>;

  beforeEach(async () => {
    const mockTransferRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCompanyId: jest.fn(),
      findAll: jest.fn(),
      findTransfersInLastMonth: jest.fn(),
      findTransfersByCompanyIdAndDateRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: TRANSFER_REPOSITORY_TOKEN,
          useValue: mockTransferRepository,
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    mockRepository = module.get(TRANSFER_REPOSITORY_TOKEN);
  });

  describe('getTransfersInLastMonth', () => {
    it('should return transfers from last month', async () => {
      const transfers = [
        new Transfer(
          '1',
          1000.50,
          'company-1',
          '001-123456-01',
          '002-654321-02',
          new Date(),
        ),
        new Transfer(
          '2',
          2500.75,
          'company-2',
          '003-789012-03',
          '004-345678-04',
          new Date(),
        ),
      ];

      mockRepository.findTransfersInLastMonth.mockResolvedValue(transfers);

      const result = await service.getTransfersInLastMonth();

      expect(mockRepository.findTransfersInLastMonth).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(1000.50);
      expect(result[1].amount).toBe(2500.75);
    });
  });

  describe('getTransfersByCompanyId', () => {
    it('should return transfers for specific company', async () => {
      const transfers = [
        new Transfer(
          '1',
          1000.50,
          'company-1',
          '001-123456-01',
          '002-654321-02',
          new Date(),
        ),
      ];

      mockRepository.findByCompanyId.mockResolvedValue(transfers);

      const result = await service.getTransfersByCompanyId('company-1');

      expect(mockRepository.findByCompanyId).toHaveBeenCalledWith('company-1');
      expect(result).toHaveLength(1);
      expect(result[0].companyId).toBe('company-1');
    });
  });

  describe('getTransferById', () => {
    it('should return transfer when found', async () => {
      const transfer = new Transfer(
        '1',
        1000.50,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        new Date(),
      );

      mockRepository.findById.mockResolvedValue(transfer);

      const result = await service.getTransferById('1');

      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(result.id).toBe('1');
      expect(result.amount).toBe(1000.50);
    });

    it('should throw NotFoundException when transfer not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getTransferById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});