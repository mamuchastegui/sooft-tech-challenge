// src/infrastructure/providers/date.provider.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class DateProvider {
  now(): Date {
    return new Date();
  }

  parseISO(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    return date;
  }

  isValidISOString(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return (
        !isNaN(date.getTime()) &&
        dateString === date.toISOString().split('.')[0] + 'Z'
      );
    } catch {
      return false;
    }
  }
}
