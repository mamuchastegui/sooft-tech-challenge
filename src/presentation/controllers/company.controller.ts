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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Registrar nueva empresa',
    description:
      'Registra una nueva empresa (PYME o Corporativa) en el sistema',
  })
  @ApiBody({
    type: CreateCompanyDto,
    description: 'Datos de la empresa a registrar',
    examples: {
      pyme: {
        summary: 'Empresa PYME',
        description: 'Ejemplo de registro de empresa PYME',
        value: {
          cuit: '30-12345678-1',
          businessName: 'Mi Empresa PYME SRL',
          type: 'PYME',
        },
      },
      corporate: {
        summary: 'Empresa Corporativa',
        description: 'Ejemplo de registro de empresa corporativa',
        value: {
          cuit: '30-87654321-9',
          businessName: 'Gran Corporación SA',
          type: 'CORPORATE',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa creada exitosamente',
    type: CompanyResponseDto,
    example: {
      id: 'db6da64e-482c-4e29-a7c6-31817cf5ad86',
      cuit: '30-12345678-1',
      businessName: 'Tech Solutions SA',
      joinedAt: '2023-12-01T10:00:00.000Z',
      type: 'CORPORATE',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
    example: {
      statusCode: 400,
      message: [
        'CUIT must follow the format XX-XXXXXXXX-X',
        'businessName should not be empty',
        'Type must be either PYME or CORPORATE',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Empresa con CUIT ya existe',
    example: {
      statusCode: 409,
      message: 'Company with CUIT 30-12345678-1 already exists',
      error: 'Conflict',
    },
  })
  async createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companyService.createCompany(createCompanyDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: 'Obtener empresas con filtros opcionales',
    description:
      'Obtiene empresas según filtros de fecha opcionales. Si no se proporcionan filtros, retorna todas las empresas.',
  })
  @ApiQuery({
    name: 'joinedFrom',
    required: false,
    description:
      'Filtrar empresas que se adhirieron después de esta fecha (inclusivo). Formato ISO-8601.',
    example: '2023-12-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'joinedTo',
    required: false,
    description:
      'Filtrar empresas que se adhirieron antes de esta fecha (inclusivo). Formato ISO-8601.',
    example: '2023-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'transferFrom',
    required: false,
    description:
      'Filtrar empresas que tienen transferencias desde esta fecha (inclusivo). Formato ISO-8601.',
    example: '2023-11-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'transferTo',
    required: false,
    description:
      'Filtrar empresas que tienen transferencias hasta esta fecha (inclusivo). Formato ISO-8601.',
    example: '2023-11-30T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas que coinciden con los filtros',
    type: [CompanyResponseDto],
    example: [
      {
        id: 'db6da64e-482c-4e29-a7c6-31817cf5ad86',
        cuit: '30-12345678-1',
        businessName: 'Tech Solutions SA',
        joinedAt: '2023-12-01T10:00:00.000Z',
        type: 'CORPORATE',
      },
      {
        id: 'aa1bb22c-333d-4444-e555-666777888999',
        cuit: '30-98765432-8',
        businessName: 'Mi PYME SRL',
        joinedAt: '2023-11-15T09:30:00.000Z',
        type: 'PYME',
      },
    ],
  })
  @ApiResponse({
    status: 400,
    description: 'Formato de fecha inválido en parámetros de consulta',
    example: {
      statusCode: 400,
      message: ['joinedFrom must be a valid ISO-8601 date string'],
      error: 'Bad Request',
    },
  })
  async getCompanies(
    @Query() queryDto: CompanyQueryDto,
  ): Promise<CompanyResponseDto[]> {
    return this.companyQueryService.findCompanies(queryDto);
  }
}
