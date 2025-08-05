// scripts/migrate.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../src/infrastructure/database/database.config';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const config = getDatabaseConfig();
  
  // Override synchronize to false for migrations
  const migrationConfig = {
    ...config,
    synchronize: false,
    logging: true,
  };
  
  const dataSource = new DataSource(migrationConfig as any);
  
  try {
    await dataSource.initialize();
    console.log('Database connection established for migrations');

    // Read and execute migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in order

    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await dataSource.query(statement);
          console.log(`✓ Executed: ${statement.substring(0, 50)}...`);
        }
      }
      
      console.log(`✓ Migration ${file} completed successfully`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runMigrations();