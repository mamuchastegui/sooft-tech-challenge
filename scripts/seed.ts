// scripts/seed.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
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

    // Synchronize database schema (create tables if they don't exist)
    await dataSource.synchronize();
    console.log('Database schema synchronized');

    // Clear existing data (if tables exist)
    try {
      await dataSource.getRepository(TransferEntity).clear();
      await dataSource.getRepository(CompanyEntity).clear();
      console.log('Existing data cleared');
    } catch (error) {
      // Tables might not exist yet, that's OK
      console.log('No existing data to clear (tables may be new)');
    }

    // Create companies
    const companyRepository = dataSource.getRepository(CompanyEntity);
    const transferRepository = dataSource.getRepository(TransferEntity);

    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);

    // Generate consistent UUIDs for companies
    const companyId1 = uuidv4();
    const companyId2 = uuidv4();
    const companyId3 = uuidv4();
    const companyId4 = uuidv4();
    const companyId5 = uuidv4();

    const companies = [
      {
        id: companyId1,
        cuit: '20-12345678-6',
        businessName: 'Tech Solutions SA',
        joinedAt: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        type: 'CORPORATE' as const,
      },
      {
        id: companyId2,
        cuit: '27-87654321-0',
        businessName: 'Small Business Inc',
        joinedAt: new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        type: 'PYME' as const,
      },
      {
        id: companyId3,
        cuit: '30-11223344-5',
        businessName: 'Enterprise Corp',
        joinedAt: new Date(twoMonthsAgo.getTime() - 5 * 24 * 60 * 60 * 1000), // 2+ months ago
        type: 'CORPORATE' as const,
      },
      {
        id: companyId4,
        cuit: '23-55667788-1',
        businessName: 'Local Services Ltd',
        joinedAt: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        type: 'PYME' as const,
      },
      {
        id: companyId5,
        cuit: '33-99887766-2',
        businessName: 'Global Industries',
        joinedAt: new Date(twoMonthsAgo.getTime() - 10 * 24 * 60 * 60 * 1000), // 2+ months ago
        type: 'CORPORATE' as const,
      },
    ];

    const savedCompanies = await companyRepository.save(companies);
    console.log(`Inserted ${savedCompanies.length} companies`);

    // Create transfers
    const transfers = [
      {
        id: uuidv4(),
        amount: 15000.50,
        companyId: companyId1,
        debitAccount: '001-123456-01',
        creditAccount: '001-654321-02',
        createdAt: new Date(currentDate.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      },
      {
        id: uuidv4(),
        amount: 25000.00,
        companyId: companyId1,
        debitAccount: '001-123456-01',
        creditAccount: '002-111111-01',
        createdAt: new Date(currentDate.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
      {
        id: uuidv4(),
        amount: 8500.75,
        companyId: companyId2,
        debitAccount: '002-987654-03',
        creditAccount: '003-222222-01',
        createdAt: new Date(currentDate.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      },
      {
        id: uuidv4(),
        amount: 45000.00,
        companyId: companyId3,
        debitAccount: '003-555666-01',
        creditAccount: '001-123456-01',
        createdAt: new Date(twoMonthsAgo.getTime() - 3 * 24 * 60 * 60 * 1000), // 2+ months ago
      },
      {
        id: uuidv4(),
        amount: 12000.25,
        companyId: companyId4,
        debitAccount: '004-777888-02',
        creditAccount: '005-999000-01',
        createdAt: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: uuidv4(),
        amount: 33000.00,
        companyId: companyId1,
        debitAccount: '001-123456-01',
        creditAccount: '006-333444-01',
        createdAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ];

    const savedTransfers = await transferRepository.save(transfers);
    console.log(`Inserted ${savedTransfers.length} transfers`);

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();