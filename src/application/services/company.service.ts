// src/application/services/company.service.ts

import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { Company } from '../../domain/entities/company.entity';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { CompanyTypeVO } from '../../domain/value-objects/company-type.value-object';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';
import { COMPANY_REPOSITORY_TOKEN } from '../../domain/repositories/company.repository.token';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompanyService {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const existingCompany = await this.companyRepository.findByCuit(createCompanyDto.cuit);
    
    if (existingCompany) {
      throw new ConflictException(`Company with CUIT ${createCompanyDto.cuit} already exists`);
    }

    const companyType = new CompanyTypeVO(createCompanyDto.type);
    const company = new Company(
      uuidv4(),
      createCompanyDto.cuit,
      createCompanyDto.businessName,
      new Date(),
      companyType,
    );

    const savedCompany = await this.companyRepository.save(company);
    
    const plainObject = savedCompany.toPlainObject();
    return new CompanyResponseDto(
      plainObject.id,
      plainObject.cuit,
      plainObject.businessName,
      plainObject.joinedAt,
      plainObject.type,
    );
  }

  async getCompaniesJoinedInLastMonth(): Promise<CompanyResponseDto[]> {
    const companies = await this.companyRepository.findCompaniesJoinedInLastMonth();
    
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

  async getCompaniesWithTransfersInLastMonth(): Promise<CompanyResponseDto[]> {
    const companies = await this.companyRepository.findCompaniesWithTransfersInLastMonth();
    
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

  async getCompanyById(id: string): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(id);
    
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const plainObject = company.toPlainObject();
    return new CompanyResponseDto(
      plainObject.id,
      plainObject.cuit,
      plainObject.businessName,
      plainObject.joinedAt,
      plainObject.type,
    );
  }
}