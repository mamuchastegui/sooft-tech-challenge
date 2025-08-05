// src/application/services/company-query.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { CompanyResponseDto } from '../dto/company-response.dto';
import { CompanyQueryDto } from '../dto/company-query.dto';
import { COMPANY_REPOSITORY_TOKEN } from '../../domain/repositories/company.repository.token';
import { DateProvider } from '../../infrastructure/providers/date.provider';

export interface CompanyFilter {
  joinedAfter?: Date;
  transfersSince?: Date;
}

@Injectable()
export class CompanyQueryService {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: CompanyRepository,
    private readonly dateProvider: DateProvider,
  ) {}

  async findCompanies(queryDto: CompanyQueryDto): Promise<CompanyResponseDto[]> {
    const filter: CompanyFilter = {};

    if (queryDto.joinedAfter) {
      filter.joinedAfter = this.dateProvider.parseISO(queryDto.joinedAfter);
    }

    if (queryDto.transfersSince) {
      filter.transfersSince = this.dateProvider.parseISO(queryDto.transfersSince);
    }

    const companies = await this.companyRepository.findCompaniesByFilter(filter);
    
    return companies.map(company => {
      const plainObject = company.toPlainObject();
      return new CompanyResponseDto(
        plainObject.id,
        plainObject.cuit,
        plainObject.businessName,
        plainObject.joinedAt,
        plainObject.type,
      );
    });
  }

  async getCompaniesJoinedInLastMonth(): Promise<CompanyResponseDto[]> {
    const oneMonthAgo = new Date(this.dateProvider.now());
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return this.findCompanies({ 
      joinedAfter: oneMonthAgo.toISOString() 
    });
  }

  async getCompaniesWithTransfersInLastMonth(): Promise<CompanyResponseDto[]> {
    const oneMonthAgo = new Date(this.dateProvider.now());
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return this.findCompanies({ 
      transfersSince: oneMonthAgo.toISOString() 
    });
  }
}