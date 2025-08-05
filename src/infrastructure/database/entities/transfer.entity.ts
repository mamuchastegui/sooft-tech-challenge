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

@Entity('transfers')
export class TransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'debit_account', length: 13 })
  debitAccount: string;

  @Column({ name: 'credit_account', length: 13 })
  creditAccount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => CompanyEntity, (company) => company.transfers)
  @JoinColumn({ name: 'company_id' })
  company: CompanyEntity;
}
