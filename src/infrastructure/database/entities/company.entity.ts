// src/infrastructure/database/entities/company.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { TransferEntity } from './transfer.entity';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 13 })
  cuit: string;

  @Column({ name: 'business_name', length: 255 })
  businessName: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({
    type: 'enum',
    enum: ['PYME', 'CORPORATE'],
  })
  type: 'PYME' | 'CORPORATE';

  @OneToMany(() => TransferEntity, (transfer) => transfer.company)
  transfers: TransferEntity[];
}
