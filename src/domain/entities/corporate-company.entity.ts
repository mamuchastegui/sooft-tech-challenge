// src/domain/entities/corporate-company.entity.ts

import { Company } from './company.base';
import { TieredPolicy } from '../policies/tiered.policy';
import { CorporateLimitPolicy } from '../policies/corporate-limit.policy';
import {
  COMPANY_TYPES,
  CompanyType,
} from '../value-objects/company-type.constants';
import { Cuit } from '../value-objects/cuit.vo';

export class CorporateCompany extends Company {
  constructor(id: string, cuit: Cuit, businessName: string, joinedAt: Date) {
    super(
      id,
      cuit,
      businessName,
      joinedAt,
      new TieredPolicy(),
      new CorporateLimitPolicy(),
    );
  }

  getType(): CompanyType {
    return COMPANY_TYPES.CORPORATE;
  }

  // Corporate-specific business logic can be added here
  isEligibleForGovernmentSupport(): boolean {
    // Business rule: Corporate companies are not eligible for government support
    return false;
  }

  getRequiredDocuments(): string[] {
    return [
      'CUIT Certificate',
      'AFIP Registration',
      'Bank Account Statement',
      'Corporate Articles',
      'Board Resolution',
      'Audited Financial Statements',
    ];
  }

  requiresComplianceReporting(): boolean {
    // Corporate companies require additional compliance reporting
    return true;
  }
}
