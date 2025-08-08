// src/infrastructure/tracing/tracing.service.ts

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { trace, SpanStatusCode, SpanKind, Span } from '@opentelemetry/api';

@Injectable()
export class TracingService implements OnModuleInit {
  private sdk: NodeSDK;
  private readonly logger = new Logger(TracingService.name);

  constructor(private configService: ConfigService) {
    this.initializeTracing();
  }

  private initializeTracing(): void {
    try {
      const serviceName = this.configService.get<string>(
        'OTEL_SERVICE_NAME',
        'sooft-tech-backend',
      );
      const otlpEndpoint = this.configService.get<string>(
        'OTEL_EXPORTER_OTLP_ENDPOINT',
      );

      let traceExporter;

      if (otlpEndpoint) {
        traceExporter = new OTLPTraceExporter({
          url: `${otlpEndpoint}/v1/traces`,
          headers: {
            // Add any authentication headers if needed
            ...(this.configService.get<string>(
              'OTEL_EXPORTER_OTLP_HEADERS',
            ) && {
              ...JSON.parse(
                this.configService.get<string>(
                  'OTEL_EXPORTER_OTLP_HEADERS',
                  '{}',
                ),
              ),
            }),
          },
        });
      }

      this.sdk = new NodeSDK({
        serviceName,
        instrumentations: [
          getNodeAutoInstrumentations({
            // Customize instrumentations as needed
            '@opentelemetry/instrumentation-http': {
              enabled: true,
              ignoreIncomingRequestHook: (req) => {
                // Skip health check and metrics endpoints
                return (
                  req.url?.includes('/health') ||
                  req.url?.includes('/metrics') ||
                  req.url?.includes('/favicon.ico')
                );
              },
            },
            '@opentelemetry/instrumentation-express': {
              enabled: true,
            },
            '@opentelemetry/instrumentation-pg': {
              enabled: true,
            },
            '@opentelemetry/instrumentation-dns': {
              enabled: false, // Can be noisy
            },
            '@opentelemetry/instrumentation-net': {
              enabled: false, // Can be noisy
            },
          }),
        ],
        ...(traceExporter && { traceExporter }),
        resourceDetectors: [],
      });

      this.logger.log(`OpenTelemetry initialized for service: ${serviceName}`);
      if (otlpEndpoint) {
        this.logger.log(`Traces will be exported to: ${otlpEndpoint}`);
      } else {
        this.logger.log(
          'No OTLP endpoint configured, traces will be collected locally',
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize OpenTelemetry', error);
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      this.sdk.start();
      this.logger.log('OpenTelemetry SDK started successfully');
    } catch (error) {
      this.logger.error('Failed to start OpenTelemetry SDK', error);
    }
  }

  /**
   * Create a custom span for business logic tracking
   */
  createSpan(
    name: string,
    attributes?: Record<string, string | number | boolean>,
  ): Span {
    const tracer = trace.getTracer('sooft-tech-backend');
    const span = tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes,
    });
    return span;
  }

  /**
   * Add attributes to the current active span
   */
  addSpanAttributes(
    attributes: Record<string, string | number | boolean>,
  ): void {
    const span = trace.getActiveSpan();
    if (span) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttributes({ [key]: value });
      });
    }
  }

  /**
   * Set span status and end it
   */
  finishSpan(span: Span, error?: Error): void {
    if (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }
    span.end();
  }

  /**
   * Shutdown the SDK (useful for graceful shutdown)
   */
  async shutdown(): Promise<void> {
    try {
      await this.sdk.shutdown();
      this.logger.log('OpenTelemetry SDK shut down successfully');
    } catch (error) {
      this.logger.error('Failed to shutdown OpenTelemetry SDK', error);
    }
  }
}
