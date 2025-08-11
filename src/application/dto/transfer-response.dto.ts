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
    description: 'Debit account type',
    example: 'CBU',
    enum: ['CBU', 'CVU', 'ALIAS'],
  })
  debitAccountType: 'CBU' | 'CVU' | 'ALIAS';

  @ApiProperty({
    description: 'Debit account value (masked for security)',
    example: '285***************201',
  })
  debitAccountValue: string;

  @ApiProperty({
    description: 'Credit account type',
    example: 'CVU',
    enum: ['CBU', 'CVU', 'ALIAS'],
  })
  creditAccountType: 'CBU' | 'CVU' | 'ALIAS';

  @ApiProperty({
    description: 'Credit account value (masked for security)',
    example: '000***************001',
  })
  creditAccountValue: string;

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
    debitAccountType: 'CBU' | 'CVU' | 'ALIAS',
    debitAccountValue: string,
    creditAccountType: 'CBU' | 'CVU' | 'ALIAS',
    creditAccountValue: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.amount = amount;
    this.companyId = companyId;
    this.debitAccountType = debitAccountType;
    this.debitAccountValue = debitAccountValue;
    this.creditAccountType = creditAccountType;
    this.creditAccountValue = creditAccountValue;
    this.createdAt = createdAt;
  }
}
