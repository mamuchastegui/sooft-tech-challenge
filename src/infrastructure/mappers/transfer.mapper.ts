// src/infrastructure/mappers/transfer.mapper.ts

import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferEntity } from '../database/entities/transfer.entity';
import { Money } from '../../domain/value-objects/money';
import { AccountId } from '../../domain/value-objects/account-id';

export class TransferMapper {
  static toDomain(entity: TransferEntity): Transfer {
    return new Transfer(
      entity.id,
      entity.amount, // Already a Money object from transformer
      entity.companyId,
      entity.debitAccount, // Already an AccountId object from transformer
      entity.creditAccount, // Already an AccountId object from transformer
      entity.createdAt,
    );
  }

  static toEntity(domain: Transfer): TransferEntity {
    const entity = new TransferEntity();
    entity.id = domain.id;
    entity.amount = domain.amount; // Money object will be handled by transformer
    entity.companyId = domain.companyId;
    entity.debitAccount = domain.debitAccount; // AccountId object will be handled by transformer
    entity.creditAccount = domain.creditAccount; // AccountId object will be handled by transformer
    entity.createdAt = domain.createdAt;
    return entity;
  }

  static toDomainList(entities: TransferEntity[]): Transfer[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  static toEntityList(domains: Transfer[]): TransferEntity[] {
    return domains.map((domain) => this.toEntity(domain));
  }

  // Helper method to create Transfer domain entity from raw values
  static createDomainFromRaw(
    id: string,
    amount: number,
    companyId: string,
    debitAccount: string,
    creditAccount: string,
    createdAt: Date,
  ): Transfer {
    return new Transfer(
      id,
      Money.create(amount),
      companyId,
      AccountId.create(debitAccount),
      AccountId.create(creditAccount),
      createdAt,
    );
  }
}
