// src/infrastructure/database/database.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';
import { CompanyEntity } from './entities/company.entity';
import { TransferEntity } from './entities/transfer.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TypeOrmModule.forFeature([CompanyEntity, TransferEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
