// test/helpers/test-accounts.helper.ts

/**
 * Helper functions to generate valid CBU/CVU test data with correct checksums
 * Following real Argentina banking algorithms
 */

/**
 * Generate valid CBU with correct BCRA checksum
 * CBU format: [4 bank code][16 account][2 control]
 */
export function generateValidCbu(bankCode = '2850'): string {
  // Ensure bank code is 4 digits
  const normalizedBankCode = bankCode.padStart(4, '0');
  
  // Generate account number (16 digits)
  const accountNumber = '5909400904181352';
  
  // Calculate control digits
  const firstControl = calculateMod10Checksum(normalizedBankCode);
  const secondControl = calculateMod10Checksum(accountNumber);
  const controlDigits = firstControl.toString() + secondControl.toString();
  
  return normalizedBankCode + accountNumber + controlDigits;
}

/**
 * Generate valid CVU with correct checksum
 * CVU format: [4 entity code][16 account][2 control digits]
 */
export function generateValidCvu(entityCode = '0000'): string {
  // Ensure entity code is 4 digits
  const normalizedEntityCode = entityCode.padStart(4, '0');
  
  // Generate account identifier (16 digits)
  const accountIdentifier = '0031000100000000';
  
  // Calculate control digits using CVU algorithm
  const firstControl = calculateCvuMod10Checksum(normalizedEntityCode);
  const secondControl = calculateCvuMod10Checksum(accountIdentifier);
  const controlDigits = firstControl.toString() + secondControl.toString();
  
  return normalizedEntityCode + accountIdentifier + controlDigits;
}

/**
 * Calculate BCRA mod 10 checksum (used for CBU validation)
 */
function calculateMod10Checksum(digits: string): number {
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i]);
    const weight = weights[i % weights.length];
    let product = digit * weight;

    // If product > 9, sum digits (e.g., 14 -> 1+4 = 5)
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10);
    }

    sum += product;
  }

  // Control digit = (10 - (sum mod 10)) mod 10
  return (10 - (sum % 10)) % 10;
}

/**
 * Calculate CVU mod 10 checksum (similar to CBU but with CVU-specific weights)
 */
function calculateCvuMod10Checksum(digits: string): number {
  const weights = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i]);
    const weight = weights[i % weights.length];
    let product = digit * weight;

    // If product > 9, sum digits (e.g., 14 -> 1+4 = 5)
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10);
    }

    sum += product;
  }

  // Control digit = (10 - (sum mod 10)) mod 10
  return (10 - (sum % 10)) % 10;
}

/**
 * Predefined valid test accounts for consistent testing
 */
export const VALID_TEST_ACCOUNTS = {
  // Valid CBUs (using 4-digit bank codes)
  CBU_BANCO_NACION: generateValidCbu('0170'), // Banco de la Nación Argentina
  CBU_MACRO: generateValidCbu('2850'), // Banco Macro  
  CBU_SANTANDER: generateValidCbu('0720'), // Banco Santander
  CBU_GALICIA: generateValidCbu('0070'), // Banco Galicia
  
  // Valid CVUs
  CVU_MERCADOPAGO: generateValidCvu('0000'), // MercadoPago
  CVU_UALÁ: generateValidCvu('0000'), // Ualá (different account)
  CVU_NARANJA: generateValidCvu('0000'), // Naranja X
  
  // Valid Aliases
  ALIAS_SHORT: 'wallet',
  ALIAS_MEDIUM: 'my.wallet',
  ALIAS_LONG: 'my.super.long.wall12',
  ALIAS_SPECIAL: 'test._-123',
} as const;

/**
 * Generate a random valid CBU for testing
 */
export function randomValidCbu(): string {
  const bankCodes = ['0170', '2850', '0720', '0070', '0200', '0340'];
  const randomBank = bankCodes[Math.floor(Math.random() * bankCodes.length)];
  return generateValidCbu(randomBank);
}

/**
 * Generate a random valid CVU for testing
 */
export function randomValidCvu(): string {
  return generateValidCvu('0000');
}