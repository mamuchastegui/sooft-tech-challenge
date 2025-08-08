// src/infrastructure/metrics/metrics.providers.ts

import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

export const metricsProviders = [
  makeCounterProvider({
    name: 'transfer_requests_total',
    help: 'Total number of transfer requests',
    labelNames: ['company_type', 'status'],
  }),

  makeHistogramProvider({
    name: 'transfer_amount_histogram',
    help: 'Distribution of transfer amounts',
    labelNames: ['company_type'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  }),

  makeCounterProvider({
    name: 'company_registrations_total',
    help: 'Total number of company registrations',
    labelNames: ['company_type'],
  }),

  makeCounterProvider({
    name: 'domain_errors_total',
    help: 'Total number of domain errors',
    labelNames: ['error_type', 'operation'],
  }),

  makeGaugeProvider({
    name: 'active_companies_gauge',
    help: 'Current number of active companies',
    labelNames: ['company_type'],
  }),
];
