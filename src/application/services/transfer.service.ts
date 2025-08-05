// src/application/services/transfer.service.ts

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferRepository } from '../../domain/repositories/transfer.repository.interface';
import { TransferResponseDto } from '../dto/transfer-response.dto';
import { TRANSFER_REPOSITORY_TOKEN } from '../../domain/repositories/transfer.repository.token';

@Injectable()
export class TransferService {
  constructor(
    @Inject(TRANSFER_REPOSITORY_TOKEN)
    private readonly transferRepository: TransferRepository,
  ) {}

  async getTransfersInLastMonth(): Promise<TransferResponseDto[]> {
    const transfers = await this.transferRepository.findTransfersInLastMonth();
    
    return transfers.map(transfer => {
      const plainObject = transfer.toPlainObject();
      return new TransferResponseDto(
        plainObject.id,
        plainObject.amount,
        plainObject.companyId,
        plainObject.debitAccount,
        plainObject.creditAccount,
        plainObject.createdAt,
      );
    });
  }

  async getTransfersByCompanyId(companyId: string): Promise<TransferResponseDto[]> {
    const transfers = await this.transferRepository.findByCompanyId(companyId);
    
    return transfers.map(transfer => {
      const plainObject = transfer.toPlainObject();
      return new TransferResponseDto(
        plainObject.id,
        plainObject.amount,
        plainObject.companyId,
        plainObject.debitAccount,
        plainObject.creditAccount,
        plainObject.createdAt,
      );
    });
  }

  async getTransferById(id: string): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository.findById(id);
    
    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${id} not found`);
    }

    const plainObject = transfer.toPlainObject();
    return new TransferResponseDto(
      plainObject.id,
      plainObject.amount,
      plainObject.companyId,
      plainObject.debitAccount,
      plainObject.creditAccount,
      plainObject.createdAt,
    );
  }
}