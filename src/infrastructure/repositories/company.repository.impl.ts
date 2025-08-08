// src/infrastructure/repositories/company.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../domain/entities/company.base';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { CompanyFilter } from '../../application/services/company-query.service';
import { CompanyEntity } from '../database/entities/company.entity';
import { TransferEntity } from '../database/entities/transfer.entity';
import { CompanyMapper } from '../mappers/company.mapper';
import { CompanyFactory } from '../../domain/factories/company.factory';
import { CompanyType } from '../../domain/value-objects/company-type.constants';
import { Cuit } from '../../domain/value-objects/cuit';

@Injectable()
export class CompanyRepositoryImpl implements CompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyEntityRepository: Repository<CompanyEntity>,
    @InjectRepository(TransferEntity)
    private readonly transferEntityRepository: Repository<TransferEntity>,
  ) {}

  async save(company: Company): Promise<Company> {
    const entity = CompanyMapper.toEntity(company);
    const savedEntity = await this.companyEntityRepository.save(entity);
    return CompanyMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Company | null> {
    const entity = await this.companyEntityRepository.findOne({
      where: { id },
    });
    return entity ? CompanyMapper.toDomain(entity) : null;
  }

  async findByCuit(cuit: string | Cuit): Promise<Company | null> {
    // TypeORM will handle the transformation, so we can pass the object directly
    const cuitToSearch = typeof cuit === 'string' ? Cuit.create(cuit) : cuit;
    const entity = await this.companyEntityRepository.findOne({
      where: { cuit: cuitToSearch },
    });
    return entity ? CompanyMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Company[]> {
    const entities = await this.companyEntityRepository.find();
    return CompanyMapper.toDomainList(entities);
  }

  async findCompaniesByFilter(filter: CompanyFilter): Promise<Company[]> {
    // If no filters, return all companies (with pagination)
    if (
      !filter.joinedFrom &&
      !filter.joinedTo &&
      !filter.transferFrom &&
      !filter.transferTo
    ) {
      const entities = await this.companyEntityRepository
        .createQueryBuilder('c')
        .take(100) // Default page size
        .getMany();
      return CompanyMapper.toDomainList(entities);
    }

    // Build optimized query with EXISTS subquery for transfers
    const qb = this.companyEntityRepository
      .createQueryBuilder('c')
      .select([
        'c.id as c_id',
        'c.cuit as c_cuit',
        'c.businessName as c_business_name',
        'c.joinedAt as c_joined_at',
        'c.type as c_type',
      ]);

    // Company date filters (use indexes)
    if (filter.joinedFrom) {
      qb.andWhere('c.joinedAt >= :jf', { jf: filter.joinedFrom });
    }
    if (filter.joinedTo) {
      qb.andWhere('c.joinedAt <= :jt', { jt: filter.joinedTo });
    }

    // Transfer date filters using EXISTS subquery (avoids expensive JOINs)
    if (filter.transferFrom || filter.transferTo) {
      qb.andWhere((qb2) => {
        const subQuery = qb2
          .subQuery()
          .select('1')
          .from(TransferEntity, 't')
          .where('t.companyId = c.id');

        if (filter.transferFrom) {
          subQuery.andWhere('t.createdAt >= :tf', { tf: filter.transferFrom });
        }
        if (filter.transferTo) {
          subQuery.andWhere('t.createdAt <= :tt', { tt: filter.transferTo });
        }

        return `EXISTS (${subQuery.getQuery()})`;
      });
    }

    // Apply pagination
    qb.take(100);

    // Execute raw query for better performance
    const rows = await qb.getRawMany<{
      c_id: string;
      c_cuit: string;
      c_business_name: string;
      c_joined_at: Date;
      c_type: string;
    }>();

    // Map raw results to domain entities using factory
    return rows.map((row) =>
      CompanyFactory.create({
        id: row.c_id,
        cuit: row.c_cuit,
        businessName: row.c_business_name,
        type: row.c_type as CompanyType,
        joinedAt: row.c_joined_at,
      }),
    );
  }
}
