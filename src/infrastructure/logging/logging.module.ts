// src/infrastructure/logging/logging.module.ts

import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { createPinoLoggerConfig } from './pino-logger.factory';
import { RequestLoggerInterceptor } from './request-logger.interceptor';
import { GlobalExceptionFilter } from './global-exception.filter';

/**
 * Global logging module that provides structured logging with OpenTelemetry correlation
 *
 * Features:
 * - Structured JSON logging with Pino
 * - OpenTelemetry trace/span ID correlation
 * - Request/response logging with duration tracking
 * - Global exception handling with proper error logging
 * - Environment-based pretty printing (dev mode)
 * - Configurable log levels
 */
@Global()
@Module({
  imports: [LoggerModule.forRoot(createPinoLoggerConfig())],
  providers: [
    // Global request/response logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggerInterceptor,
    },

    // Global exception filter with structured error logging
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
