// src/application/services/company.service.ts

import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { CompanyRepository } from '../../domain/repositories/company.repository.interface';
import { CompanyFactory } from '../../domain/factories/company.factory';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';
import { COMPANY_REPOSITORY_TOKEN } from '../../domain/repositories/company.repository.token';
import {
  validateCompanyRequest,
  ValidationError,
} from '../../../shared-lib/validation';

@Injectable()
export class CompanyService {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async createCompany(
    createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const candidate = { ...createCompanyDto };
    try {
      validateCompanyRequest(candidate);
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }

    const existingCompany = await this.companyRepository.findByCuit(
      candidate.cuit,
    );

    if (existingCompany) {
      throw new ConflictException(
        `Company with CUIT ${candidate.cuit} already exists`,
      );
    }

    const company = CompanyFactory.create({
      cuit: candidate.cuit,
      businessName: candidate.businessName,
      type: candidate.type,
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
