// src/domain/value-objects/company-type.constants.ts

export const COMPANY_TYPES = {
  PYME: 'PYME',
  CORPORATE: 'CORPORATE',
} as const;

export type CompanyType = (typeof COMPANY_TYPES)[keyof typeof COMPANY_TYPES];
