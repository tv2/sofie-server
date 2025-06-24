import { INewsIngestConfigurationRepository } from '../../../domain/repositories/i-news-ingest-configuration-repository'
import { INewsIngestConfiguration } from '../../../domain/entities/i-news-ingest-configuration'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'

const I_NEWS_INGEST_CONFIGURATION_COLLECTION_NAME: string = 'iNewsIngestConfigurations'

interface MongoINewsIngestConfiguration extends INewsIngestConfiguration {
  _id: string
}

export class MongoINewsIngestConfigurationRepository extends BaseMongoRepository<MongoINewsIngestConfiguration> implements INewsIngestConfigurationRepository {
  public constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return I_NEWS_INGEST_CONFIGURATION_COLLECTION_NAME
  }

  public async get(): Promise<INewsIngestConfiguration> {
    this.assertDatabaseConnection(this.get.name)
    const iNewsIngestConfiguration: INewsIngestConfiguration | null = await this.getCollection().findOne()
    if (!iNewsIngestConfiguration) {
      return {
        queueSubscriptions: []
      }
    }
    return iNewsIngestConfiguration
  }

  public async save(iNewsIngestConfiguration: INewsIngestConfiguration): Promise<void> {
    this.assertDatabaseConnection(this.save.name)
    const count: number = await this.getCollection().estimatedDocumentCount()
    if (count === 1) {
      await this.getCollection().replaceOne({}, iNewsIngestConfiguration)
    } else {
      await this.getCollection().updateOne({}, { $set: iNewsIngestConfiguration }, { upsert: true })
    }
  }
}
