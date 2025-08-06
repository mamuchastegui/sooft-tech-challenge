// src/infrastructure/database/entities/company.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  TableInheritance,
  ChildEntity,
} from 'typeorm';
import { TransferEntity } from './transfer.entity';

@Entity('companies')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 13 })
  cuit: string;

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

@ChildEntity('PYME')
export class PymeCompanyEntity extends CompanyEntity {}

@ChildEntity('CORPORATE')
export class CorporateCompanyEntity extends CompanyEntity {}
