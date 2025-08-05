// src/application/dto/transfer-response.dto.ts

export class TransferResponseDto {
  id: string;
  amount: number;
  companyId: string;
  debitAccount: string;
  creditAccount: string;
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
