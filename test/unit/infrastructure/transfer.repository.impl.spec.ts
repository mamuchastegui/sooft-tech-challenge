// test/unit/infrastructure/transfer.repository.impl.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferRepositoryImpl } from '../../../src/infrastructure/repositories/transfer.repository.impl';
import { Transfer } from '../../../src/domain/entities/transfer.entity';
import { TransferEntity } from '../../../src/infrastructure/database/entities/transfer.entity';

describe('TransferRepositoryImpl', () => {
  let repository: TransferRepositoryImpl;
  let mockTransferRepository: jest.Mocked<Repository<TransferEntity>>;

  beforeEach(async () => {
    const mockTransferRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferRepositoryImpl,
        {
          provide: getRepositoryToken(TransferEntity),
          useValue: mockTransferRepo,
        },
      ],
    }).compile();

    repository = module.get<TransferRepositoryImpl>(TransferRepositoryImpl);
    mockTransferRepository = module.get(getRepositoryToken(TransferEntity));
  });

  describe('save', () => {
    it('should save a transfer successfully', async () => {
      const transfer = new Transfer(
        '1',
        1000.5,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        new Date(),
      );

      const transferEntity = {
        id: '1',
        amount: 1000.5,
        companyId: 'company-1',
        debitAccount: '001-123456-01',
        creditAccount: '002-654321-02',
        createdAt: expect.any(Date),
      };

      mockTransferRepository.create.mockReturnValue(
        transferEntity as TransferEntity,
      );
      mockTransferRepository.save.mockResolvedValue(
        transferEntity as TransferEntity,
      );

      const result = await repository.save(transfer);

      expect(mockTransferRepository.create).toHaveBeenCalledWith({
        id: '1',
        amount: 1000.5,
        companyId: 'company-1',
        debitAccount: '001-123456-01',
        creditAccount: '002-654321-02',
        createdAt: expect.any(Date),
      });
      expect(mockTransferRepository.save).toHaveBeenCalledWith(transferEntity);
      expect(result).toBeInstanceOf(Transfer);
    });
  });

  describe('findById', () => {
    it('should return a transfer when found', async () => {
      const transferEntity = {
        id: '1',
        amount: 1000.5,
        companyId: 'company-1',
        debitAccount: '001-123456-01',
        creditAccount: '002-654321-02',
        createdAt: new Date(),
      };

      mockTransferRepository.findOne.mockResolvedValue(
        transferEntity as TransferEntity,
      );

      const result = await repository.findById('1');

      expect(mockTransferRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toBeInstanceOf(Transfer);
      expect(result?.id).toBe('1');
    });

    it('should return null when not found', async () => {
      mockTransferRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('1');

      expect(result).toBeNull();
    });
  });

  describe('findByCompanyId', () => {
    it('should return transfers for a specific company', async () => {
      const transferEntities = [
        {
          id: '1',
          amount: 1000.5,
          companyId: 'company-1',
          debitAccount: '001-123456-01',
          creditAccount: '002-654321-02',
          createdAt: new Date(),
        },
      ];

      mockTransferRepository.find.mockResolvedValue(
        transferEntities as TransferEntity[],
      );

      const result = await repository.findByCompanyId('company-1');

      expect(mockTransferRepository.find).toHaveBeenCalledWith({
        where: { companyId: 'company-1' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Transfer);
    });
  });

  describe('findAll', () => {
    it('should return all transfers', async () => {
      const transferEntities = [
        {
          id: '1',
          amount: 1000.5,
          companyId: 'company-1',
          debitAccount: '001-123456-01',
          creditAccount: '002-654321-02',
          createdAt: new Date(),
        },
        {
          id: '2',
          amount: 2500.75,
          companyId: 'company-2',
          debitAccount: '003-789012-03',
          creditAccount: '004-345678-04',
          createdAt: new Date(),
        },
      ];

      mockTransferRepository.find.mockResolvedValue(
        transferEntities as TransferEntity[],
      );

      const result = await repository.findAll();

      expect(mockTransferRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Transfer);
      expect(result[1]).toBeInstanceOf(Transfer);
    });
  });

  describe('findTransfersByCompanyIdAndDateRange', () => {
    it('should find transfers by company and date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any;

      mockTransferRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findTransfersByCompanyIdAndDateRange(
        'company-1',
        startDate,
        endDate,
      );

      expect(mockTransferRepository.createQueryBuilder).toHaveBeenCalledWith(
        'transfer',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'transfer.companyId = :companyId',
        { companyId: 'company-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'transfer.createdAt >= :startDate',
        { startDate },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'transfer.createdAt <= :endDate',
        { endDate },
      );
      expect(result).toEqual([]);
    });
  });
});
