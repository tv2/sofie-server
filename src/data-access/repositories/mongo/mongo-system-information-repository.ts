import { SystemInformation } from '../../../model/entities/system-information'
import { SystemInformationRepository } from '../interfaces/system-information-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSystemInformation } from './mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const SYSTEM_INFORMATION_COLLECTION_NAME: string = 'coreSystem'

export class MongoSystemInformationRepository extends BaseMongoRepository implements SystemInformationRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return SYSTEM_INFORMATION_COLLECTION_NAME
  }

  public async getSystemInformation(): Promise<SystemInformation> {
    const mongoSystemInformation: MongoSystemInformation | null = await this.getCollection().findOne<MongoSystemInformation>()
    if (!mongoSystemInformation) {
      throw new NotFoundException('No SystemInformation found. Has Sofie been set up correctly?')
    }
    return this.mongoEntityConverter.convertSystemInformation(mongoSystemInformation)
  }
}
