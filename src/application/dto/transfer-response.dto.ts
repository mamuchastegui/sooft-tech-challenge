// src/application/dto/transfer-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class TransferResponseDto {
  @ApiProperty({
    description: 'Transfer ID',
    example: 'db6da64e-482c-4e29-a7c6-31817cf5ad86',
  })
  id: string;

  @ApiProperty({
    description: 'Transfer amount',
    example: 1000.5,
    type: 'number',
    format: 'double',
  })
  amount: number;

  @ApiProperty({
    description: 'Company ID',
    example: 'aa1bb22c-333d-4444-e555-666777888999',
  })
  companyId: string;

  @ApiProperty({
    description: 'Debit account (13 digits)',
    example: '1234567890123',
    maxLength: 13,
    minLength: 13,
  })
  debitAccount: string;

  @ApiProperty({
    description: 'Credit account (13 digits)',
    example: '9876543210987',
    maxLength: 13,
    minLength: 13,
  })
  creditAccount: string;

  @ApiProperty({
    description: 'Transfer creation timestamp',
    example: '2023-12-01T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  constructor(
    id: string,
    amount: number,
    companyId: string,
    debitAccount: string,
    creditAccount: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.amount = amount;
    this.companyId = companyId;
    this.debitAccount = debitAccount;
    this.creditAccount = creditAccount;
    this.createdAt = createdAt;
  }
}
