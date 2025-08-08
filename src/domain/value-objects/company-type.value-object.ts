// src/domain/value-objects/company-type.value-object.ts

import { COMPANY_TYPES, CompanyType } from './company-type.constants';

export class CompanyTypeValueObject {
  private readonly value: CompanyType;

  constructor(value: string) {
    if (!Object.values(COMPANY_TYPES).includes(value as CompanyType)) {
      throw new Error(`Invalid company type: ${value}`);
    }
    this.value = value as CompanyType;
  }

  getValue(): CompanyType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: CompanyTypeValueObject): boolean {
    return this.value === other.value;
  }
}
