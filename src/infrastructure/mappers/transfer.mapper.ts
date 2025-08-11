// src/infrastructure/mappers/transfer.mapper.ts

import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferEntity } from '../database/entities/transfer.entity';
import { Money } from '../../domain/value-objects/money';
import {
  Account,
  createCbuAccount,
  createCvuAccount,
  createAliasAccount,
  accountToString,
} from '../../domain/value-objects/account';

export class TransferMapper {
  static toDomain(entity: TransferEntity): Transfer {
    const debitAccount = TransferMapper.createAccountFromEntity(
      entity.debitAccountType,
      entity.debitAccountValue,
    );
    const creditAccount = TransferMapper.createAccountFromEntity(
      entity.creditAccountType,
      entity.creditAccountValue,
    );

    return new Transfer(
      entity.id,
      entity.amount, // Already a Money object from transformer
      entity.companyId,
      debitAccount,
      creditAccount,
      entity.createdAt,
    );
  }

  static toEntity(domain: Transfer): TransferEntity {
    const entity = new TransferEntity();
    entity.id = domain.id;
    entity.amount = domain.amount; // Money object will be handled by transformer
    entity.companyId = domain.companyId;
    entity.debitAccountType = domain.debitAccount.kind;
    entity.debitAccountValue = accountToString(domain.debitAccount);
    entity.creditAccountType = domain.creditAccount.kind;
    entity.creditAccountValue = accountToString(domain.creditAccount);
    entity.createdAt = domain.createdAt;
    return entity;
  }

  static toDomainList(entities: TransferEntity[]): Transfer[] {
    return entities.map((entity) => TransferMapper.toDomain(entity));
  }

  static toEntityList(domains: Transfer[]): TransferEntity[] {
    return domains.map((domain) => TransferMapper.toEntity(domain));
  }

  // Helper method to create Transfer domain entity from raw values
  static createDomainFromRaw(
    id: string,
    amount: number,
    companyId: string,
    debitAccountType: 'CBU' | 'CVU' | 'ALIAS',
    debitAccountValue: string,
    creditAccountType: 'CBU' | 'CVU' | 'ALIAS',
    creditAccountValue: string,
    createdAt: Date,
  ): Transfer {
    const debitAccount = TransferMapper.createAccountFromEntity(
      debitAccountType,
      debitAccountValue,
    );
    const creditAccount = TransferMapper.createAccountFromEntity(
      creditAccountType,
      creditAccountValue,
    );

    return new Transfer(
      id,
      Money.create(amount),
      companyId,
      debitAccount,
      creditAccount,
      createdAt,
    );
  }

  private static createAccountFromEntity(
    accountType: 'CBU' | 'CVU' | 'ALIAS',
    accountValue: string,
  ): Account {
    switch (accountType) {
      case 'CBU':
        return createCbuAccount(accountValue);
      case 'CVU':
        return createCvuAccount(accountValue);
      case 'ALIAS':
        return createAliasAccount(accountValue);
      default:
        throw new Error(`Invalid account type: ${accountType}`);
    }
  }
}
