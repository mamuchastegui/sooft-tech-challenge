// test/e2e/company-negative-core.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { COMPANY_TYPES } from '../../src/domain/value-objects/company-type.constants';

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
      const timestamp = Date.now().toString().slice(-8);
      const uniqueCuit = `30-${timestamp}-9`;
      
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