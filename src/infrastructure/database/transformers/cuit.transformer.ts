// src/infrastructure/database/transformers/cuit.transformer.ts

import { ValueTransformer } from 'typeorm';
import { Cuit } from '../../../domain/value-objects/cuit';

export class CuitTransformer implements ValueTransformer {
  to(value: Cuit | null): string | null {
    return value ? value.toString() : null;
  }

  from(value: string | null): Cuit | null {
    return value ? Cuit.create(value) : null;
  }
}
