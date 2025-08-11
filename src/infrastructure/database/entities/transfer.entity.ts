// src/infrastructure/database/entities/transfer.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { CompanyEntity } from './company.entity';
import { Money } from '../../../domain/value-objects/money';
import { LegacyMoneyTransformer } from '../transformers/money.transformer';

@Entity('transfers')
export class TransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    transformer: new LegacyMoneyTransformer(),
  })
  amount: Money;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column('varchar', {
    name: 'debit_account_type',
    length: 10,
  })
  debitAccountType: 'CBU' | 'CVU' | 'ALIAS';

  @Column('varchar', {
    name: 'debit_account_value',
    length: 22,
  })
  debitAccountValue: string;

  @Column('varchar', {
    name: 'credit_account_type',
    length: 10,
  })
  creditAccountType: 'CBU' | 'CVU' | 'ALIAS';

  @Column('varchar', {
    name: 'credit_account_value',
    length: 22,
  })
  creditAccountValue: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CompanyEntity, (company) => company.transfers)
  @JoinColumn({ name: 'company_id' })
  company: CompanyEntity;
}
