// src/domain/value-objects/company-type.value-object.ts

export enum CompanyType {
  PYME = 'PYME',
  CORPORATE = 'CORPORATE',
}

export class CompanyTypeVO {
  private readonly value: CompanyType;

  constructor(value: string) {
    if (!Object.values(CompanyType).includes(value as CompanyType)) {
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

  equals(other: CompanyTypeVO): boolean {
    return this.value === other.value;
  }
}