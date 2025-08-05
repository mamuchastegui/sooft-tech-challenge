// src/infrastructure/repositories/company.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../domain/entities/company.entity';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { CompanyFilter } from '../../application/services/company-query.service';
import { CompanyEntity } from '../database/entities/company.entity';
import { TransferEntity } from '../database/entities/transfer.entity';
import { CompanyTypeVO } from '../../domain/value-objects/company-type.value-object';

@Injectable()
export class CompanyRepositoryImpl implements CompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyEntityRepository: Repository<CompanyEntity>,
    @InjectRepository(TransferEntity)
    private readonly transferEntityRepository: Repository<TransferEntity>,
  ) {}

  async save(company: Company): Promise<Company> {
    const plainObject = company.toPlainObject();
    const companyEntity = this.companyEntityRepository.create({
      id: plainObject.id,
      cuit: plainObject.cuit,
      businessName: plainObject.businessName,
      joinedAt: plainObject.joinedAt,
      type: plainObject.type,
    });

    const savedEntity = await this.companyEntityRepository.save(companyEntity);
    return this.entityToDomain(savedEntity);
  }

  async findById(id: string): Promise<Company | null> {
    const entity = await this.companyEntityRepository.findOne({ where: { id } });
    return entity ? this.entityToDomain(entity) : null;
  }

  async findByCuit(cuit: string): Promise<Company | null> {
    const entity = await this.companyEntityRepository.findOne({ where: { cuit } });
    return entity ? this.entityToDomain(entity) : null;
  }

  async findAll(): Promise<Company[]> {
    const entities = await this.companyEntityRepository.find();
    return entities.map(entity => this.entityToDomain(entity));
  }


  async findCompaniesByFilter(filter: CompanyFilter): Promise<Company[]> {
    const queryBuilder = this.companyEntityRepository.createQueryBuilder('company');

    if (filter.joinedFrom || filter.joinedTo) {
      if (filter.joinedFrom) {
        queryBuilder.andWhere('company.joinedAt >= :joinedFrom', { joinedFrom: filter.joinedFrom });
      }
      if (filter.joinedTo) {
        queryBuilder.andWhere('company.joinedAt <= :joinedTo', { joinedTo: filter.joinedTo });
      }
    }

    if (filter.transferFrom || filter.transferTo) {
      queryBuilder.innerJoin('company.transfers', 'transfer');
      
      if (filter.transferFrom) {
        queryBuilder.andWhere('transfer.createdAt >= :transferFrom', { transferFrom: filter.transferFrom });
      }
      if (filter.transferTo) {
        queryBuilder.andWhere('transfer.createdAt <= :transferTo', { transferTo: filter.transferTo });
      }
    }

    // If no filters, return all companies
    if (!filter.joinedFrom && !filter.joinedTo && !filter.transferFrom && !filter.transferTo) {
      return this.findAll();
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.entityToDomain(entity));
  }

  private entityToDomain(entity: CompanyEntity): Company {
    return new Company(
      entity.id,
      entity.cuit,
      entity.businessName,
      entity.joinedAt,
      new CompanyTypeVO(entity.type),
    );
  }
}