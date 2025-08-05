// test/unit/domain/company.entity.spec.ts

import { Company } from '../../../src/domain/entities/company.entity';
import {
  CompanyTypeVO,
  CompanyType,
} from '../../../src/domain/value-objects/company-type.value-object';

describe('Company Entity', () => {
  describe('constructor', () => {
    it('should create a valid company', () => {
      const companyType = new CompanyTypeVO(CompanyType.CORPORATE);
      const joinedAt = new Date();

      const company = new Company(
        '1',
        '20-12345678-9',
        'Test Company SA',
        joinedAt,
        companyType,
      );

      expect(company.id).toBe('1');
      expect(company.cuit).toBe('20-12345678-9');
      expect(company.businessName).toBe('Test Company SA');
      expect(company.joinedAt).toBe(joinedAt);
      expect(company.type).toBe(companyType);
    });

    it('should throw error for invalid CUIT format', () => {
      const companyType = new CompanyTypeVO(CompanyType.CORPORATE);

      expect(() => {
        new Company('1', '123456789', 'Test Company', new Date(), companyType);
      }).toThrow('Invalid CUIT format. Expected: XX-XXXXXXXX-X');
    });

    it('should throw error for empty business name', () => {
      const companyType = new CompanyTypeVO(CompanyType.CORPORATE);

      expect(() => {
        new Company('1', '20-12345678-9', '', new Date(), companyType);
      }).toThrow('Business name cannot be empty');
    });

    it('should throw error for business name exceeding 255 characters', () => {
      const companyType = new CompanyTypeVO(CompanyType.CORPORATE);
      const longName = 'a'.repeat(256);

      expect(() => {
        new Company('1', '20-12345678-9', longName, new Date(), companyType);
      }).toThrow('Business name cannot exceed 255 characters');
    });
  });

  describe('toPlainObject', () => {
    it('should return plain object representation', () => {
      const companyType = new CompanyTypeVO(CompanyType.PYME);
      const joinedAt = new Date();

      const company = new Company(
        '1',
        '20-12345678-9',
        'Test Company',
        joinedAt,
        companyType,
      );

      const plainObject = company.toPlainObject();

      expect(plainObject).toEqual({
        id: '1',
        cuit: '20-12345678-9',
        businessName: 'Test Company',
        joinedAt,
        type: CompanyType.PYME,
      });
    });
  });
});
