// src/application/dto/validators/cuit.validator.ts

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Cuit } from '../../../domain/value-objects/cuit';

@ValidatorConstraint({ name: 'cuit', async: false })
export class CuitValidator implements ValidatorConstraintInterface {
  validate(cuit: string, args: ValidationArguments) {
    try {
      Cuit.create(cuit);
      return true;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    try {
      Cuit.create(args.value);
      return 'CUIT is valid';
    } catch (error) {
      return error.message;
    }
  }
}
