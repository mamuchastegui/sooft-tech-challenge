// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompanyController } from './presentation/controllers/company.controller';
import { ReportController } from './presentation/controllers/report.controller';
import { CompanyService } from './application/services/company.service';
import { CompanyQueryService } from './application/services/company-query.service';
import { TransferService } from './application/services/transfer.service';
import { CompanyRepositoryImpl } from './infrastructure/repositories/company.repository.impl';
import { TransferRepositoryImpl } from './infrastructure/repositories/transfer.repository.impl';
import { CompanyReportRepository } from './infrastructure/repositories/company-report.repository';
import { DatabaseModule } from './infrastructure/database/database.module';
import { DateProvider } from './infrastructure/providers/date.provider';
import { COMPANY_REPOSITORY_TOKEN } from './domain/repositories/company.repository.token';
import { TRANSFER_REPOSITORY_TOKEN } from './domain/repositories/transfer.repository.token';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [CompanyController, ReportController],
  providers: [
    CompanyService,
    CompanyQueryService,
    TransferService,
    CompanyReportRepository,
    DateProvider,
    {
      provide: COMPANY_REPOSITORY_TOKEN,
      useClass: CompanyRepositoryImpl,
    },
    {
      provide: TRANSFER_REPOSITORY_TOKEN,
      useClass: TransferRepositoryImpl,
    },
  ],
})
export class AppModule {}
