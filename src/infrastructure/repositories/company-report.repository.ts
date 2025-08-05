// src/infrastructure/repositories/company-report.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompanyMonthlyDto } from '../../application/dto/company-monthly.dto';
import { CompanyJoinedMonthlyDto } from '../../application/dto/company-joined-monthly.dto';

@Injectable()
export class CompanyReportRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async lastMonth(): Promise<CompanyMonthlyDto[]> {
    return this.ds.query('SELECT * FROM mv_companies_last_month');
  }

  async joinedLastMonth(): Promise<CompanyJoinedMonthlyDto[]> {
    return this.ds.query('SELECT * FROM mv_companies_joined_last_month');
  }
}
