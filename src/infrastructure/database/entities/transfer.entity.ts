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
import { Money } from '../../../domain/value-objects/money.vo';
import { AccountId } from '../../../domain/value-objects/account-id.vo';
import { MoneyTransformer } from '../transformers/money.transformer';
import { AccountIdTransformer } from '../transformers/account-id.transformer';

@Entity('transfers')
export class TransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    transformer: new MoneyTransformer(),
  })
  amount: Money;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column('varchar', {
    name: 'debit_account',
    length: 13,
    transformer: new AccountIdTransformer(),
  })
  debitAccount: AccountId;

  @Column('varchar', {
    name: 'credit_account',
    length: 13,
    transformer: new AccountIdTransformer(),
  })
  creditAccount: AccountId;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CompanyEntity, (company) => company.transfers)
  @JoinColumn({ name: 'company_id' })
  company: CompanyEntity;
}
