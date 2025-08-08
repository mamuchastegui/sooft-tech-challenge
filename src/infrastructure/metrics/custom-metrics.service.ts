// src/infrastructure/metrics/custom-metrics.service.ts

import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class CustomMetricsService {
  constructor(
    @InjectMetric('transfer_requests_total')
    private readonly transferRequestsCounter: Counter<string>,

    @InjectMetric('transfer_amount_histogram')
    private readonly transferAmountHistogram: Histogram<string>,

    @InjectMetric('company_registrations_total')
    private readonly companyRegistrationsCounter: Counter<string>,

    @InjectMetric('domain_errors_total')
    private readonly domainErrorsCounter: Counter<string>,

    @InjectMetric('active_companies_gauge')
    private readonly activeCompaniesGauge: Gauge<string>,
  ) {}

  // Transfer metrics
  incrementTransferRequests(companyType: string, status: string): void {
    this.transferRequestsCounter
      .labels({ company_type: companyType, status })
      .inc();
  }

  recordTransferAmount(amount: number, companyType: string): void {
    this.transferAmountHistogram
      .labels({ company_type: companyType })
      .observe(amount);
  }

  // Company metrics
  incrementCompanyRegistrations(companyType: string): void {
    this.companyRegistrationsCounter
      .labels({ company_type: companyType })
      .inc();
  }

  // Error metrics
  incrementDomainErrors(errorType: string, operation: string): void {
    this.domainErrorsCounter.labels({ error_type: errorType, operation }).inc();
  }

  // Gauge metrics
  setActiveCompanies(count: number, companyType?: string): void {
    if (companyType) {
      this.activeCompaniesGauge
        .labels({ company_type: companyType })
        .set(count);
    } else {
      this.activeCompaniesGauge.set(count);
    }
  }
}
