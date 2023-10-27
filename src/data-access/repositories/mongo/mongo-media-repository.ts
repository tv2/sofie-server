import { BaseMongoRepository } from './base-mongo-repository'
import { MediaRepository } from '../interfaces/MediaRepository'
import { Media } from '../../../model/entities/media'
import { MongoEntityConverter, MongoMedia } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'

const MEDIA_COLLECTION_NAME: string = 'mediaObjects'

export class MongoMediaRepository extends BaseMongoRepository implements MediaRepository {

  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return MEDIA_COLLECTION_NAME
  }

  public async getMedia(mediaId: string): Promise<Media | undefined> {
    this.assertDatabaseConnection(this.getMedia.name)
    const mongoMedia: MongoMedia | null = await this.getCollection().findOne<MongoMedia>({ mediaId })
    if (!mongoMedia) {
      // There might not be Media available yet.
      return undefined
    }
    return this.mongoEntityConverter.convertMedia(mongoMedia)
  }
}
