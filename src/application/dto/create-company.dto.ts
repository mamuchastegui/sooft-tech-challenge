// src/application/dto/create-company.dto.ts

import { IsNotEmpty, IsString, IsIn, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  CompanyType,
  COMPANY_TYPES,
} from '../../domain/value-objects/company-type.constants';
import { CuitValidator } from './validators/cuit.validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'CUIT de la empresa en formato XX-XXXXXXXX-X',
    example: '30-12345678-1',
    pattern: '^\\d{2}-\\d{8}-\\d{1}$',
  })
  @IsNotEmpty()
  @IsString()
  @Validate(CuitValidator)
  cuit: string;

  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Tech Solutions SA',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Tipo de empresa',
    enum: COMPANY_TYPES,
    example: COMPANY_TYPES.CORPORATE,
  })
  @IsIn(Object.values(COMPANY_TYPES), {
    message: 'Type must be either PYME or CORPORATE',
  })
  type: CompanyType;
}
