// src/application/dto/company-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { CompanyType, COMPANY_TYPES } from '../../domain/value-objects/company-type.constants';

export class CompanyResponseDto {
  @ApiProperty({
    description: 'ID único de la empresa',
    example: 'db6da64e-482c-4e29-a7c6-31817cf5ad86',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'CUIT de la empresa',
    example: '30-12345678-1',
    pattern: '^\\d{2}-\\d{8}-\\d{1}$',
  })
  cuit: string;

  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Tech Solutions SA',
  })
  businessName: string;

  @ApiProperty({
    description: 'Fecha de adhesión de la empresa',
    example: '2023-12-01T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Tipo de empresa',
    enum: COMPANY_TYPES,
    example: COMPANY_TYPES.CORPORATE,
  })
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
