// src/infrastructure/mappers/company.mapper.ts

import { Company } from '../../domain/entities/company.base';
import {
  CompanyEntity,
  PymeCompanyEntity,
  CorporateCompanyEntity,
} from '../database/entities/company.entity';
import { CompanyFactory } from '../../domain/factories/company.factory';
import {
  COMPANY_TYPES,
  CompanyType,
} from '../../domain/value-objects/company-type.constants';

export class CompanyMapper {
  static toDomain(entity: CompanyEntity): Company {
    return CompanyFactory.create({
      id: entity.id,
      cuit: entity.cuit,
      businessName: entity.businessName,
      type: entity.type as CompanyType,
      joinedAt: entity.joinedAt,
    });
  }

  static toEntity(domain: Company): CompanyEntity {
    const type = domain.getType();

    let entity: CompanyEntity;

    if (type === COMPANY_TYPES.PYME) {
      entity = new PymeCompanyEntity();
    } else if (type === COMPANY_TYPES.CORPORATE) {
      entity = new CorporateCompanyEntity();
    } else {
      throw new Error(`Unknown company type: ${type}`);
    }

    entity.id = domain.id;
    entity.cuit = domain.cuit;
    entity.businessName = domain.businessName;
    entity.joinedAt = domain.joinedAt;
    entity.type = domain.getType();

    return entity;
  }

  static updateEntity(entity: CompanyEntity, domain: Company): CompanyEntity {
    // Only update mutable fields (business name in this case)
    entity.businessName = domain.businessName;
    return entity;
  }

  static toDomainList(entities: CompanyEntity[]): Company[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  static toEntityList(domains: Company[]): CompanyEntity[] {
    return domains.map((domain) => this.toEntity(domain));
  }
}
