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

  @Get('transfer-last-month')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Empresas con transferencias del mes pasado',
    description:
      'Obtiene empresas con sus estadísticas de transferencias del mes anterior usando vista materializada para rendimiento óptimo.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de empresas con estadísticas de transferencias del mes anterior',
    type: [CompanyMonthlyDto],
    example: [
      {
        id: 'db6da64e-482c-4e29-a7c6-31817cf5ad86',
        cuit: '30-12345678-1',
        businessName: 'Tech Solutions SA',
        joinedAt: '2023-12-01T10:00:00.000Z',
        type: 'CORPORATE',
        transferCount: 5,
        totalAmount: '150000.50',
      },
      {
        id: 'aa1bb22c-333d-4444-e555-666777888999',
        cuit: '30-98765432-8',
        businessName: 'Mi PYME SRL',
        joinedAt: '2023-11-15T09:30:00.000Z',
        type: 'PYME',
        transferCount: 3,
        totalAmount: '75500.00',
      },
    ],
  })
  async transferLastMonth(): Promise<CompanyMonthlyDto[]> {
    return this.repo.lastMonth();
  }

  @Get('joined-last-month')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Empresas adheridas el mes pasado',
    description:
      'Obtiene empresas que se adhirieron al sistema en el mes anterior usando vista materializada para rendimiento óptimo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas que se adhirieron en el mes anterior',
    type: [CompanyJoinedMonthlyDto],
    example: [
      {
        id: 'ff2ee33d-444c-5555-a666-777888999aaa',
        cuit: '30-11111111-1',
        businessName: 'Nueva Empresa PYME',
        joinedAt: '2023-11-05T14:20:00.000Z',
        type: 'PYME',
      },
      {
        id: 'bb3cc44d-555e-6666-f777-888999aaabbb',
        cuit: '30-22222222-2',
        businessName: 'Corporación Reciente SA',
        joinedAt: '2023-11-12T16:45:00.000Z',
        type: 'CORPORATE',
      },
    ],
  })
  async joinedLastMonth(): Promise<CompanyJoinedMonthlyDto[]> {
    return this.repo.joinedLastMonth();
  }
}
