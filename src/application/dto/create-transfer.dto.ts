// src/application/dto/create-transfer.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  Matches,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTransferDto {
  @ApiProperty({
    description: 'Transfer amount in currency units',
    example: 1000.5,
    type: 'number',
    format: 'double',
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must have at most 2 decimal places' },
  )
  @IsPositive({ message: 'Amount must be greater than zero' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Company ID that owns this transfer',
    example: 'aa1bb22c-333d-4444-e555-666777888999',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  companyId: string;

  @ApiProperty({
    description: 'Type of debit account',
    example: 'CBU',
    enum: ['CBU', 'CVU', 'ALIAS'],
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(CBU|CVU|ALIAS)$/, {
    message: 'Debit account type must be CBU, CVU, or ALIAS',
  })
  debitAccountType: 'CBU' | 'CVU' | 'ALIAS';

  @ApiProperty({
    description:
      'Debit account value - 22 digits for CBU/CVU, 6-20 chars for ALIAS',
    example: '2850590940090418135201',
    oneOf: [
      { pattern: '^\\d{22}$', description: 'CBU: 22 digits' },
      { pattern: '^\\d{22}$', description: 'CVU: 22 digits' },
      {
        pattern: '^[A-Za-z0-9._-]{6,20}$',
        description: 'ALIAS: 6-20 alphanumeric chars with ._-',
      },
    ],
  })
  @IsNotEmpty()
  @IsString()
  debitAccountValue: string;

  @ApiProperty({
    description: 'Type of credit account',
    example: 'CVU',
    enum: ['CBU', 'CVU', 'ALIAS'],
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(CBU|CVU|ALIAS)$/, {
    message: 'Credit account type must be CBU, CVU, or ALIAS',
  })
  creditAccountType: 'CBU' | 'CVU' | 'ALIAS';

  @ApiProperty({
    description:
      'Credit account value - 22 digits for CBU/CVU, 6-20 chars for ALIAS',
    example: '0000003100010000000001',
    oneOf: [
      { pattern: '^\\d{22}$', description: 'CBU: 22 digits' },
      { pattern: '^\\d{22}$', description: 'CVU: 22 digits' },
      {
        pattern: '^[A-Za-z0-9._-]{6,20}$',
        description: 'ALIAS: 6-20 alphanumeric chars with ._-',
      },
    ],
  })
  @IsNotEmpty()
  @IsString()
  creditAccountValue: string;
}
