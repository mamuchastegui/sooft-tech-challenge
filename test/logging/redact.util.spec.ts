// test/logging/redact.util.spec.ts

import {
  maskCuit,
  maskCbu,
  maskCvu,
  maskAccountId,
  maskEmail,
  redactObject,
  redactHeaders,
  PINO_REDACT_PATHS,
} from '../../src/infrastructure/logging/redact.util';

describe('RedactUtil', () => {
  describe('maskCuit', () => {
    it('should mask CUIT with separators correctly', () => {
      expect(maskCuit('30-12345678-1')).toBe('30-****5678-1');
      expect(maskCuit('20-98765432-3')).toBe('20-****5432-3');
      expect(maskCuit('27-11111111-9')).toBe('27-****1111-9');
    });

    it('should mask CUIT without separators correctly', () => {
      expect(maskCuit('30123456781')).toBe('30-****5678-1');
      expect(maskCuit('20987654323')).toBe('20-****5432-3');
      expect(maskCuit('27111111119')).toBe('27-****1111-9');
    });

    it('should handle invalid CUIT formats gracefully', () => {
      // Too short
      expect(maskCuit('123')).toBe('123');
      expect(maskCuit('12-34')).toBe('12-34'); // Invalid format, not masked

      // Wrong format
      expect(maskCuit('30-1234567-1')).toBe('30-1234567-1'); // 7 digits instead of 8
      expect(maskCuit('30-123456789-1')).toBe('30-123456789-1'); // 9 digits instead of 8

      // Non-numeric
      expect(maskCuit('AB-12345678-1')).toBe('AB-12345678-1');
      expect(maskCuit('30-ABCDEFGH-1')).toBe('30-ABCDEFGH-1');

      // Conservative fallback for long strings
      expect(maskCuit('3012345678901234')).toBe('30************34');
    });

    it('should handle non-string input', () => {
      expect(maskCuit(null as any)).toBe('null');
      expect(maskCuit(undefined as any)).toBe('undefined');
      expect(maskCuit(123 as any)).toBe('123');
      expect(maskCuit({} as any)).toBe('[object Object]');
    });
  });

  describe('maskCbu', () => {
    it('should mask standard CBU correctly', () => {
      expect(maskCbu('2850590940090418135201')).toBe('285****************201');
      expect(maskCbu('0070006330004005485181')).toBe('007****************181');
      expect(maskCbu('1234567890123456789012')).toBe('123****************012');
    });

    it('should handle non-standard CBU lengths', () => {
      // Shorter than 22 digits
      expect(maskCbu('123456789')).toBe('123***789');
      expect(maskCbu('12345')).toBe('12345'); // Too short to mask meaningfully

      // Longer than 22 digits
      expect(maskCbu('123456789012345678901234')).toBe(
        '123******************234',
      );
    });

    it('should handle invalid CBU formats gracefully', () => {
      // Non-numeric - should not be masked
      expect(maskCbu('285A590940090418135201')).toBe('285A590940090418135201');
      expect(maskCbu('ABCDEFGHIJKLMNOPQRSTUV')).toBe('ABCDEFGHIJKLMNOPQRSTUV');

      // Mixed - should not be masked
      expect(maskCbu('2850590940ABC418135201')).toBe('2850590940ABC418135201');
    });

    it('should handle non-string input', () => {
      expect(maskCbu(null as any)).toBe('null');
      expect(maskCbu(undefined as any)).toBe('undefined');
      expect(maskCbu(123 as any)).toBe('123');
    });
  });

  describe('maskCvu', () => {
    it('should mask CVU with same logic as CBU', () => {
      expect(maskCvu('0000003100010000000001')).toBe('000****************001');
      expect(maskCvu('1234567890123456789012')).toBe('123****************012');
    });

    it('should handle edge cases like CBU', () => {
      expect(maskCvu('12345')).toBe('12345');
      expect(maskCvu('ABCDEFGHIJ')).toBe('ABCDEFGHIJ'); // Non-numeric, not masked
    });
  });

  describe('maskAccountId', () => {
    it('should mask standard AccountId correctly', () => {
      expect(maskAccountId('1234567890123')).toBe('123*******123');
      expect(maskAccountId('9876543210987')).toBe('987*******987');
      expect(maskAccountId('1111111111111')).toBe('111*******111');
    });

    it('should handle non-standard AccountId lengths', () => {
      expect(maskAccountId('123456789')).toBe('123***789');
      expect(maskAccountId('12345')).toBe('12345'); // Too short
      expect(maskAccountId('12345678901234567')).toBe('123***********567');
    });

    it('should handle invalid formats gracefully', () => {
      // Non-numeric - should not be masked
      expect(maskAccountId('123A567890123')).toBe('123A567890123');
      expect(maskAccountId('ABCDEFGHIJKLM')).toBe('ABCDEFGHIJKLM');
    });

    it('should handle non-string input', () => {
      expect(maskAccountId(123 as any)).toBe('123');
      expect(maskAccountId(null as any)).toBe('null');
    });
  });

  describe('maskEmail', () => {
    it('should mask valid emails correctly', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j*******@example.com');
      expect(maskEmail('test@domain.org')).toBe('t***@domain.org');
      expect(maskEmail('admin@company.co.uk')).toBe('a****@company.co.uk');
      expect(maskEmail('a@b.co')).toBe('a@b.co'); // Single char local part
    });

    it('should handle edge cases', () => {
      // Single character local part
      expect(maskEmail('a@example.com')).toBe('a@example.com');

      // Long local part
      expect(maskEmail('very.long.email.address@example.com')).toBe(
        'v**********************@example.com',
      );
    });

    it('should not mask invalid email formats', () => {
      expect(maskEmail('not-an-email')).toBe('not-an-email');
      expect(maskEmail('missing@domain')).toBe('missing@domain');
      expect(maskEmail('@missing-local.com')).toBe('@missing-local.com');
      expect(maskEmail('spaces in@email.com')).toBe('spaces in@email.com');
      expect(maskEmail('multiple@@signs.com')).toBe('multiple@@signs.com');
    });

    it('should handle non-string input', () => {
      expect(maskEmail(null as any)).toBe('null');
      expect(maskEmail(undefined as any)).toBe('undefined');
      expect(maskEmail(123 as any)).toBe('123');
    });
  });

  describe('redactObject', () => {
    it('should redact sensitive fields at root level', () => {
      const input = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'secretpassword',
        cuit: '30-12345678-1',
        cbu: '2850590940090418135201',
        age: 30,
      };

      const result = redactObject(input);

      expect(result).toEqual({
        name: 'John Doe', // name is not redacted (not in sensitive keys)
        email: 'j*******@example.com',
        password: '***REDACTED***',
        cuit: '30-****5678-1',
        cbu: '285****************201',
        age: 30,
      });

      // Verify original object is not mutated
      expect(input.email).toBe('john.doe@example.com');
      expect(input.password).toBe('secretpassword');
    });

    it('should redact nested objects deeply', () => {
      const input = {
        user: {
          personal: {
            email: 'user@example.com',
            secret: 'topsecret',
          },
          financial: {
            cuit: '20-98765432-3',
            accountId: '1234567890123',
          },
        },
        metadata: {
          authorization: 'Bearer token123',
        },
      };

      const result = redactObject(input);

      expect(result).toEqual({
        user: {
          personal: {
            email: 'u***@example.com',
            secret: '***REDACTED***',
          },
          financial: {
            cuit: '20-****5432-3',
            accountId: '123*******123',
          },
        },
        metadata: {
          authorization: '***REDACTED***',
        },
      });
    });

    it('should handle arrays correctly', () => {
      const input = {
        users: [
          { email: 'user1@example.com', cuit: '30-11111111-1' },
          { email: 'user2@example.com', password: 'secret123' },
        ],
        tokens: ['token1', 'token2'],
      };

      const result = redactObject(input);

      expect(result).toEqual({
        users: [
          { email: 'u****@example.com', cuit: '30-****1111-1' },
          { email: 'u****@example.com', password: '***REDACTED***' }, // password is redacted
        ],
        tokens: ['token1', 'token2'], // 'tokens' is not a sensitive key
      });
    });

    it('should handle different naming conventions', () => {
      const input = {
        businessName: 'ACME Corp',
        business_name: 'ACME Corp Alt',
        accountId: '1234567890123',
        account_id: '9876543210987',
        apiKey: 'key123',
        api_key: 'key456',
      };

      const result = redactObject(input);

      expect(result).toEqual({
        businessName: 'ACME Corp', // Not redacted (not in sensitive keys)
        business_name: 'ACME Corp Alt', // Not redacted (not in sensitive keys)
        accountId: '123*******123',
        account_id: '987*******987',
        apiKey: '***REDACTED***',
        api_key: '***REDACTED***',
      });
    });

    it('should handle null and undefined values', () => {
      expect(redactObject(null)).toBe(null);
      expect(redactObject(undefined)).toBe(undefined);

      const input = {
        email: null,
        password: undefined,
        cuit: '30-12345678-1',
      };

      const result = redactObject(input);

      expect(result).toEqual({
        email: '***REDACTED***', // null gets redacted for sensitive fields
        password: '***REDACTED***', // undefined gets redacted for sensitive fields
        cuit: '30-****5678-1',
      });
    });

    it('should handle primitive values', () => {
      expect(redactObject('string')).toBe('string');
      expect(redactObject(123)).toBe(123);
      expect(redactObject(true)).toBe(true);
    });

    it('should not mutate original object', () => {
      const original = {
        user: { email: 'test@example.com', name: 'Test User' },
        password: 'secret',
      };

      const redacted = redactObject(original);

      // Original should be unchanged
      expect(original.user.email).toBe('test@example.com');
      expect(original.password).toBe('secret');

      // Redacted should be different
      expect(redacted.user.email).toBe('t***@example.com');
      expect(redacted.password).toBe('***REDACTED***');

      // Should be different objects
      expect(redacted).not.toBe(original);
      expect(redacted.user).not.toBe(original.user);
    });
  });

  describe('redactHeaders', () => {
    it('should redact sensitive headers', () => {
      const headers = {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0',
        authorization: 'Bearer token123',
        'x-api-key': 'apikey456',
        cookie: 'session=abc123',
        'custom-header': 'value',
      };

      const result = redactHeaders(headers);

      expect(result).toEqual({
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0',
        authorization: '***REDACTED***',
        'x-api-key': '***REDACTED***',
        cookie: '***REDACTED***',
        'custom-header': 'value',
      });
    });

    it('should handle case-insensitive header names', () => {
      const headers = {
        Authorization: 'Bearer token',
        'X-API-KEY': 'key123',
        Cookie: 'session=abc',
        'X-AUTH-TOKEN': 'authtoken',
      };

      const result = redactHeaders(headers);

      expect(result).toEqual({
        Authorization: '***REDACTED***',
        'X-API-KEY': '***REDACTED***',
        Cookie: '***REDACTED***',
        'X-AUTH-TOKEN': '***REDACTED***',
      });
    });

    it('should not mutate original headers object', () => {
      const original = {
        authorization: 'Bearer token',
        'content-type': 'application/json',
      };

      const redacted = redactHeaders(original);

      expect(original.authorization).toBe('Bearer token');
      expect(redacted.authorization).toBe('***REDACTED***');
      expect(redacted).not.toBe(original);
    });
  });

  describe('PINO_REDACT_PATHS', () => {
    it('should include all expected redaction paths', () => {
      const expectedPaths = [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.cuit',
        'req.body.cbu',
        'req.body.email',
        'req.query.token',
        'res.body.password',
        'err.config.headers.authorization',
      ];

      expectedPaths.forEach((path) => {
        expect(PINO_REDACT_PATHS).toContain(path);
      });
    });

    it('should be an array of strings', () => {
      expect(Array.isArray(PINO_REDACT_PATHS)).toBe(true);
      PINO_REDACT_PATHS.forEach((path) => {
        expect(typeof path).toBe('string');
      });
    });
  });
});
