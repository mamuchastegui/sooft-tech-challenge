// src/domain/entities/pyme-company.entity.ts

import { Company } from './company.base';
import { FlatRatePolicy } from '../policies/flat-rate.policy';
import { PymeLimitPolicy } from '../policies/pyme-limit.policy';
import {
  COMPANY_TYPES,
  CompanyType,
} from '../value-objects/company-type.constants';
import { Cuit } from '../value-objects/cuit';

export class PymeCompany extends Company {
  constructor(id: string, cuit: Cuit, businessName: string, joinedAt: Date) {
    super(
      id,
      cuit,
      businessName,
      joinedAt,
      new FlatRatePolicy(),
      new PymeLimitPolicy(),
    );
  }

  getType(): CompanyType {
    return COMPANY_TYPES.PYME;
  }

  // PYME-specific business logic can be added here
  isEligibleForGovernmentSupport(): boolean {
    // Business rule: PYME companies are eligible for government support
    return true;
  }

  getRequiredDocuments(): string[] {
    return [
      'CUIT Certificate',
      'AFIP Registration',
      'Bank Account Statement',
      'PYME Certificate',
    ];
  }
}
