import { BaseMongoRepository } from './base-mongo-repository'
import { MediaRepository } from '../interfaces/MediaRepository'
import { Media } from '../../../model/entities/media'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoMedia } from './mongo-entity-converter'

const MEDIA_COLLECTION_NAME: string = 'mediaObjects'

export class MongoMediaRepository extends BaseMongoRepository implements MediaRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return MEDIA_COLLECTION_NAME
  }

  public async getMedia(): Promise<Media[]> {
    this.assertDatabaseConnection(this.getMedia.name)
    const mongoMedia: MongoMedia[] = await this.getCollection().find<MongoMedia>({}).toArray()
    return mongoMedia.map(media => this.mongoEntityConverter.convertMedia(media))
  }

  public async getMediaBySourceName(sourceName: string): Promise<Media | undefined> {
    this.assertDatabaseConnection(this.getMediaBySourceName.name)
    const mongoMedia: MongoMedia | null = await this.getCollection().findOne<MongoMedia>({ mediaId: sourceName })
    if (!mongoMedia) {
      // There might not be Media available yet.
      return undefined
    }
    return this.mongoEntityConverter.convertMedia(mongoMedia)
  }
}
