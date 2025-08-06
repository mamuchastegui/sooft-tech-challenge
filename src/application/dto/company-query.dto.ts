// src/application/dto/company-query.dto.ts

import { IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter companies joined after this date (inclusive). ISO-8601 format.',
    example: '2023-12-01T00:00:00Z',
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'joinedFrom must be a valid ISO-8601 date string' },
  )
  @Transform(({ value }) => {
    if (!value) return undefined;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value; // Return original invalid value for validation to catch
      return date.toISOString();
    } catch {
      return value; // Return original invalid value for validation to catch
    }
  })
  joinedFrom?: string;

  @ApiPropertyOptional({
    description:
      'Filter companies joined before this date (inclusive). ISO-8601 format.',
    example: '2023-12-31T23:59:59Z',
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'joinedTo must be a valid ISO-8601 date string' },
  )
  @Transform(({ value }) => {
    if (!value) return undefined;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value; // Return original invalid value for validation to catch
      return date.toISOString();
    } catch {
      return value; // Return original invalid value for validation to catch
    }
  })
  joinedTo?: string;

  @ApiPropertyOptional({
    description:
      'Filter companies that have transfers from this date (inclusive). ISO-8601 format.',
    example: '2023-11-01T00:00:00Z',
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'transferFrom must be a valid ISO-8601 date string' },
  )
  @Transform(({ value }) => {
    if (!value) return undefined;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value; // Return original invalid value for validation to catch
      return date.toISOString();
    } catch {
      return value; // Return original invalid value for validation to catch
    }
  })
  transferFrom?: string;

  @ApiPropertyOptional({
    description:
      'Filter companies that have transfers until this date (inclusive). ISO-8601 format.',
    example: '2023-11-30T23:59:59Z',
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'transferTo must be a valid ISO-8601 date string' },
  )
  @Transform(({ value }) => {
    if (!value) return undefined;
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value; // Return original invalid value for validation to catch
      return date.toISOString();
    } catch {
      return value; // Return original invalid value for validation to catch
    }
  })
  transferTo?: string;
}
