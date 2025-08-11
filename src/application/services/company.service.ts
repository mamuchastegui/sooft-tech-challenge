// src/application/services/company.service.ts

import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { CompanyFactory } from '../../domain/factories/company.factory';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';
import { COMPANY_REPOSITORY_TOKEN } from '../../domain/repositories/company.repository.token';

@Injectable()
export class CompanyService {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async createCompany(
    createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const existingCompany = await this.companyRepository.findByCuit(
      createCompanyDto.cuit,
    );

    if (existingCompany) {
      throw new ConflictException(
        `Company with CUIT ${createCompanyDto.cuit} already exists`,
      );
    }

    const company = CompanyFactory.create({
      cuit: createCompanyDto.cuit,
      businessName: createCompanyDto.name,
      type: createCompanyDto.type,
    });

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
