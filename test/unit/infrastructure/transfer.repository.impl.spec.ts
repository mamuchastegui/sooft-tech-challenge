// test/unit/infrastructure/transfer.repository.impl.spec.ts

import { TransferRepositoryImpl } from '../../../src/infrastructure/repositories/transfer.repository.impl';
import { Transfer } from '../../../src/domain/entities/transfer.entity';
import { MockData } from '../../../src/infrastructure/database/mock-data';

jest.mock('../../../src/infrastructure/database/mock-data');

describe('TransferRepositoryImpl', () => {
  let repository: TransferRepositoryImpl;
  let mockDataSpy: jest.Mocked<typeof MockData>;

  beforeEach(() => {
    repository = new TransferRepositoryImpl();
    mockDataSpy = MockData as jest.Mocked<typeof MockData>;
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a transfer', async () => {
      const transfer = new Transfer(
        '1',
        1000.50,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        new Date(),
      );

      mockDataSpy.addTransfer = jest.fn();

      const result = await repository.save(transfer);

      expect(mockDataSpy.addTransfer).toHaveBeenCalledWith(transfer);
      expect(result).toBe(transfer);
    });
  });

  describe('findById', () => {
    it('should find transfer by id', async () => {
      const transfer = new Transfer(
        '1',
        1000.50,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        new Date(),
      );

      mockDataSpy.getTransfers.mockReturnValue([transfer]);

      const result = await repository.findById('1');

      expect(result).toBe(transfer);
    });

    it('should return null when transfer not found', async () => {
      mockDataSpy.getTransfers.mockReturnValue([]);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByCompanyId', () => {
    it('should find transfers by company id', async () => {
      const transfer1 = new Transfer(
        '1',
        1000.50,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        new Date(),
      );

      const transfer2 = new Transfer(
        '2',
        2000.75,
        'company-1',
        '003-789012-03',
        '004-345678-04',
        new Date(),
      );

      const transfer3 = new Transfer(
        '3',
        1500.25,
        'company-2',
        '005-111222-05',
        '006-333444-06',
        new Date(),
      );

      mockDataSpy.getTransfers.mockReturnValue([transfer1, transfer2, transfer3]);

      const result = await repository.findByCompanyId('company-1');

      expect(result).toHaveLength(2);
      expect(result).toContain(transfer1);
      expect(result).toContain(transfer2);
      expect(result).not.toContain(transfer3);
    });
  });

  describe('findTransfersInLastMonth', () => {
    it('should return transfers from last month', async () => {
      const recentTransfer = new Transfer(
        '1',
        1000.50,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        new Date(),
      );

      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 2);
      const oldTransfer = new Transfer(
        '2',
        2000.75,
        'company-2',
        '003-789012-03',
        '004-345678-04',
        oldDate,
      );

      mockDataSpy.getTransfers.mockReturnValue([recentTransfer, oldTransfer]);

      const result = await repository.findTransfersInLastMonth();

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(recentTransfer);
    });
  });

  describe('findTransfersByCompanyIdAndDateRange', () => {
    it('should find transfers by company id and date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const withinRangeDate = new Date('2023-06-15');
      const outsideRangeDate = new Date('2024-01-15');

      const matchingTransfer = new Transfer(
        '1',
        1000.50,
        'company-1',
        '001-123456-01',
        '002-654321-02',
        withinRangeDate,
      );

      const nonMatchingTransfer = new Transfer(
        '2',
        2000.75,
        'company-1',
        '003-789012-03',
        '004-345678-04',
        outsideRangeDate,
      );

      mockDataSpy.getTransfers.mockReturnValue([matchingTransfer, nonMatchingTransfer]);

      const result = await repository.findTransfersByCompanyIdAndDateRange(
        'company-1',
        startDate,
        endDate,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(matchingTransfer);
    });
  });
});