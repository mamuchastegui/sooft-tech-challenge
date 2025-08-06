// test/e2e/company-negative-core.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { COMPANY_TYPES } from '../../src/domain/value-objects/company-type.constants';

function generateCuit(prefix = '30'): string {
  const middle = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, '0');
  const base = `${prefix}${middle}`;
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = base.split('').map(Number);
  const sum = mult.reduce((acc, m, i) => acc + m * digits[i], 0);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) check = 9;
  return `${prefix}-${middle}-${check}`;
}

describe('CompanyController Core Negative Paths (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
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

  afterAll(async () => {
    await app.close();
  });

  describe('Duplicate CUIT scenarios', () => {
    it('should create first company then reject duplicate CUIT with 409', async () => {
      const uniqueCuit = generateCuit();

      // First request should succeed
      await request(app.getHttpServer())
        .post('/v1/companies')
        .send({
          cuit: uniqueCuit,
          businessName: 'ACME',
          type: COMPANY_TYPES.PYME,
        })
        .expect(201);

      // Second request with same CUIT should fail with 409
      await request(app.getHttpServer())
        .post('/v1/companies')
        .send({
          cuit: uniqueCuit,
          businessName: 'ACME 2',
          type: COMPANY_TYPES.CORPORATE,
        })
        .expect(409);
    });
  });

  describe('Invalid date query parameters', () => {
    it('should return 400 for invalid joinedFrom date format', async () => {
      await request(app.getHttpServer())
        .get('/v1/companies?joinedFrom=not-a-date')
        .expect(400);
    });

    it('should return 400 for invalid transferFrom date format', async () => {
      await request(app.getHttpServer())
        .get('/v1/companies?transferFrom=invalid-date')
        .expect(400);
    });
  });

  describe('Basic validation errors', () => {
    it('should return 400 for malformed CUIT', async () => {
      await request(app.getHttpServer())
        .post('/v1/companies')
        .send({
          cuit: '12345',
          businessName: 'Test Company',
          type: COMPANY_TYPES.PYME,
        })
        .expect(400);
    });

    it('should return 400 for invalid company type', async () => {
      await request(app.getHttpServer())
        .post('/v1/companies')
        .send({
          cuit: '30-11111111-1',
          businessName: 'Test Company',
          type: 'INVALID_TYPE',
        })
        .expect(400);
    });

    it('should return 400 for empty request body', async () => {
      await request(app.getHttpServer())
        .post('/v1/companies')
        .send({})
        .expect(400);
    });
  });
});
