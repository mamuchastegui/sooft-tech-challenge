// src/application/dto/company-joined-monthly.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CompanyJoinedMonthlyDto {
  @ApiProperty({
    description: 'ID único de la empresa',
    example: 'db6da64e-482c-4e29-a7c6-31817cf5ad86',
  })
  id: string;

  @ApiProperty({
    description: 'CUIT de la empresa',
    example: '30-12345678-1',
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
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Tipo de empresa',
    example: 'CORPORATE',
    enum: ['PYME', 'CORPORATE'],
  })
  type: string;
}
