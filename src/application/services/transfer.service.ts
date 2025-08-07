// src/application/services/transfer.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { TransferRepository } from '../../domain/repositories/transfer.repository.interface';
import { TransferResponseDto } from '../dto/transfer-response.dto';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { TRANSFER_REPOSITORY_TOKEN } from '../../domain/repositories/transfer.repository.token';
import { COMPANY_REPOSITORY_TOKEN } from '../../domain/repositories/company.repository.token';
import { Money } from '../../domain/value-objects/money.vo';
import { AccountId } from '../../domain/value-objects/account-id.vo';
import { Transfer } from '../../domain/entities/transfer.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransferService {
  constructor(
    @Inject(TRANSFER_REPOSITORY_TOKEN)
    private readonly transferRepository: TransferRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async createTransfer(
    createTransferDto: CreateTransferDto,
  ): Promise<TransferResponseDto> {
    // Validate company exists
    const company = await this.companyRepository.findById(
      createTransferDto.companyId,
    );
    if (!company) {
      throw new NotFoundException(
        `Company with ID ${createTransferDto.companyId} not found`,
      );
    }

    // Create Value Objects with validation
    const amount = Money.create(createTransferDto.amount);
    const debitAccount = AccountId.create(createTransferDto.debitAccount);
    const creditAccount = AccountId.create(createTransferDto.creditAccount);

    // Validate transfer limits using the company's policies
    const maxTransferAmount = Money.create(company.getMaxTransferAmount());
    if (amount.isGreaterThan(maxTransferAmount)) {
      throw new BadRequestException(
        `Transfer amount ${amount.toCurrencyString()} exceeds maximum allowed ${maxTransferAmount.toCurrencyString()} for ${company.getType()} companies`,
      );
    }

    // Create transfer domain entity
    const transfer = new Transfer(
      uuidv4(),
      amount,
      createTransferDto.companyId,
      debitAccount,
      creditAccount,
      new Date(),
    );

    // Save the transfer
    const savedTransfer = await this.transferRepository.save(transfer);

    // Return DTO
    const plainObject = savedTransfer.toPlainObject();
    return new TransferResponseDto(
      plainObject.id,
      plainObject.amount,
      plainObject.companyId,
      plainObject.debitAccount,
      plainObject.creditAccount,
      plainObject.createdAt,
    );
  }

  async getTransfersByCompanyId(
    companyId: string,
  ): Promise<TransferResponseDto[]> {
    const transfers = await this.transferRepository.findByCompanyId(companyId);

    return transfers.map((transfer) => {
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
