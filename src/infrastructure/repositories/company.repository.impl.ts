// src/infrastructure/repositories/company.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { Company } from '../../domain/entities/company.entity';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { CompanyFilter } from '../../application/services/company-query.service';
import { MockData } from '../database/mock-data';

@Injectable()
export class CompanyRepositoryImpl implements CompanyRepository {
  async save(company: Company): Promise<Company> {
    MockData.addCompany(company);
    return company;
  }

  async findById(id: string): Promise<Company | null> {
    const companies = MockData.getCompanies();
    return companies.find(company => company.id === id) || null;
  }

  async findByCuit(cuit: string): Promise<Company | null> {
    const companies = MockData.getCompanies();
    return companies.find(company => company.cuit === cuit) || null;
  }

  async findAll(): Promise<Company[]> {
    return MockData.getCompanies();
  }

  async findCompaniesJoinedInLastMonth(): Promise<Company[]> {
    const companies = MockData.getCompanies();
    return companies.filter(company => company.isJoinedInLastMonth());
  }

  async findCompaniesWithTransfersInLastMonth(): Promise<Company[]> {
    const companies = MockData.getCompanies();
    const transfers = MockData.getTransfers();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentTransfers = transfers.filter(transfer => transfer.isCreatedInLastMonth());
    const companyIdsWithRecentTransfers = new Set(
      recentTransfers.map(transfer => transfer.companyId)
    );

    return companies.filter(company => 
      companyIdsWithRecentTransfers.has(company.id)
    );
  }

  async findCompaniesByFilter(filter: CompanyFilter): Promise<Company[]> {
    const companies = MockData.getCompanies();
    const transfers = MockData.getTransfers();

    let filteredCompanies = companies;

    if (filter.joinedAfter) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.joinedAt >= filter.joinedAfter!
      );
    }

    if (filter.transfersSince) {
      const recentTransfers = transfers.filter(transfer => 
        transfer.createdAt >= filter.transfersSince!
      );
      const companyIdsWithRecentTransfers = new Set(
        recentTransfers.map(transfer => transfer.companyId)
      );

      filteredCompanies = filteredCompanies.filter(company => 
        companyIdsWithRecentTransfers.has(company.id)
      );
    }

    if (!filter.joinedAfter && !filter.transfersSince) {
      return companies;
    }

    return filteredCompanies;
  }
}