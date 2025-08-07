// test/e2e/company.controller.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { COMPANY_TYPES } from '../../src/domain/value-objects/company-type.constants';

function generateUniqueCuit(): string {
  const timestamp = Date.now().toString().slice(-8);
  const prefix = '99'; // Use prefix unlikely to conflict with faker data
  const base = `${prefix}${timestamp}`;
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = base.split('').map(Number);
  const sum = mult.reduce((acc, m, i) => acc + m * digits[i], 0);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) check = 9;
  return `${prefix}-${timestamp}-${check}`;
}

describe('CompanyController (e2e)', () => {
  let app: INestApplication;

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

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/companies', () => {
    it('should create a new company successfully', () => {
      const createCompanyDto = {
        cuit: generateUniqueCuit(),
        businessName: 'New Test Company SA',
        type: COMPANY_TYPES.CORPORATE,
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
      const uniqueCuit = generateUniqueCuit();
      const createCompanyDto = {
        cuit: uniqueCuit,
        businessName: 'First Company',
        type: COMPANY_TYPES.PYME,
      };

      // Create first company
      await request(app.getHttpServer())
        .post('/v1/companies')
        .send(createCompanyDto)
        .expect(201);

      // Try to create duplicate
      const duplicateDto = {
        cuit: uniqueCuit, // Same CUIT
        businessName: 'Duplicate Company',
        type: COMPANY_TYPES.CORPORATE,
      };

      return request(app.getHttpServer())
        .post('/v1/companies')
        .send(duplicateDto)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should return 400 for invalid CUIT format', () => {
      const createCompanyDto = {
        cuit: '123456789',
        businessName: 'Test Company',
        type: COMPANY_TYPES.CORPORATE,
      };

      return request(app.getHttpServer())
        .post('/v1/companies')
        .send(createCompanyDto)
        .expect(400)
        .expect((res) => {
          const messageText = Array.isArray(res.body.message)
            ? res.body.message[0]
            : res.body.message;
          expect(messageText).toContain('CUIT must follow the format');
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
          expect(res.body.message).toContain(
            'Type must be either PYME or CORPORATE',
          );
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

    it('should filter companies by joinedFrom parameter', () => {
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - 10); // 10 days ago

      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ joinedFrom: filterDate.toISOString() })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((company: any) => {
            const joinedAt = new Date(company.joinedAt);
            expect(joinedAt).toBeInstanceOf(Date);
            expect(joinedAt.getTime()).toBeGreaterThanOrEqual(
              filterDate.getTime(),
            );
          });
        });
    });

    it('should filter companies by transferFrom parameter', () => {
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - 15); // 15 days ago

      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ transferFrom: filterDate.toISOString() })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Should return companies that have transfers since the filter date
        });
    });

    it('should apply both joinedFrom and transferFrom filters', () => {
      const joinedDate = new Date();
      joinedDate.setDate(joinedDate.getDate() - 20); // 20 days ago

      const transferDate = new Date();
      transferDate.setDate(transferDate.getDate() - 25); // 25 days ago

      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({
          joinedFrom: joinedDate.toISOString(),
          transferFrom: transferDate.toISOString(),
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 400 for invalid date format in joinedFrom', () => {
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ joinedFrom: 'invalid-date' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'joinedFrom must be a valid ISO-8601 date string',
          );
        });
    });

    it('should return 400 for invalid date format in transferFrom', () => {
      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ transferFrom: 'invalid-date' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'transferFrom must be a valid ISO-8601 date string',
          );
        });
    });

    it('should handle edge case with future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      return request(app.getHttpServer())
        .get('/v1/companies')
        .query({ joinedFrom: futureDate.toISOString() })
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
          joinedFrom: filterDate.toISOString(),
          transferFrom: '', // Empty parameter should be ignored
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
