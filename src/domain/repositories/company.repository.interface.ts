// src/domain/repositories/company.repository.interface.ts

import { Company } from '../entities/company.base';
import { CompanyFilter } from '../../application/services/company-query.service';
import { Cuit } from '../value-objects/cuit.vo';

export interface CompanyRepository {
  save(company: Company): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  findByCuit(cuit: string | Cuit): Promise<Company | null>;
  findAll(): Promise<Company[]>;
  findCompaniesByFilter(filter: CompanyFilter): Promise<Company[]>;
}
