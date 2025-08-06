// src/application/dto/company-monthly.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CompanyMonthlyDto {
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

  @ApiProperty({
    description: 'Cantidad de transferencias en el último mes',
    example: 5,
    minimum: 1,
  })
  transferCount: number;

  @ApiProperty({
    description: 'Monto total de transferencias en el último mes',
    example: '150000.50',
    type: 'string',
  })
  totalAmount: string; // numeric in PG maps to string
}
