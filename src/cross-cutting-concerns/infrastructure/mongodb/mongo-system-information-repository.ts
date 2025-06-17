import { SystemInformation } from '../../domain/value-objects/system-information'
import { SystemInformationRepository } from '../../domain/repositories/system-information-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSystemInformation } from '../../../rundown-execution/infrastructure/repositories/mongodb/mongo-entity-converter'
import { NotFoundException } from '../../../rundown-execution/domain/exceptions/not-found-exception'

const SYSTEM_INFORMATION_COLLECTION_NAME: string = 'coreSystem'

export class MongoSystemInformationRepository extends BaseMongoRepository<MongoSystemInformation> implements SystemInformationRepository {
  public constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
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
