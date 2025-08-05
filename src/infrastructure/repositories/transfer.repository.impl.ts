// src/infrastructure/repositories/transfer.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferRepository } from '../../domain/repositories/transfer.repository.interface';
import { MockData } from '../database/mock-data';

@Injectable()
export class TransferRepositoryImpl implements TransferRepository {
  async save(transfer: Transfer): Promise<Transfer> {
    MockData.addTransfer(transfer);
    return transfer;
  }

  async findById(id: string): Promise<Transfer | null> {
    const transfers = MockData.getTransfers();
    return transfers.find(transfer => transfer.id === id) || null;
  }

  async findByCompanyId(companyId: string): Promise<Transfer[]> {
    const transfers = MockData.getTransfers();
    return transfers.filter(transfer => transfer.companyId === companyId);
  }

  async findAll(): Promise<Transfer[]> {
    return MockData.getTransfers();
  }

  async findTransfersInLastMonth(): Promise<Transfer[]> {
    const transfers = MockData.getTransfers();
    return transfers.filter(transfer => transfer.isCreatedInLastMonth());
  }

  async findTransfersByCompanyIdAndDateRange(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transfer[]> {
    const transfers = MockData.getTransfers();
    return transfers.filter(
      transfer =>
        transfer.companyId === companyId &&
        transfer.createdAt >= startDate &&
        transfer.createdAt <= endDate,
    );
  }
}