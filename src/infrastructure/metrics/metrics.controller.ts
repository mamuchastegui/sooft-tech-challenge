// src/infrastructure/metrics/metrics.controller.ts

import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiExcludeEndpoint()
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
