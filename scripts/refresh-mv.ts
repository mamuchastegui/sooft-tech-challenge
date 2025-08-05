// scripts/refresh-mv.ts

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../src/infrastructure/database/database.config';

// Load environment variables
dotenv.config();

async function refreshMaterializedViews() {
  const dataSource = new DataSource(getDatabaseConfig());

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