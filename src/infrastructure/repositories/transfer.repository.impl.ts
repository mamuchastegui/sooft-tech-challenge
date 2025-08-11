// src/infrastructure/repositories/transfer.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferRepository } from '../../domain/repositories/transfer.repository.interface';
import { TransferEntity } from '../database/entities/transfer.entity';
import { TransferMapper } from '../mappers/transfer.mapper';

@Injectable()
export class TransferRepositoryImpl implements TransferRepository {
  constructor(
    @InjectRepository(TransferEntity)
    private readonly transferEntityRepository: Repository<TransferEntity>,
  ) {}

  async save(transfer: Transfer): Promise<Transfer> {
    const transferEntity = TransferMapper.toEntity(transfer);
    const savedEntity = await this.transferEntityRepository.save(transferEntity);
    return TransferMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Transfer | null> {
    const entity = await this.transferEntityRepository.findOne({
      where: { id },
    });
    return entity ? TransferMapper.toDomain(entity) : null;
  }

  async findByCompanyId(companyId: string): Promise<Transfer[]> {
    const entities = await this.transferEntityRepository.find({
      where: { companyId },
    });
    return TransferMapper.toDomainList(entities);
  }

  async findAll(): Promise<Transfer[]> {
    const entities = await this.transferEntityRepository.find();
    return TransferMapper.toDomainList(entities);
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

    return TransferMapper.toDomainList(entities);
  }
}
