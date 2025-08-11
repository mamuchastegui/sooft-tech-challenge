// src/infrastructure/logging/pino-logger.factory.ts

import { LoggerService } from '@nestjs/common';
import { Params } from 'nestjs-pino';
import { getOtelTraceInfo } from './otel-context.util';

/**
 * Factory for creating Pino logger configuration with OpenTelemetry integration
 */
export function createPinoLoggerConfig(): Params {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || 'info';

  return {
    pinoHttp: {
      level: logLevel,

      // Transport for pretty printing in development
      transport: !isProduction
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              messageFormat: '{msg} [{trace_id}]',
            },
          }
        : undefined,

      // Base fields that appear in every log entry
      base: {
        service: process.env.OTEL_SERVICE_NAME || 'company-service',
        env: process.env.NODE_ENV || 'development',
      },

      // Custom serializers for request/response objects
      serializers: {
        req(req: any) {
          const otelInfo = getOtelTraceInfo();

          return {
            id: req.id,
            method: req.method,
            url: req.url,
            route: req.route?.path,
            query: req.query,
            params: req.params,
            ...otelInfo,
            headers: {
              'x-request-id': req.headers['x-request-id'],
              'user-agent': req.headers['user-agent'],
              'content-type': req.headers['content-type'],
              authorization: req.headers.authorization
                ? '[REDACTED]'
                : undefined,
            },
          };
        },

        res(res: any) {
          return {
            statusCode: res.statusCode,
            // Include response size if available
            contentLength: res.get?.('content-length'),
          };
        },

        err(err: any) {
          return {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code,
            status: err.status,
          };
        },
      },

      // Custom log level based on response status
      customLogLevel: function (req: any, res: any, err?: Error) {
        if (res.statusCode >= 500 || err) {
          return 'error';
        } else if (res.statusCode >= 400) {
          return 'warn';
        } else if (res.statusCode >= 300) {
          return 'silent'; // Don't log redirects
        }
        return 'info';
      },

      // Custom success message
      customSuccessMessage: function (req: any) {
        return `${req.method} ${req.route?.path || req.url} completed`;
      },

      // Custom error message
      customErrorMessage: function (req: any) {
        return `${req.method} ${req.route?.path || req.url} failed`;
      },

      // Custom attribute keys for cleaner log structure
      customAttributeKeys: {
        req: 'request',
        res: 'response',
        err: 'error',
        responseTime: 'duration_ms',
      },

      // Add custom properties to each log entry
      customProps: (req: any) => {
        const otelInfo = getOtelTraceInfo();

        return {
          requestId: req.id,
          ...otelInfo,
        };
      },
    },
  };
}

/**
 * Creates a custom logger instance for application logging
 * (not HTTP request logging)
 */
export class AppLogger implements LoggerService {
  private static instance: AppLogger;

  static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  log(message: any, context?: string) {
    this.info(message, context);
  }

  error(message: any, trace?: string, context?: string) {
    const otelInfo = getOtelTraceInfo();

    console.error(
      JSON.stringify({
        level: 'error',
        msg: message,
        context,
        stack: trace,
        ...otelInfo,
        service: process.env.OTEL_SERVICE_NAME || 'company-service',
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      }),
    );
  }

  warn(message: any, context?: string) {
    const otelInfo = getOtelTraceInfo();

    console.warn(
      JSON.stringify({
        level: 'warn',
        msg: message,
        context,
        ...otelInfo,
        service: process.env.OTEL_SERVICE_NAME || 'company-service',
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      }),
    );
  }

  debug(message: any, context?: string) {
    if (process.env.LOG_LEVEL === 'debug') {
      const otelInfo = getOtelTraceInfo();

      console.debug(
        JSON.stringify({
          level: 'debug',
          msg: message,
          context,
          ...otelInfo,
          service: process.env.OTEL_SERVICE_NAME || 'company-service',
          env: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  verbose(message: any, context?: string) {
    this.debug(message, context);
  }

  private info(message: any, context?: string) {
    const otelInfo = getOtelTraceInfo();

    console.log(
      JSON.stringify({
        level: 'info',
        msg: message,
        context,
        ...otelInfo,
        service: process.env.OTEL_SERVICE_NAME || 'company-service',
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
