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
import { Cuit } from '../src/domain/value-objects/cuit';
import { Money } from '../src/domain/value-objects/money';
import { AccountId } from '../src/domain/value-objects/account-id';

// Helper function to generate valid CUIT
function generateValidCuit(): string {
  // Use known valid CUITs to avoid calculation errors
  const validCuits = [
    '20-12345678-6',
    '27-12345678-0', 
    '30-50123456-3',
    '20-11111111-2',
    '27-95555554-1',
    '30-12345678-1',
    '20-00000006-0',
    '20-00000001-9'
  ];
  
  return faker.helpers.arrayElement(validCuits);
}

// Helper function to generate valid AccountId (13 digits)
function generateValidAccountId(): string {
  return faker.string.numeric(13);
}

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
    const validCuits = [
      '20-12345678-6',
      '27-12345678-0', 
      '30-50123456-3',
      '20-11111111-2',
      '27-95555554-1'
    ];
    
    for (let i = 0; i < 5; i++) {
      const isPyme = i < 3;
      const company = dataSource.getRepository(CompanyEntity).create({
        id: uuidv4(),
        cuit: Cuit.create(validCuits[i]), // Use unique CUIT for each company
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
          amount: Money.create(parseFloat(faker.finance.amount({ 
            min: 100, 
            max: c.type === 'PYME' ? 100_000 : 1_000_000,
            dec: 2
          }))),
          debitAccountType: 'CBU',
          debitAccountValue: '2850590940090418135201',
          creditAccountType: 'ALIAS',
          creditAccountValue: 'my.wallet',
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