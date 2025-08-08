// src/presentation/filters/all-exceptions.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { DomainError } from '../../domain/errors/domain.error';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger?: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId =
      (request as any).requestId || request.headers['x-request-id'];

    let status: HttpStatus;
    let message: string | string[];
    let error: string;

    // Handle different types of exceptions
    if (exception instanceof DomainError) {
      status = this.mapDomainErrorToHttpStatus(exception);
      message = exception.message;
      error = 'Domain Error';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
      } else {
        message = exceptionResponse;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;
      error = 'Internal Server Error';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      error = 'Internal Server Error';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(requestId && { requestId }),
    };

    // Log the error with context
    this.logError(exception, request, status, requestId);

    response.status(status).json(errorResponse);
  }

  private mapDomainErrorToHttpStatus(error: DomainError): HttpStatus {
    // Map domain errors to appropriate HTTP status codes
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

  private logError(
    exception: unknown,
    request: Request,
    status: HttpStatus,
    requestId?: string,
  ): void {
    // If no logger is available, fall back to console logging
    if (!this.logger) {
      const logData = {
        requestId,
        method: request.method,
        url: request.url,
        statusCode: status,
        message:
          exception instanceof Error ? exception.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };

      if (status >= 500) {
        console.error('Internal server error:', logData);
      } else if (status >= 400) {
        console.warn('Client error:', logData);
      }
      return;
    }

    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      statusCode: status,
    };

    if (status >= 500) {
      // Server errors - log as error with full stack trace
      this.logger.error({
        msg: 'Internal server error',
        err: exception,
        ...logContext,
      });
    } else if (status >= 400) {
      // Client errors - log as warning
      this.logger.warn({
        msg: exception instanceof Error ? exception.message : 'Client error',
        error: exception instanceof Error ? exception.name : 'Unknown',
        ...logContext,
      });
    } else {
      // Unexpected status for error - log as info
      this.logger.info({
        msg: 'Exception handled',
        error: exception instanceof Error ? exception.message : 'Unknown',
        ...logContext,
      });
    }
  }
}
