// src/infrastructure/database/mock-data.ts

import { Company } from '../../domain/entities/company.entity';
import { Transfer } from '../../domain/entities/transfer.entity';
import { CompanyTypeVO, CompanyType } from '../../domain/value-objects/company-type.value-object';

export class MockData {
  private static companies: Company[] = [];
  private static transfers: Transfer[] = [];

  static initialize(): void {
    this.generateMockCompanies();
    this.generateMockTransfers();
  }

  private static generateMockCompanies(): void {
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);

    this.companies = [
      new Company(
        '1',
        '20-12345678-9',
        'Tech Solutions SA',
        new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        new CompanyTypeVO(CompanyType.CORPORATE),
      ),
      new Company(
        '2',
        '27-87654321-0',
        'Small Business Inc',
        new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        new CompanyTypeVO(CompanyType.PYME),
      ),
      new Company(
        '3',
        '30-11223344-5',
        'Enterprise Corp',
        new Date(twoMonthsAgo.getTime() - 5 * 24 * 60 * 60 * 1000), // 2+ months ago
        new CompanyTypeVO(CompanyType.CORPORATE),
      ),
      new Company(
        '4',
        '23-55667788-1',
        'Local Services Ltd',
        new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        new CompanyTypeVO(CompanyType.PYME),
      ),
      new Company(
        '5',
        '33-99887766-2',
        'Global Industries',
        new Date(twoMonthsAgo.getTime() - 10 * 24 * 60 * 60 * 1000), // 2+ months ago
        new CompanyTypeVO(CompanyType.CORPORATE),
      ),
    ];
  }

  private static generateMockTransfers(): void {
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);

    this.transfers = [
      new Transfer(
        '1',
        15000.50,
        '1',
        '001-123456-01',
        '001-654321-02',
        new Date(currentDate.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      ),
      new Transfer(
        '2',
        25000.00,
        '1',
        '001-123456-01',
        '002-111111-01',
        new Date(currentDate.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      ),
      new Transfer(
        '3',
        8500.75,
        '2',
        '002-987654-03',
        '003-222222-01',
        new Date(currentDate.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      ),
      new Transfer(
        '4',
        45000.00,
        '3',
        '003-555666-01',
        '001-123456-01',
        new Date(twoMonthsAgo.getTime() - 3 * 24 * 60 * 60 * 1000), // 2+ months ago
      ),
      new Transfer(
        '5',
        12000.25,
        '4',
        '004-777888-02',
        '005-999000-01',
        new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      ),
      new Transfer(
        '6',
        33000.00,
        '1',
        '001-123456-01',
        '006-333444-01',
        new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      ),
    ];
  }

  static getCompanies(): Company[] {
    return [...this.companies];
  }

  static getTransfers(): Transfer[] {
    return [...this.transfers];
  }

  static addCompany(company: Company): void {
    this.companies.push(company);
  }

  static addTransfer(transfer: Transfer): void {
    this.transfers.push(transfer);
  }

  static reset(): void {
    this.companies = [];
    this.transfers = [];
    this.initialize();
  }
}