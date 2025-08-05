// src/infrastructure/database/database.config.ts

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CompanyEntity } from './entities/company.entity';
import { TransferEntity } from './entities/transfer.entity';
import * as dotenv from 'dotenv';
dotenv.config();

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isLocal = process.env.NODE_ENV === 'local' || !process.env.DATABASE_HOST;

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || 'sooft_user',
    password: process.env.DATABASE_PASSWORD || 'sooft_password',
    database: process.env.DATABASE_NAME || 'sooft_tech_db',
    entities: [CompanyEntity, TransferEntity],
    synchronize: false, // Use migrations only for production safety
    logging: process.env.NODE_ENV === 'local',
    ssl: isLocal ? false : { rejectUnauthorized: false },
    extra: {
      max: 10, // Connection pool max size
      min: 2,  // Connection pool min size
      acquireTimeoutMillis: 60000, // Connection timeout
      idleTimeoutMillis: 600000,   // Idle connection timeout (10 minutes)
      connectionTimeoutMillis: 10000, // Connection establishment timeout
    },
    cache: {
      duration: 30000, // Cache queries for 30 seconds
    },
  };
};