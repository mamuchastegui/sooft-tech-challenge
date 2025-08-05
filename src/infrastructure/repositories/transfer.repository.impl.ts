// src/infrastructure/repositories/transfer.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferRepository } from '../../domain/repositories/transfer.repository.interface';
import { TransferEntity } from '../database/entities/transfer.entity';

@Injectable()
export class TransferRepositoryImpl implements TransferRepository {
  constructor(
    @InjectRepository(TransferEntity)
    private readonly transferEntityRepository: Repository<TransferEntity>,
  ) {}

  async save(transfer: Transfer): Promise<Transfer> {
    const plainObject = transfer.toPlainObject();
    const transferEntity = this.transferEntityRepository.create({
      id: plainObject.id,
      amount: plainObject.amount,
      companyId: plainObject.companyId,
      debitAccount: plainObject.debitAccount,
      creditAccount: plainObject.creditAccount,
      createdAt: plainObject.createdAt,
    });

    const savedEntity =
      await this.transferEntityRepository.save(transferEntity);
    return this.entityToDomain(savedEntity);
  }

  async findById(id: string): Promise<Transfer | null> {
    const entity = await this.transferEntityRepository.findOne({
      where: { id },
    });
    return entity ? this.entityToDomain(entity) : null;
  }

  async findByCompanyId(companyId: string): Promise<Transfer[]> {
    const entities = await this.transferEntityRepository.find({
      where: { companyId },
    });
    return entities.map((entity) => this.entityToDomain(entity));
  }

  async findAll(): Promise<Transfer[]> {
    const entities = await this.transferEntityRepository.find();
    return entities.map((entity) => this.entityToDomain(entity));
  }

  async findTransfersByCompanyIdAndDateRange(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transfer[]> {
    const entities = await this.transferEntityRepository
      .createQueryBuilder('transfer')
      .where('transfer.companyId = :companyId', { companyId })
      .andWhere('transfer.createdAt >= :startDate', { startDate })
      .andWhere('transfer.createdAt <= :endDate', { endDate })
      .getMany();

    return entities.map((entity) => this.entityToDomain(entity));
  }

  private entityToDomain(entity: TransferEntity): Transfer {
    return new Transfer(
      entity.id,
      entity.amount,
      entity.companyId,
      entity.debitAccount,
      entity.creditAccount,
      entity.createdAt,
    );
  }
}
