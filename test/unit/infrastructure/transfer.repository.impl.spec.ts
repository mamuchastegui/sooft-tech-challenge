// test/unit/infrastructure/transfer.repository.impl.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferRepositoryImpl } from '../../../src/infrastructure/repositories/transfer.repository.impl';
import { TransferEntity } from '../../../src/infrastructure/database/entities/transfer.entity';
import { Transfer } from '../../../src/domain/entities/transfer.entity';
import { Money } from '../../../src/domain/value-objects/money';
import { createCbuAccount, createAliasAccount } from '../../../src/domain/value-objects/account';

describe('TransferRepositoryImpl', () => {
  let repository: TransferRepositoryImpl;
  let mockTransferRepository: jest.Mocked<Repository<TransferEntity>>;

  beforeEach(async () => {
    const mockRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferRepositoryImpl,
        {
          provide: getRepositoryToken(TransferEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<TransferRepositoryImpl>(TransferRepositoryImpl);
    mockTransferRepository = module.get(getRepositoryToken(TransferEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('should save a transfer and return domain entity', async () => {
      const amount = Money.create(1000);
      const debitAccount = createCbuAccount('2850590940090418135201');
      const creditAccount = createAliasAccount('my.wallet');

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
        debitAccountType: 'CBU' as const,
        debitAccountValue: '2850590940090418135201',
        creditAccountType: 'ALIAS' as const,
        creditAccountValue: 'my.wallet',
        createdAt: expect.any(Date),
        company: undefined,
      };

      mockTransferRepository.save.mockResolvedValue(
        transferEntity as TransferEntity,
      );

      const result = await repository.save(transfer);

      expect(mockTransferRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Transfer);
      expect(result.id).toBe('1');
      expect(result.amount).toEqual(amount);
    });
  });

  describe('findById', () => {
    it('should return transfer when found', async () => {
      const transferEntity = {
        id: '1',
        amount: Money.create(1000),
        companyId: 'company-1',
        debitAccountType: 'CBU' as const,
        debitAccountValue: '2850590940090418135201',
        creditAccountType: 'ALIAS' as const,
        creditAccountValue: 'my.wallet',
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

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCompanyId', () => {
    it('should return transfers for company', async () => {
      const transferEntities = [
        {
          id: '1',
          amount: Money.create(1000),
          companyId: 'company-1',
          debitAccountType: 'CBU' as const,
          debitAccountValue: '2850590940090418135201',
          creditAccountType: 'ALIAS' as const,
          creditAccountValue: 'my.wallet',
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
      const transferEntities = [
        {
          id: '1',
          amount: Money.create(1000),
          companyId: 'company-1',
          debitAccountType: 'CBU' as const,
          debitAccountValue: '2850590940090418135201',
          creditAccountType: 'ALIAS' as const,
          creditAccountValue: 'my.wallet',
          createdAt: new Date(),
          company: undefined,
        },
      ];

      mockTransferRepository.find.mockResolvedValue(
        transferEntities as TransferEntity[],
      );

      const result = await repository.findAll();

      expect(mockTransferRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Transfer);
    });
  });

  describe('findTransfersByCompanyIdAndDateRange', () => {
    it('should return transfers within date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const transferEntities = [
        {
          id: '1',
          amount: Money.create(1000),
          companyId: 'company-1',
          debitAccountType: 'CBU' as const,
          debitAccountValue: '2850590940090418135201',
          creditAccountType: 'ALIAS' as const,
          creditAccountValue: 'my.wallet',
          createdAt: new Date(),
          company: undefined,
        },
      ];

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(transferEntities),
      };

      mockTransferRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await repository.findTransfersByCompanyIdAndDateRange(
        'company-1',
        startDate,
        endDate,
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
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Transfer);
    });
  });
});