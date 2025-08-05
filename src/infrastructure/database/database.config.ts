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
    synchronize: isLocal, // Only in local development
    logging: isLocal,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  };
};