// src/presentation/controllers/company.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CompanyService } from '../../application/services/company.service';
import { CompanyQueryService } from '../../application/services/company-query.service';
import { CreateCompanyDto } from '../../application/dto/create-company.dto';
import { CompanyResponseDto } from '../../application/dto/company-response.dto';
import { CompanyQueryDto } from '../../application/dto/company-query.dto';

@ApiTags('companies')
@Controller('v1/companies')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly companyQueryService: CompanyQueryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Register a new company adhesion' })
  @ApiResponse({
    status: 201,
    description: 'Company successfully created',
    type: CompanyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Company with CUIT already exists',
  })
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companyService.createCompany(createCompanyDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Get companies with optional date filters',
    description:
      'Retrieve companies based on optional date filters. If no filters are provided, returns all companies.',
  })
  @ApiQuery({
    name: 'joinedFrom',
    required: false,
    description:
      'Filter companies joined after this date (inclusive). ISO-8601 format.',
    example: '2023-12-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'joinedTo',
    required: false,
    description:
      'Filter companies joined before this date (inclusive). ISO-8601 format.',
    example: '2023-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'transferFrom',
    required: false,
    description:
      'Filter companies that have transfers from this date (inclusive). ISO-8601 format.',
    example: '2023-11-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'transferTo',
    required: false,
    description:
      'Filter companies that have transfers until this date (inclusive). ISO-8601 format.',
    example: '2023-11-30T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'List of companies matching the filters',
    type: [CompanyResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date format in query parameters',
  })
  async getCompanies(
    @Query() queryDto: CompanyQueryDto,
  ): Promise<CompanyResponseDto[]> {
    return this.companyQueryService.findCompanies(queryDto);
  }
}
