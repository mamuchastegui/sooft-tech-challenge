// src/domain/factories/company.factory.ts

import { v4 as uuidv4 } from 'uuid';
import { Company } from '../entities/company.base';
import { PymeCompany } from '../entities/pyme-company.entity';
import { CorporateCompany } from '../entities/corporate-company.entity';
import {
  COMPANY_TYPES,
  CompanyType,
} from '../value-objects/company-type.constants';
import { Cuit } from '../value-objects/cuit.vo';

export interface CreateCompanyData {
  cuit: string | Cuit;
  businessName: string;
  type: CompanyType;
  joinedAt?: Date;
  id?: string;
}

export class CompanyFactory {
  static create(data: CreateCompanyData): Company {
    const id = data.id || uuidv4();
    const joinedAt = data.joinedAt || new Date();
    const cuit =
      typeof data.cuit === 'string' ? Cuit.create(data.cuit) : data.cuit;

    switch (data.type) {
      case COMPANY_TYPES.PYME:
        return new PymeCompany(id, cuit, data.businessName, joinedAt);
      case COMPANY_TYPES.CORPORATE:
        return new CorporateCompany(id, cuit, data.businessName, joinedAt);
      default:
        throw new Error(`Unknown company type: ${data.type}`);
    }
  }

  static createPyme(
    cuit: string | Cuit,
    businessName: string,
    joinedAt?: Date,
    id?: string,
  ): PymeCompany {
    const cuitVO = typeof cuit === 'string' ? Cuit.create(cuit) : cuit;
    return new PymeCompany(
      id || uuidv4(),
      cuitVO,
      businessName,
      joinedAt || new Date(),
    );
  }

  static createCorporate(
    cuit: string | Cuit,
    businessName: string,
    joinedAt?: Date,
    id?: string,
  ): CorporateCompany {
    const cuitVO = typeof cuit === 'string' ? Cuit.create(cuit) : cuit;
    return new CorporateCompany(
      id || uuidv4(),
      cuitVO,
      businessName,
      joinedAt || new Date(),
    );
  }
}
