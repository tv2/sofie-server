import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoActionManifest, MongoEntityConverter } from './mongo-entity-converter'

const ACTION_MANIFEST_COLLECTION: string = 'adLibActions'

export class MongoActionManifestRepository extends BaseMongoRepository implements ActionManifestRepository {

  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return ACTION_MANIFEST_COLLECTION
  }

  public async getActionManifests(): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    const mongoActionManifests: MongoActionManifest[] = await this.getCollection().find<MongoActionManifest>({}).toArray()
    return mongoActionManifests.map(actionManifest => this.mongoEntityConverter.convertActionManifest(actionManifest))
  }
}
