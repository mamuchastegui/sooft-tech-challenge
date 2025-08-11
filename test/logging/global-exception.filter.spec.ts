// test/logging/global-exception.filter.spec.ts

import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { GlobalExceptionFilter } from '../../src/infrastructure/logging/global-exception.filter';
import { DomainError } from '../../src/domain/errors/domain.error';
import * as otelUtils from '../../src/infrastructure/logging/otel-context.util';

// Mock the OpenTelemetry utilities
jest.mock('../../src/infrastructure/logging/otel-context.util');

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockLogger: jest.Mocked<PinoLogger>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockRequest: Partial<Request>;
  let mockResponse: jest.Mocked<Partial<Response>>;

  beforeEach(async () => {
    // Create mocked logger
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    } as any;

    // Create mocked request and response
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'test-agent',
        'x-request-id': 'req-123',
      },
      ip: '127.0.0.1',
      route: {
        path: '/test',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      statusCode: 200,
    };

    // Create mocked ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getType: jest.fn().mockReturnValue('http'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    // Mock OpenTelemetry utilities
    (otelUtils.getOtelTraceInfo as jest.Mock).mockReturnValue({
      trace_id: 'test-trace-123',
      span_id: 'test-span-456',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DomainError handling', () => {
    it('should handle DomainError with "not found" message as 404', () => {
      // Arrange
      const error = new DomainError('Company not found');

      // Act
      filter.catch(error, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Company not found',
        error: 'Domain Error',
        timestamp: expect.any(String),
        path: '/test',
        requestId: 'req-123',
        trace_id: 'test-trace-123',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Client error occurred',
          error: 'Company not found',
          statusCode: HttpStatus.NOT_FOUND,
        }),
      );
    });

    it('should handle DomainError with "already exists" message as 409', () => {
      // Arrange
      const error = new DomainError('Company already exists');

      // Act
      filter.catch(error, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        message: 'Company already exists',
        error: 'Domain Error',
        timestamp: expect.any(String),
        path: '/test',
        requestId: 'req-123',
        trace_id: 'test-trace-123',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Client error occurred',
          statusCode: HttpStatus.CONFLICT,
        }),
      );
    });

    it('should handle DomainError with validation message as 400', () => {
      // Arrange
      const error = new DomainError('Invalid company data');

      // Act
      filter.catch(error, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Client error occurred',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with object response correctly', () => {
      // Arrange
      const exception = new HttpException(
        {
          message: ['field is required', 'field must be string'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['field is required', 'field must be string'],
        error: 'Bad Request',
        timestamp: expect.any(String),
        path: '/test',
        requestId: 'req-123',
        trace_id: 'test-trace-123',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Client error occurred',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it('should handle HttpException with string response correctly', () => {
      // Arrange
      const exception = new HttpException(
        'Unauthorized access',
        HttpStatus.UNAUTHORIZED,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized access',
        error: 'HttpException',
        timestamp: expect.any(String),
        path: '/test',
        requestId: 'req-123',
        trace_id: 'test-trace-123',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Client error occurred',
          statusCode: HttpStatus.UNAUTHORIZED,
        }),
      );
    });
  });

  describe('Generic Error handling', () => {
    it('should handle generic Error as 500 in production', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const error = new Error('Database connection failed');

      // Act
      filter.catch(error, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error', // Masked in production
        error: 'Internal Server Error',
        timestamp: expect.any(String),
        path: '/test',
        requestId: 'req-123',
        trace_id: 'test-trace-123',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Internal server error occurred',
          error: 'Database connection failed',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          stack: expect.any(String),
        }),
      );

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic Error as 500 in development with error message', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const error = new Error('Database connection failed');

      // Act
      filter.catch(error, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database connection failed', // Exposed in development
        error: 'Internal Server Error',
        timestamp: expect.any(String),
        path: '/test',
        requestId: 'req-123',
        trace_id: 'test-trace-123',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Internal server error occurred',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Unknown exception handling', () => {
    it('should handle unknown exception as 500', () => {
      // Arrange
      const unknownException = { weird: 'object' };

      // Act
      filter.catch(unknownException, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unknown error occurred',
        error: 'Internal Server Error',
        timestamp: expect.any(String),
        path: '/test',
        requestId: 'req-123',
        trace_id: 'test-trace-123',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Internal server error occurred',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
    });
  });

  describe('Log level mapping', () => {
    it('should log 400-level errors as warnings', () => {
      // Arrange
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Client error occurred',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log 500-level errors as errors', () => {
      // Arrange
      const exception = new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Internal server error occurred',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should log 409 conflicts as warnings', () => {
      // Arrange
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Client error occurred',
          statusCode: HttpStatus.CONFLICT,
        }),
      );
    });
  });

  describe('OpenTelemetry correlation', () => {
    it('should include trace information when available', () => {
      // Arrange
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          trace_id: 'test-trace-123',
        }),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          trace_id: 'test-trace-123',
          span_id: 'test-span-456',
        }),
      );
    });

    it('should work without trace information', () => {
      // Arrange
      (otelUtils.getOtelTraceInfo as jest.Mock).mockReturnValue({});
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      const responseCall = mockResponse.json as jest.Mock;
      expect(responseCall).toHaveBeenCalledWith(
        expect.not.objectContaining({
          trace_id: expect.anything(),
        }),
      );
    });
  });

  describe('Request ID handling', () => {
    it('should include requestId from request.id', () => {
      // Arrange
      mockRequest.id = 'custom-req-id';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'custom-req-id',
        }),
      );
    });

    it('should work without requestId', () => {
      // Arrange
      delete mockRequest.id;
      delete mockRequest.headers['x-request-id'];
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      const responseCall = mockResponse.json as jest.Mock;
      expect(responseCall).toHaveBeenCalledWith(
        expect.not.objectContaining({
          requestId: expect.anything(),
        }),
      );
    });
  });

  describe('Error cause extraction', () => {
    it('should extract database error details', () => {
      // Arrange
      const dbError = new Error('Database error') as any;
      dbError.code = 'ECONNREFUSED';
      dbError.constraint = 'unique_constraint';

      // Act
      filter.catch(dbError, mockArgumentsHost);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          cause: 'Code: ECONNREFUSED',
        }),
      );
    });

    it('should work without additional error context', () => {
      // Arrange
      const simpleError = new Error('Simple error');

      // Act
      filter.catch(simpleError, mockArgumentsHost);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Simple error',
          cause: undefined,
        }),
      );
    });
  });
});
