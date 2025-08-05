// src/application/dto/company-query.dto.ts

import { IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyQueryDto {
  @ApiPropertyOptional({
    description: 'Filter companies joined after this date (inclusive). ISO-8601 format.',
    example: '2023-12-01T00:00:00Z',
    type: String,
  })
  @IsOptional()
  @IsDateString({}, { message: 'joinedAfter must be a valid ISO-8601 date string' })
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  joinedAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter companies that have transfers since this date (inclusive). ISO-8601 format.',
    example: '2023-11-01T00:00:00Z',
    type: String,
  })
  @IsOptional()
  @IsDateString({}, { message: 'transfersSince must be a valid ISO-8601 date string' })
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  transfersSince?: string;
}