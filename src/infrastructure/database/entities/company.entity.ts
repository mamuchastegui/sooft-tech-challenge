// src/infrastructure/database/entities/company.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { TransferEntity } from './transfer.entity';
import { Cuit } from '../../../domain/value-objects/cuit.vo';
import { CuitTransformer } from '../transformers/cuit.transformer';

@Entity('companies')
export abstract class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', {
    unique: true,
    length: 13,
    transformer: new CuitTransformer(),
  })
  cuit: Cuit;

  @Column({ name: 'business_name', length: 255 })
  businessName: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({
    type: 'varchar',
    length: 20,
  })
  type: string;

  @OneToMany(() => TransferEntity, (transfer) => transfer.company)
  transfers: TransferEntity[];
}

@Entity('companies')
export class PymeCompanyEntity extends CompanyEntity {
  constructor() {
    super();
    this.type = 'PYME';
  }
}

@Entity('companies')
export class CorporateCompanyEntity extends CompanyEntity {
  constructor() {
    super();
    this.type = 'CORPORATE';
  }
}
