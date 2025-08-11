// src/infrastructure/logging/redact.util.ts

/**
 * Utilities for redacting/masking sensitive data in logs
 * Maintains infrastructure layer separation - no domain logic here
 */

/**
 * Masks CUIT keeping prefix and check digit
 * Format: "30-12345678-1" → "30-****5678-1"
 */
export function maskCuit(cuit: string): string {
  if (typeof cuit !== 'string') {
    return String(cuit);
  }

  // Handle CUIT with separators (XX-XXXXXXXX-X format)
  if (cuit.includes('-')) {
    const parts = cuit.split('-');
    if (
      parts.length === 3 &&
      parts[1].length === 8 &&
      /^\d+$/.test(parts[0]) &&
      /^\d+$/.test(parts[1]) &&
      /^\d+$/.test(parts[2])
    ) {
      const middle = parts[1];
      const maskedMiddle = '****' + middle.slice(-4);
      return `${parts[0]}-${maskedMiddle}-${parts[2]}`;
    }
    // Return as-is for invalid CUIT formats with separators
    return cuit;
  }

  // Handle CUIT without separators (11 digits)
  if (cuit.length === 11 && /^\d+$/.test(cuit)) {
    const prefix = cuit.slice(0, 2);
    const suffix = cuit.slice(-1);
    const middle = cuit.slice(2, -1);
    const maskedMiddle = '****' + middle.slice(-4);
    return `${prefix}-${maskedMiddle}-${suffix}`;
  }

  // Conservative fallback - only mask if it looks like it might be sensitive
  if (cuit.length > 4 && !cuit.includes('-')) {
    return cuit.slice(0, 2) + '*'.repeat(cuit.length - 4) + cuit.slice(-2);
  }

  // Return as-is for short strings or formats we don't recognize
  return cuit;
}

/**
 * Masks CBU keeping first 3 and last 3 digits
 * Format: "2850590940090418135201" → "285***************201"
 */
export function maskCbu(cbu: string): string {
  if (typeof cbu !== 'string') {
    return String(cbu);
  }

  // Standard CBU is 22 digits
  if (cbu.length === 22 && /^\d+$/.test(cbu)) {
    return cbu.slice(0, 3) + '*'.repeat(16) + cbu.slice(-3);
  }

  // Conservative fallback for numeric strings only
  if (cbu.length > 6 && /^\d+$/.test(cbu)) {
    return cbu.slice(0, 3) + '*'.repeat(cbu.length - 6) + cbu.slice(-3);
  }

  return cbu;
}

/**
 * Masks CVU with same criteria as CBU
 * Format: "0000003100010000000001" → "000***************001"
 */
export function maskCvu(cvu: string): string {
  return maskCbu(cvu); // Same logic as CBU
}

/**
 * Masks AccountId keeping first 3 and last 3 digits
 * Format: "1234567890123" → "123*******123"
 */
export function maskAccountId(accountId: string): string {
  if (typeof accountId !== 'string') {
    return String(accountId);
  }

  // Standard AccountId is 13 digits
  if (accountId.length === 13 && /^\d+$/.test(accountId)) {
    return accountId.slice(0, 3) + '*'.repeat(7) + accountId.slice(-3);
  }

  // Conservative fallback for numeric strings only
  if (accountId.length > 6 && /^\d+$/.test(accountId)) {
    return (
      accountId.slice(0, 3) +
      '*'.repeat(accountId.length - 6) +
      accountId.slice(-3)
    );
  }

  return accountId;
}

/**
 * Masks email showing only first character and domain
 * Format: "john.doe@example.com" → "j***@example.com"
 */
export function maskEmail(email: string): string {
  if (typeof email !== 'string') {
    return String(email);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return email; // Return as-is if not a valid email format
  }

  const [localPart, domain] = email.split('@');

  if (localPart.length === 0) {
    return email;
  }

  const maskedLocal =
    localPart.length === 1
      ? localPart[0]
      : localPart[0] + '*'.repeat(Math.max(0, localPart.length - 1));
  return `${maskedLocal}@${domain}`;
}

/**
 * Sensitive field names that should be redacted
 */
const SENSITIVE_KEYS = new Set([
  // Authentication
  'authorization',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'apikey',
  'api_key',
  'x-api-key',
  'cookie',
  'set-cookie',

  // Financial data
  'cuit',
  'cbu',
  'cvu',
  'accountid',
  'account_id',

  // Personal data
  'email',
]);

/**
 * Generic redaction function that deeply clones and redacts sensitive data
 * Does not mutate the original object
 */
export function redactObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  // Clone the object to avoid mutation
  const cloned = { ...obj } as any;

  for (const [key, value] of Object.entries(cloned)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.has(lowerKey)) {
      // Apply specific masking based on field type
      if (lowerKey === 'cuit') {
        cloned[key] =
          typeof value === 'string' ? maskCuit(value) : '***REDACTED***';
      } else if (lowerKey === 'cbu') {
        cloned[key] =
          typeof value === 'string' ? maskCbu(value) : '***REDACTED***';
      } else if (lowerKey === 'cvu') {
        cloned[key] =
          typeof value === 'string' ? maskCvu(value) : '***REDACTED***';
      } else if (lowerKey === 'accountid' || lowerKey === 'account_id') {
        cloned[key] =
          typeof value === 'string' ? maskAccountId(value) : '***REDACTED***';
      } else if (lowerKey === 'email') {
        cloned[key] =
          typeof value === 'string' ? maskEmail(value) : '***REDACTED***';
      } else {
        // For tokens, passwords, etc. - completely redact
        cloned[key] = '***REDACTED***';
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      cloned[key] = redactObject(value);
    }
  }

  return cloned;
}

/**
 * Redacts sensitive data from HTTP headers
 * Specifically handles common header patterns
 */
export function redactHeaders(
  headers: Record<string, any>,
): Record<string, any> {
  const redacted = { ...headers };

  for (const [key] of Object.entries(redacted)) {
    const lowerKey = key.toLowerCase();

    if (
      SENSITIVE_KEYS.has(lowerKey) ||
      lowerKey.includes('auth') ||
      lowerKey.includes('token')
    ) {
      redacted[key] = '***REDACTED***';
    }
  }

  return redacted;
}

/**
 * List of paths for Pino redaction configuration
 * These paths will be automatically redacted by Pino
 */
export const PINO_REDACT_PATHS = [
  // Request headers - using dot notation that matches Pino's structure
  'req.headers.authorization',
  'req.headers.cookie',
  'request.headers.authorization',
  'request.headers.cookie',

  // Request body fields
  'req.body.password',
  'req.body.token',
  'req.body.access_token',
  'req.body.refresh_token',
  'req.body.secret',
  'req.body.apiKey',
  'req.body.cuit',
  'req.body.cbu',
  'req.body.cvu',
  'req.body.accountId',
  'req.body.account_id',
  'req.body.email',

  // Query parameters
  'req.query.password',
  'req.query.token',
  'req.query.access_token',
  'req.query.apiKey',
  'req.query.cuit',
  'req.query.cbu',
  'req.query.cvu',
  'req.query.accountId',
  'req.query.email',

  // Response data (be careful not to redact too much)
  'res.body.password',
  'res.body.token',
  'res.body.access_token',
  'res.body.refresh_token',
  'res.body.secret',

  // Error objects
  'err.config.headers.authorization',
  'error.config.headers.authorization',
];
