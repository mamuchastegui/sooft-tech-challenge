// src/infrastructure/database/transformers/cuit.transformer.ts

import { ValueTransformer } from 'typeorm';
import { Cuit } from '../../../domain/value-objects/cuit';

/**
 * CUIT transformer for TypeORM - stores normalized 11-digit format in database
 * Database column should be CHAR(11) with CHECK constraint for digits only
 */
export class CuitTransformer implements ValueTransformer {
  to(value: Cuit | null): string | null {
    // Store normalized format (digits only) for database
    return value ? value.toNormalized() : null;
  }

  from(value: string | null): Cuit | null {
    return value ? Cuit.create(value) : null;
  }
}
