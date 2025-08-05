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
    // If no filters, return all companies (with pagination)
    if (!filter.joinedFrom && !filter.joinedTo && !filter.transferFrom && !filter.transferTo) {
      const entities = await this.companyEntityRepository
        .createQueryBuilder('c')
        .take(100) // Default page size
        .getMany();
      return entities.map(entity => this.entityToDomain(entity));
    }

    // Build optimized query with EXISTS subquery for transfers
    const qb = this.companyEntityRepository
      .createQueryBuilder('c')
      .select(['c.id', 'c.cuit', 'c.business_name', 'c.joined_at', 'c.type']);

    // Company date filters (use indexes)
    if (filter.joinedFrom) {
      qb.andWhere('c.joined_at >= :jf', { jf: filter.joinedFrom });
    }
    if (filter.joinedTo) {
      qb.andWhere('c.joined_at <= :jt', { jt: filter.joinedTo });
    }

    // Transfer date filters using EXISTS subquery (avoids expensive JOINs)
    if (filter.transferFrom || filter.transferTo) {
      qb.andWhere(qb2 => {
        const subQuery = qb2.subQuery()
          .select('1')
          .from(TransferEntity, 't')
          .where('t.company_id = c.id');

        if (filter.transferFrom) {
          subQuery.andWhere('t.created_at >= :tf', { tf: filter.transferFrom });
        }
        if (filter.transferTo) {
          subQuery.andWhere('t.created_at <= :tt', { tt: filter.transferTo });
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

    // Map raw results to domain entities
    return rows.map(row => new Company(
      row.c_id,
      row.c_cuit,
      row.c_business_name,
      row.c_joined_at,
      new CompanyTypeVO(row.c_type),
    ));
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