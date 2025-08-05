// scripts/refresh-mv.ts

import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CompanyEntity } from '../src/infrastructure/database/entities/company.entity';
import { TransferEntity } from '../src/infrastructure/database/entities/transfer.entity';

// Load environment variables
dotenv.config();

async function refreshMaterializedViews() {
  const isLocal = process.env.NODE_ENV === 'local' || !process.env.DATABASE_HOST;

  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || 'sooft_user',
    password: process.env.DATABASE_PASSWORD || 'sooft_password',
    database: process.env.DATABASE_NAME || 'sooft_tech_db',
    entities: [CompanyEntity, TransferEntity],
    synchronize: false,
    logging: process.env.NODE_ENV === 'local',
    ssl: isLocal ? false : { rejectUnauthorized: false },
  };

  const dataSource = new DataSource(dataSourceOptions);

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    
    console.log('Refreshing materialized view mv_companies_last_month...');
    await dataSource.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_companies_last_month');
    
    console.log('Refreshing materialized view mv_companies_joined_last_month...');
    await dataSource.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_companies_joined_last_month');
    
    console.log('All materialized views refreshed successfully!');
  } catch (error) {
    console.error('Error refreshing materialized views:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

refreshMaterializedViews();