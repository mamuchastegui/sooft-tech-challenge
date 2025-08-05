// test/e2e/company.controller.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { CompanyType } from '../../src/domain/value-objects/company-type.value-object';

describe('CompanyController (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    
    await app.init();
  });

  afterEach(async () => {
    databaseService.reset();
    await app.close();
  });

  describe('POST /v1/companies', () => {
    it('should create a new company successfully', () => {
      const createCompanyDto = {
        cuit: '30-12345678-1',
        businessName: 'New Test Company SA',
        type: CompanyType.CORPORATE,
      };

      return request(app.getHttpServer())
        .post('/v1/companies')
        .send(createCompanyDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.cuit).toBe(createCompanyDto.cuit);
          expect(res.body.businessName).toBe(createCompanyDto.businessName);
          expect(res.body.type).toBe(createCompanyDto.type);
          expect(res.body.id).toBeDefined();
          expect(res.body.joinedAt).toBeDefined();
        });
    });

    it('should return 409 when creating company with existing CUIT', async () => {
      const createCompanyDto = {
        cuit: '20-12345678-9', // This CUIT exists in mock data
        businessName: 'Duplicate Company',
        type: CompanyType.PYME,
      };

      return request(app.getHttpServer())
        .post('/v1/companies')
        .send(createCompanyDto)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should return 400 for invalid CUIT format', () => {
      const createCompanyDto = {
        cuit: '123456789',
        businessName: 'Test Company',
        type: CompanyType.CORPORATE,
      };

      return request(app.getHttpServer())
        .post('/v1/companies')
        .send(createCompanyDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('CUIT must follow the format');
        });
    });

    it('should return 400 for invalid company type', () => {
      const createCompanyDto = {
        cuit: '30-12345678-1',
        businessName: 'Test Company',
        type: 'INVALID_TYPE',
      };

      return request(app.getHttpServer())
        .post('/v1/companies')
        .send(createCompanyDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Type must be either PYME or CORPORATE');
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/v1/companies')
        .send({})
        .expect(400);
    });
  });

  describe('GET /v1/companies', () => {
    it('should return all companies when no filters provided', () => {
      return request(app.getHttpServer())
        .get('/v1/companies')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          res.body.forEach((company: any) => {
            expect(company.id).toBeDefined();
            expect(company.cuit).toBeDefined();
            expect(company.businessName).toBeDefined();
            expect(company.joinedAt).toBeDefined();
            expect(company.type).toBeDefined();
          });
        });
    });

    it('should filter companies by joinedAfter parameter', () => {
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - 10); // 10 days ago
      
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ joinedAfter: filterDate.toISOString() })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((company: any) => {
            const joinedAt = new Date(company.joinedAt);
            expect(joinedAt).toBeInstanceOf(Date);
            expect(joinedAt.getTime()).toBeGreaterThanOrEqual(filterDate.getTime());
          });
        });
    });

    it('should filter companies by transfersSince parameter', () => {
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - 15); // 15 days ago
      
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ transfersSince: filterDate.toISOString() })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Should return companies that have transfers since the filter date
        });
    });

    it('should apply both joinedAfter and transfersSince filters', () => {
      const joinedDate = new Date();
      joinedDate.setDate(joinedDate.getDate() - 20); // 20 days ago
      
      const transferDate = new Date();
      transferDate.setDate(transferDate.getDate() - 25); // 25 days ago
      
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ 
          joinedAfter: joinedDate.toISOString(),
          transfersSince: transferDate.toISOString()
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 400 for invalid date format in joinedAfter', () => {
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ joinedAfter: 'invalid-date' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('joinedAfter must be a valid ISO-8601 date string');
        });
    });

    it('should return 400 for invalid date format in transfersSince', () => {
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ transfersSince: 'invalid-date' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('transfersSince must be a valid ISO-8601 date string');
        });
    });

    it('should handle edge case with future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ joinedAfter: futureDate.toISOString() })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0); // No companies should match future date
        });
    });

    it('should handle mixed valid and empty parameters', () => {
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - 10);
      
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ 
          joinedAfter: filterDate.toISOString(),
          transfersSince: '' // Empty parameter should be ignored
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});