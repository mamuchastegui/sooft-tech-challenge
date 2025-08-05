// src/presentation/controllers/report.controller.ts

import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CompanyReportRepository } from '../../infrastructure/repositories/company-report.repository';
import { CompanyMonthlyDto } from '../../application/dto/company-monthly.dto';
import { CompanyJoinedMonthlyDto } from '../../application/dto/company-joined-monthly.dto';

@ApiTags('reports')
@Controller('v1/reports/companies')
export class ReportController {
  constructor(private readonly repo: CompanyReportRepository) {}

  @Get('last-month')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Companies with transfers in previous month (materialized view)',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of companies with their transfer statistics for the previous month',
    type: [CompanyMonthlyDto],
  })
  async lastMonth(): Promise<CompanyMonthlyDto[]> {
    return this.repo.lastMonth();
  }

  @Get('joined-last-month')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Companies joined in previous month (materialized view)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of companies that joined in the previous month',
    type: [CompanyJoinedMonthlyDto],
  })
  async joinedLastMonth(): Promise<CompanyJoinedMonthlyDto[]> {
    return this.repo.joinedLastMonth();
  }
}
