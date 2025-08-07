// test/unit/infrastructure/transfer.repository.impl.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferRepositoryImpl } from '../../../src/infrastructure/repositories/transfer.repository.impl';
import { Transfer } from '../../../src/domain/entities/transfer.entity';
import { TransferEntity } from '../../../src/infrastructure/database/entities/transfer.entity';
import { Money } from '../../../src/domain/value-objects/money.vo';
import { AccountId } from '../../../src/domain/value-objects/account-id.vo';

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

      const transferEntity = {
        id: '1',
        amount,
        companyId: 'company-1',
        debitAccount,
        creditAccount,
        createdAt: expect.any(Date),
        company: undefined,
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
        debitAccount: '1234567890123',
        creditAccount: '9876543210987',
        createdAt: expect.any(Date),
      });
      expect(mockTransferRepository.save).toHaveBeenCalledWith(transferEntity);
      expect(result).toBeInstanceOf(Transfer);
    });
  });

  describe('findById', () => {
    it('should return a transfer when found', async () => {
      const amount = Money.create(1000.5);
      const debitAccount = AccountId.create('1234567890123');
      const creditAccount = AccountId.create('9876543210987');

      const transferEntity = {
        id: '1',
        amount,
        companyId: 'company-1',
        debitAccount,
        creditAccount,
        createdAt: new Date(),
        company: undefined,
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
      const amount = Money.create(1000.5);
      const debitAccount = AccountId.create('1234567890123');
      const creditAccount = AccountId.create('9876543210987');

      const transferEntities = [
        {
          id: '1',
          amount,
          companyId: 'company-1',
          debitAccount,
          creditAccount,
          createdAt: new Date(),
          company: undefined,
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
      const amount1 = Money.create(1000.5);
      const amount2 = Money.create(2500.75);
      const debitAccount1 = AccountId.create('1234567890123');
      const creditAccount1 = AccountId.create('9876543210987');
      const debitAccount2 = AccountId.create('1111111111111');
      const creditAccount2 = AccountId.create('2222222222222');

      const transferEntities = [
        {
          id: '1',
          amount: amount1,
          companyId: 'company-1',
          debitAccount: debitAccount1,
          creditAccount: creditAccount1,
          createdAt: new Date(),
          company: undefined,
        },
        {
          id: '2',
          amount: amount2,
          companyId: 'company-2',
          debitAccount: debitAccount2,
          creditAccount: creditAccount2,
          createdAt: new Date(),
          company: undefined,
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
