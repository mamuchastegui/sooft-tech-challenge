// test/logging/otel-context.util.spec.ts

import { trace } from '@opentelemetry/api';
import {
  getOtelTraceInfo,
  getOtelTraceInfoFromContext,
  createTraceContext,
} from '../../src/infrastructure/logging/otel-context.util';

// Mock the OpenTelemetry API
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getActiveSpan: jest.fn(),
    getSpan: jest.fn(),
  },
  context: {},
}));

describe('OtelContextUtil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOtelTraceInfo', () => {
    it('should return trace_id and span_id when active span exists', () => {
      // Arrange
      const mockSpanContext = {
        traceId: 'test-trace-id-123',
        spanId: 'test-span-id-456',
      };
      const mockSpan = {
        spanContext: () => mockSpanContext,
      };

      (trace.getActiveSpan as jest.Mock).mockReturnValue(mockSpan);

      // Act
      const result = getOtelTraceInfo();

      // Assert
      expect(result).toEqual({
        trace_id: 'test-trace-id-123',
        span_id: 'test-span-id-456',
      });
    });

    it('should return empty object when no active span exists', () => {
      // Arrange
      (trace.getActiveSpan as jest.Mock).mockReturnValue(null);

      // Act
      const result = getOtelTraceInfo();

      // Assert
      expect(result).toEqual({});
    });

    it('should return empty object when OpenTelemetry throws an error', () => {
      // Arrange
      (trace.getActiveSpan as jest.Mock).mockImplementation(() => {
        throw new Error('OpenTelemetry not initialized');
      });

      // Act
      const result = getOtelTraceInfo();

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('getOtelTraceInfoFromContext', () => {
    it('should return trace_id and span_id when span exists in context', () => {
      // Arrange
      const mockContext = {};
      const mockSpanContext = {
        traceId: 'context-trace-id-789',
        spanId: 'context-span-id-012',
      };
      const mockSpan = {
        spanContext: () => mockSpanContext,
      };

      (trace.getSpan as jest.Mock).mockReturnValue(mockSpan);

      // Act
      const result = getOtelTraceInfoFromContext(mockContext);

      // Assert
      expect(result).toEqual({
        trace_id: 'context-trace-id-789',
        span_id: 'context-span-id-012',
      });
      expect(trace.getSpan).toHaveBeenCalledWith(mockContext);
    });

    it('should return empty object when no span exists in context', () => {
      // Arrange
      const mockContext = {};
      (trace.getSpan as jest.Mock).mockReturnValue(null);

      // Act
      const result = getOtelTraceInfoFromContext(mockContext);

      // Assert
      expect(result).toEqual({});
    });

    it('should return empty object when context extraction throws an error', () => {
      // Arrange
      const mockContext = {};
      (trace.getSpan as jest.Mock).mockImplementation(() => {
        throw new Error('Context error');
      });

      // Act
      const result = getOtelTraceInfoFromContext(mockContext);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('createTraceContext', () => {
    beforeEach(() => {
      // Set up environment variables
      process.env.OTEL_SERVICE_NAME = 'test-service';
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      delete process.env.OTEL_SERVICE_NAME;
      delete process.env.NODE_ENV;
    });

    it('should create trace context with all fields when span is active', () => {
      // Arrange
      const mockSpanContext = {
        traceId: 'trace-123',
        spanId: 'span-456',
      };
      const mockSpan = {
        spanContext: () => mockSpanContext,
      };

      (trace.getActiveSpan as jest.Mock).mockReturnValue(mockSpan);

      // Act
      const result = createTraceContext('req-789');

      // Assert
      expect(result).toEqual({
        trace_id: 'trace-123',
        span_id: 'span-456',
        requestId: 'req-789',
        service: 'test-service',
        env: 'test',
      });
    });

    it('should create trace context without trace info when no active span', () => {
      // Arrange
      (trace.getActiveSpan as jest.Mock).mockReturnValue(null);

      // Act
      const result = createTraceContext('req-789');

      // Assert
      expect(result).toEqual({
        requestId: 'req-789',
        service: 'test-service',
        env: 'test',
      });
    });

    it('should create trace context without requestId when not provided', () => {
      // Arrange
      const mockSpanContext = {
        traceId: 'trace-123',
        spanId: 'span-456',
      };
      const mockSpan = {
        spanContext: () => mockSpanContext,
      };

      (trace.getActiveSpan as jest.Mock).mockReturnValue(mockSpan);

      // Act
      const result = createTraceContext();

      // Assert
      expect(result).toEqual({
        trace_id: 'trace-123',
        span_id: 'span-456',
        service: 'test-service',
        env: 'test',
      });
    });

    it('should use default values when environment variables are not set', () => {
      // Arrange
      delete process.env.OTEL_SERVICE_NAME;
      delete process.env.NODE_ENV;

      (trace.getActiveSpan as jest.Mock).mockReturnValue(null);

      // Act
      const result = createTraceContext();

      // Assert
      expect(result).toEqual({
        service: 'company-service',
        env: 'development',
      });
    });
  });
});
