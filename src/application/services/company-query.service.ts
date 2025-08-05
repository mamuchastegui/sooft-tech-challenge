// src/application/services/company-query.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { CompanyResponseDto } from '../dto/company-response.dto';
import { CompanyQueryDto } from '../dto/company-query.dto';
import { COMPANY_REPOSITORY_TOKEN } from '../../domain/repositories/company.repository.token';
import { DateProvider } from '../../infrastructure/providers/date.provider';

export interface CompanyFilter {
  joinedFrom?: Date;
  joinedTo?: Date;
  transferFrom?: Date;
  transferTo?: Date;
}

@Injectable()
export class CompanyQueryService {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: CompanyRepository,
    private readonly dateProvider: DateProvider,
  ) {}

  async findCompanies(
    queryDto: CompanyQueryDto,
  ): Promise<CompanyResponseDto[]> {
    const filter: CompanyFilter = {};

    if (queryDto.joinedFrom) {
      filter.joinedFrom = this.dateProvider.parseISO(queryDto.joinedFrom);
    }

    if (queryDto.joinedTo) {
      filter.joinedTo = this.dateProvider.parseISO(queryDto.joinedTo);
    }

    if (queryDto.transferFrom) {
      filter.transferFrom = this.dateProvider.parseISO(queryDto.transferFrom);
    }

    if (queryDto.transferTo) {
      filter.transferTo = this.dateProvider.parseISO(queryDto.transferTo);
    }

    const companies =
      await this.companyRepository.findCompaniesByFilter(filter);

    return companies.map((company) => {
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
}
