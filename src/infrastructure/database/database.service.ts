// src/infrastructure/database/database.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { MockData } from './mock-data';

@Injectable()
export class DatabaseService implements OnModuleInit {
  onModuleInit() {
    MockData.initialize();
  }

  reset() {
    MockData.reset();
  }
}