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
    description: 'Debit account number (exactly 13 digits)',
    example: '1234567890123',
    pattern: '^\\d{13}$',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{13}$/, {
    message: 'Debit account must be exactly 13 digits',
  })
  debitAccount: string;

  @ApiProperty({
    description: 'Credit account number (exactly 13 digits)',
    example: '9876543210987',
    pattern: '^\\d{13}$',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{13}$/, {
    message: 'Credit account must be exactly 13 digits',
  })
  creditAccount: string;
}
