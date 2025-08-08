// src/infrastructure/logging/logging.module.ts

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
        serializers: {
          req(req) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              query: req.query,
              params: req.params,
              headers: {
                'x-request-id': req.headers['x-request-id'],
                'user-agent': req.headers['user-agent'],
                authorization: req.headers.authorization
                  ? '[REDACTED]'
                  : undefined,
              },
            };
          },
          res(res) {
            return {
              statusCode: res.statusCode,
            };
          },
        },
        customLogLevel: function (req, res, err) {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
          } else if (res.statusCode >= 500 || err) {
            return 'error';
          } else if (res.statusCode >= 300 && res.statusCode < 400) {
            return 'silent';
          }
          return 'info';
        },
        customSuccessMessage: function (req, res) {
          if (res.statusCode === 404) {
            return 'resource not found';
          }
          return `${req.method} completed`;
        },
        customErrorMessage: function (req, res) {
          return `${req.method} request errored with status code: ${res.statusCode}`;
        },
        customAttributeKeys: {
          req: 'request',
          res: 'response',
          err: 'error',
          responseTime: 'timeTaken',
        },
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
