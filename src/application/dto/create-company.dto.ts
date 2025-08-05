// src/application/dto/create-company.dto.ts

import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { CompanyType } from '../../domain/value-objects/company-type.value-object';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}-\d{8}-\d{1}$/, {
    message: 'CUIT must follow the format XX-XXXXXXXX-X',
  })
  cuit: string;

  @IsNotEmpty()
  @IsString()
  businessName: string;

  @IsEnum(CompanyType, {
    message: 'Type must be either PYME or CORPORATE',
  })
  type: CompanyType;
}