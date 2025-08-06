// src/application/dto/create-company.dto.ts

import { IsNotEmpty, IsString, Matches, IsIn } from 'class-validator';
import {
  CompanyType,
  COMPANY_TYPES,
} from '../../domain/value-objects/company-type.constants';

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

  @IsIn(Object.values(COMPANY_TYPES), {
    message: 'Type must be either PYME or CORPORATE',
  })
  type: CompanyType;
}
