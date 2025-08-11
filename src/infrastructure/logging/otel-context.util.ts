// src/infrastructure/logging/otel-context.util.ts

import { trace } from '@opentelemetry/api';

export interface OtelTraceInfo {
  trace_id?: string;
  span_id?: string;
}

/**
 * Extracts OpenTelemetry trace and span IDs from the active context
 */
export function getOtelTraceInfo(): OtelTraceInfo {
  try {
    const activeSpan = trace.getActiveSpan();

    if (!activeSpan) {
      return {};
    }

    const spanContext = activeSpan.spanContext();

    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    };
  } catch {
    // In case OpenTelemetry is not properly initialized
    // or there's an error accessing the context
    return {};
  }
}

/**
 * Extracts OpenTelemetry trace info from a specific context
 * Useful when you have a custom context to extract from
 */
export function getOtelTraceInfoFromContext(ctx: any): OtelTraceInfo {
  try {
    const activeSpan = trace.getSpan(ctx);

    if (!activeSpan) {
      return {};
    }

    const spanContext = activeSpan.spanContext();

    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    };
  } catch {
    return {};
  }
}

/**
 * Creates a trace context object for logging
 */
export function createTraceContext(requestId?: string): Record<string, any> {
  const otelInfo = getOtelTraceInfo();

  return {
    ...otelInfo,
    ...(requestId && { requestId }),
    service: process.env.OTEL_SERVICE_NAME || 'company-service',
    env: process.env.NODE_ENV || 'development',
  };
}
