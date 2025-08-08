// src/infrastructure/metrics/metrics.module.ts

import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { CustomMetricsService } from './custom-metrics.service';
import { metricsProviders } from './metrics.providers';

@Module({
  imports: [
    PrometheusModule.register({
      defaultLabels: {
        app: 'sooft-tech-backend',
      },
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'sooft_',
        },
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [CustomMetricsService, ...metricsProviders],
  exports: [CustomMetricsService],
})
export class MetricsModule {}
