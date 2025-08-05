// src/domain/entities/company.entity.ts

import { CompanyTypeVO } from '../value-objects/company-type.value-object';

export class Company {
  constructor(
    public readonly id: string,
    public readonly cuit: string,
    public readonly businessName: string,
    public readonly joinedAt: Date,
    public readonly type: CompanyTypeVO,
  ) {
    this.validateCuit(cuit);
    this.validateBusinessName(businessName);
  }

  private validateCuit(cuit: string): void {
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (!cuitRegex.test(cuit)) {
      throw new Error('Invalid CUIT format. Expected: XX-XXXXXXXX-X');
    }
  }

  private validateBusinessName(businessName: string): void {
    if (!businessName || businessName.trim().length === 0) {
      throw new Error('Business name cannot be empty');
    }
    if (businessName.length > 255) {
      throw new Error('Business name cannot exceed 255 characters');
    }
  }


  public toPlainObject() {
    return {
      id: this.id,
      cuit: this.cuit,
      businessName: this.businessName,
      joinedAt: this.joinedAt,
      type: this.type.getValue(),
    };
  }
}