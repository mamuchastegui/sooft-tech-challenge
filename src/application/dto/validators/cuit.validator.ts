// src/application/dto/validators/cuit.validator.ts

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Cuit } from '../../../domain/value-objects/cuit';

@ValidatorConstraint({ name: 'cuit', async: false })
export class CuitValidator implements ValidatorConstraintInterface {
  validate(cuit: string) {
    try {
      Cuit.create(cuit);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    try {
      Cuit.create(args.value);
      return 'CUIT is valid';
    } catch (error: any) {
      return error.message;
    }
  }
}
