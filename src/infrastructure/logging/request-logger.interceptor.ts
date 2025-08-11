// src/infrastructure/logging/request-logger.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { getOtelTraceInfo } from './otel-context.util';
import { redactObject, redactHeaders } from './redact.util';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const start = process.hrtime.bigint();
    const requestId = (request as any).id || request.headers['x-request-id'];

    // Log incoming request
    this.logRequest(request, requestId);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = this.calculateDuration(start);
          this.logResponse(request, response, requestId, duration, data, false);
        },
        error: (error) => {
          const duration = this.calculateDuration(start);
          this.logResponse(
            request,
            response,
            requestId,
            duration,
            null,
            true,
            error,
          );
        },
      }),
    );
  }

  private logRequest(request: Request, requestId: string) {
    const otelInfo = getOtelTraceInfo();

    const logData = {
      msg: `Incoming ${request.method} request`,
      method: request.method,
      url: request.url,
      route: request.route?.path,
      query:
        Object.keys(request.query || {}).length > 0
          ? redactObject(request.query)
          : undefined,
      pathParams:
        Object.keys(request.params || {}).length > 0
          ? redactObject(request.params)
          : undefined,
      requestId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      ...otelInfo,
    };

    // Include detailed information in debug mode with redaction
    if (process.env.LOG_LEVEL === 'debug') {
      const contentLength = request.headers['content-length'];
      if (contentLength) {
        logData['requestSize'] = `${contentLength} bytes`;
      }

      // Include content type for debug
      if (request.headers['content-type']) {
        logData['contentType'] = request.headers['content-type'];
      }

      // Include redacted headers in debug mode
      logData['headers'] = redactHeaders(request.headers || {});

      // Include redacted body if available (for POST/PUT requests)
      if (
        (request as any).body &&
        Object.keys((request as any).body).length > 0
      ) {
        logData['body'] = redactObject((request as any).body);
      }
    }

    this.logger.info(logData);
  }

  private logResponse(
    request: Request,
    response: Response,
    requestId: string,
    duration_ms: number,
    responseData: any,
    isError: boolean,
    error?: any,
  ) {
    const otelInfo = getOtelTraceInfo();
    const statusCode = response.statusCode;
    const method = request.method;
    const route = request.route?.path || request.path;

    const baseLogData = {
      msg: `${method} ${route} completed`,
      method,
      url: request.url,
      route,
      statusCode,
      duration_ms: Math.round(duration_ms * 100) / 100, // Round to 2 decimal places
      requestId,
      ...otelInfo,
    };

    // Add redacted query and path params if they exist
    if (Object.keys(request.query || {}).length > 0) {
      baseLogData['query'] = redactObject(request.query);
    }

    if (Object.keys(request.params || {}).length > 0) {
      baseLogData['pathParams'] = redactObject(request.params);
    }

    // Include response size information in debug mode
    if (process.env.LOG_LEVEL === 'debug' && !isError) {
      const contentLength = response.get('content-length');
      if (contentLength) {
        baseLogData['responseSize'] = `${contentLength} bytes`;
      } else if (responseData) {
        // Approximate response size
        try {
          const approximateSize = JSON.stringify(responseData).length;
          baseLogData['responseSize'] = `~${approximateSize} bytes`;
        } catch {
          // Ignore if can't stringify
        }
      }
    }

    // Log based on status code and error state
    if (isError || statusCode >= 500) {
      this.logger.error({
        ...baseLogData,
        error: error?.message,
        errorName: error?.name,
        stack: error?.stack,
      });
    } else if (statusCode >= 400) {
      this.logger.warn({
        ...baseLogData,
        error: error?.message || 'Client error',
      });
    } else {
      this.logger.info(baseLogData);
    }
  }

  private calculateDuration(start: bigint): number {
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert nanoseconds to milliseconds
  }
}
