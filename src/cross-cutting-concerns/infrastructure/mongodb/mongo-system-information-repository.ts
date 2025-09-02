import { SystemInformation } from '../../domain/value-objects/system-information'
import { SystemInformationRepository } from '../../domain/repositories/system-information-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { NotFoundException } from '../../domain/exceptions/not-found-exception'
import {
  CrossCuttingConcernsMongoEntityConverter,
  MongoSystemInformation
} from './cross-cutting-concerns-mongo-entity-converter'

const SYSTEM_INFORMATION_COLLECTION_NAME: string = 'coreSystem'

export class MongoSystemInformationRepository extends BaseMongoRepository<MongoSystemInformation> implements SystemInformationRepository {
  public constructor(mongoDatabase: MongoDatabase, private readonly crossCuttingConcernsMongoEntityConverter: CrossCuttingConcernsMongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return SYSTEM_INFORMATION_COLLECTION_NAME
  }

  public async getSystemInformation(): Promise<SystemInformation> {
    const mongoSystemInformation: MongoSystemInformation | null = await this.getCollection().findOne<MongoSystemInformation>()
    if (!mongoSystemInformation) {
      throw new NotFoundException('No SystemInformation found. Has Alba been set up correctly?')
    }
    return this.crossCuttingConcernsMongoEntityConverter.convertSystemInformation(mongoSystemInformation)
  }
}
