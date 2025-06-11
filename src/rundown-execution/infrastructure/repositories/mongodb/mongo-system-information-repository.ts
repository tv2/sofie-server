import { SystemInformation } from '../../../domain/entities/system-information'
import { SystemInformationRepository } from '../../../domain/repositories/system-information-repository'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { MongoEntityConverter, MongoSystemInformation } from './mongo-entity-converter'
import { NotFoundException } from '../../../domain/exceptions/not-found-exception'

const SYSTEM_INFORMATION_COLLECTION_NAME: string = 'coreSystem'

export class MongoSystemInformationRepository extends BaseMongoRepository<MongoSystemInformation> implements SystemInformationRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
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
    return this.mongoEntityConverter.convertSystemInformation(mongoSystemInformation)
  }
}
