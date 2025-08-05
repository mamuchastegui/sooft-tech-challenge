// src/application/dto/company-monthly.dto.ts

export class CompanyMonthlyDto {
  id: string;
  cuit: string;
  businessName: string;
  joinedAt: Date;
  type: string;
  transferCount: number;
  totalAmount: string; // numeric in PG maps to string
}
