// otel-register.cjs
require('dotenv').config(); // asegura OTEL_* disponibles antes del SDK

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes: S } = require('@opentelemetry/semantic-conventions');

const pkg = require('./package.json');

const resource = new Resource({
  [S.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'company-service',
  [S.SERVICE_NAMESPACE]: process.env.OTEL_SERVICE_NAMESPACE || 'company-service-group',
  [S.SERVICE_VERSION]: pkg.version,
  [S.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'dev',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter(),      // Alloy en :4318 o direct-to-cloud
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());
process.on('beforeExit', () => sdk.shutdown());
