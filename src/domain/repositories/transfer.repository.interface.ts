// src/domain/repositories/transfer.repository.interface.ts

import { Transfer } from '../entities/transfer.entity';

export interface TransferRepository {
  save(transfer: Transfer): Promise<Transfer>;
  findById(id: string): Promise<Transfer | null>;
  findByCompanyId(companyId: string): Promise<Transfer[]>;
  findAll(): Promise<Transfer[]>;
  findTransfersByCompanyIdAndDateRange(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transfer[]>;
}