// src/infrastructure/logging/global-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { DomainError } from '../../domain/errors/domain.error';
import { getOtelTraceInfo } from './otel-context.util';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  trace_id?: string;
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request as any).id || request.headers['x-request-id'];
    const otelInfo = getOtelTraceInfo();

    const { status, message, error } = this.parseException(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(requestId && { requestId }),
      ...(otelInfo.trace_id && { trace_id: otelInfo.trace_id }),
    };

    // Log the error with full context
    this.logException(exception, request, status, requestId, otelInfo);

    response.status(status).json(errorResponse);
  }

  private parseException(exception: unknown): {
    status: HttpStatus;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof DomainError) {
      return {
        status: this.mapDomainErrorToHttpStatus(exception),
        message: exception.message,
        error: 'Domain Error',
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const response = exceptionResponse as any;
        return {
          status,
          message: response.message || exception.message,
          error: response.error || exception.name,
        };
      }

      return {
        status,
        message: exceptionResponse as string,
        error: exception.name,
      };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : exception.message,
        error: 'Internal Server Error',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unknown error occurred',
      error: 'Internal Server Error',
    };
  }

  private mapDomainErrorToHttpStatus(error: DomainError): HttpStatus {
    const message = error.message.toLowerCase();

    if (message.includes('not found')) {
      return HttpStatus.NOT_FOUND;
    }

    if (
      message.includes('already exists') ||
      message.includes('duplicate') ||
      message.includes('unique constraint')
    ) {
      return HttpStatus.CONFLICT;
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return HttpStatus.FORBIDDEN;
    }

    // Default to bad request for validation errors
    return HttpStatus.BAD_REQUEST;
  }

  private logException(
    exception: unknown,
    request: Request,
    status: HttpStatus,
    requestId?: string,
    otelInfo?: { trace_id?: string; span_id?: string },
  ): void {
    const baseContext = {
      requestId,
      method: request.method,
      url: request.url,
      route: request.route?.path,
      statusCode: status,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      ...otelInfo,
    };

    if (status >= 500) {
      // Server errors - log as error with full context
      this.logger.error({
        msg: 'Internal server error occurred',
        error: exception instanceof Error ? exception.message : 'Unknown error',
        errorName: exception instanceof Error ? exception.name : 'Unknown',
        stack: exception instanceof Error ? exception.stack : undefined,
        cause: this.extractErrorCause(exception),
        ...baseContext,
      });
    } else if (status >= 400) {
      // Client errors - log as warning
      this.logger.warn({
        msg: 'Client error occurred',
        error: exception instanceof Error ? exception.message : 'Client error',
        errorName: exception instanceof Error ? exception.name : 'ClientError',
        cause: this.extractErrorCause(exception),
        ...baseContext,
      });
    } else {
      // Unexpected status for error - log as info for debugging
      this.logger.info({
        msg: 'Exception handled with non-error status',
        error: exception instanceof Error ? exception.message : 'Unknown',
        ...baseContext,
      });
    }
  }

  private extractErrorCause(exception: unknown): string | undefined {
    if (exception instanceof Error) {
      // Extract additional context from the error
      const error = exception as any;

      // Check for common error properties
      if (error.code) return `Code: ${error.code}`;
      if (error.errno) return `Errno: ${error.errno}`;
      if (error.syscall) return `Syscall: ${error.syscall}`;
      if (error.constraint) return `Constraint: ${error.constraint}`;
      if (error.table) return `Table: ${error.table}`;
      if (error.detail) return `Detail: ${error.detail}`;

      // For domain errors or custom errors, try to extract additional context
      if (error.context) return `Context: ${JSON.stringify(error.context)}`;
    }

    return undefined;
  }
}
