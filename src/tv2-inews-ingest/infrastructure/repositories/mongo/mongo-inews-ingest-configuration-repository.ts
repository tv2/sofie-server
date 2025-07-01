import { InewsIngestConfigurationRepository } from '../../../domain/repositories/inews-ingest-configuration-repository'
import { InewsIngestConfiguration } from '../../../domain/entities/inews-ingest-configuration'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'

const INEWS_INGEST_CONFIGURATION_COLLECTION_NAME: string = 'inewsIngestConfigurations'

interface MongoInewsIngestConfiguration extends InewsIngestConfiguration {
  _id: string
}

export class MongoInewsIngestConfigurationRepository extends BaseMongoRepository<MongoInewsIngestConfiguration> implements InewsIngestConfigurationRepository {
  public constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return INEWS_INGEST_CONFIGURATION_COLLECTION_NAME
  }

  public async get(): Promise<InewsIngestConfiguration> {
    this.assertDatabaseConnection(this.get.name)
    const inewsIngestConfiguration: InewsIngestConfiguration | null = await this.getCollection().findOne()
    return inewsIngestConfiguration ?? this.createEmptyInewsIngestConfiguration()
  }

  private createEmptyInewsIngestConfiguration(): InewsIngestConfiguration {
    return {
      queueSubscriptions: []
    }
  }

  public async save(inewsIngestConfiguration: InewsIngestConfiguration): Promise<void> {
    this.assertDatabaseConnection(this.save.name)
    await this.getCollection().replaceOne({}, inewsIngestConfiguration, { upsert: true })
  }
}
