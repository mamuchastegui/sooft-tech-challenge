// src/domain/repositories/company.repository.interface.ts

import { Company } from '../entities/company.entity';
import { CompanyFilter } from '../../application/services/company-query.service';

export interface CompanyRepository {
  save(company: Company): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  findByCuit(cuit: string): Promise<Company | null>;
  findAll(): Promise<Company[]>;
  findCompaniesByFilter(filter: CompanyFilter): Promise<Company[]>;
}
