import { BaseMongoRepository } from './base-mongo-repository'
import { ManifestRepository } from '../interfaces/manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { MongoActionManifest, MongoEntityConverter } from './mongo-entity-converter'

const COLLECTION_NAME: string = 'adLibActions'

export class MongoManifestRepository extends BaseMongoRepository implements ManifestRepository {
  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  public async getActionManifests(): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    const mongoActionManifests: MongoActionManifest[] = (await this.getCollection().find().toArray()) as unknown as MongoActionManifest[]
    return this.mongoEntityConverter.convertActionManifests(mongoActionManifests)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

}