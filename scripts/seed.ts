// scripts/seed.ts
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import { CompanyEntity } from '../src/infrastructure/database/entities/company.entity';
import { TransferEntity } from '../src/infrastructure/database/entities/transfer.entity';
import { getDatabaseConfig } from '../src/infrastructure/database/database.config';

async function seed() {
  const config = getDatabaseConfig();
  const dataSource = new DataSource(config as any);
  
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // ⚠️ idempotent: wipe tables
    await dataSource.getRepository(TransferEntity).query('TRUNCATE TABLE transfers RESTART IDENTITY CASCADE');
    await dataSource.getRepository(CompanyEntity).query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');

    // ---------- create companies ----------
    const companies: CompanyEntity[] = [];
    for (let i = 0; i < 5; i++) {
      const isPyme = i < 3;
      const company = dataSource.getRepository(CompanyEntity).create({
        id: uuidv4(),
        cuit: faker.string.numeric(2) + '-' + faker.string.numeric(8) + '-' + faker.string.numeric(1),
        businessName: faker.company.name(),
        joinedAt: faker.date.recent({ days: 120 }),   // within last 4 months
        type: isPyme ? 'PYME' : 'CORPORATE',
      });
      companies.push(company);
    }
    const savedCompanies = await dataSource.getRepository(CompanyEntity).save(companies);
    console.log(`Saved ${savedCompanies.length} companies`);

    // ---------- create random transfers ----------
    const transfers: TransferEntity[] = [];
    for (const c of savedCompanies) {
      const n = faker.number.int({ min: 3, max: 15 });
      console.log(`Creating ${n} transfers for company ${c.businessName}`);
      
      for (let i = 0; i < n; i++) {
        const transfer = dataSource.getRepository(TransferEntity).create({
          id: uuidv4(),
          companyId: c.id,
          amount: parseFloat(faker.finance.amount({ 
            min: 100, 
            max: c.type === 'PYME' ? 100_000 : 1_000_000,
            dec: 2
          })),
          debitAccount: faker.finance.accountNumber(13),
          creditAccount: faker.finance.accountNumber(13),
        });
        transfers.push(transfer);
      }
    }
    
    console.log(`About to save ${transfers.length} transfers`);
    const savedTransfers = await dataSource.getRepository(TransferEntity).save(transfers);
    console.log(`Saved ${savedTransfers.length} transfers`);

    // Update createdAt to random dates using raw SQL since @CreateDateColumn overrides it
    console.log('Updating transfer dates...');
    for (const transfer of savedTransfers) {
      const randomDate = faker.date.recent({ days: 120 });
      await dataSource.query(
        'UPDATE transfers SET created_at = $1 WHERE id = $2',
        [randomDate, transfer.id]
      );
    }

    console.log(`Seeded ${savedCompanies.length} companies & ${savedTransfers.length} transfers 🚀`);
  } catch (error) {
    console.error('Error seeding database:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();