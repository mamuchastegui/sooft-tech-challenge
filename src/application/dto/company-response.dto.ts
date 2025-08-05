// src/application/dto/company-response.dto.ts

import { CompanyType } from '../../domain/value-objects/company-type.value-object';

export class CompanyResponseDto {
  id: string;
  cuit: string;
  businessName: string;
  joinedAt: Date;
  type: CompanyType;

  constructor(
    id: string,
    cuit: string,
    businessName: string,
    joinedAt: Date,
    type: CompanyType,
  ) {
    this.id = id;
    this.cuit = cuit;
    this.businessName = businessName;
    this.joinedAt = joinedAt;
    this.type = type;
  }
}
