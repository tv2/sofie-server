import { BaseMongoRepository } from './base-mongo-repository'
import { PlayoutContent } from '../../../rundown-execution/domain/value-objects/playout-content'
import { PlayoutContentRepository } from '../interfaces/playout-content-repository'
import { MongoId } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'


const PLAYOUT_CONTENT_COLLECTION_NAME: string = 'playoutContents'
const PROGRAM_PLAYOUT_CONTENT_ID: string = 'PROGRAM'
const PREVIEW_PLAYOUT_CONTENT_ID: string = 'PREVIEW'

interface MongoPlayoutContentWrapper extends MongoId {
  playoutContents: PlayoutContent[]
}

export class MongoPlayoutContentRepository extends BaseMongoRepository<MongoPlayoutContentWrapper> implements PlayoutContentRepository {

  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return PLAYOUT_CONTENT_COLLECTION_NAME
  }

  public async savePlayoutContents(programPlayoutContents: PlayoutContent[], previewPlayoutContent: PlayoutContent[]): Promise<void> {
    this.assertDatabaseConnection(this.savePlayoutContents.name)
    await this.getCollection().updateOne({ _id: PROGRAM_PLAYOUT_CONTENT_ID }, {
      $set: {
        playoutContents: programPlayoutContents
      }
    }, { upsert: true })

    await this.getCollection().updateOne({ _id: PREVIEW_PLAYOUT_CONTENT_ID }, {
      $set: {
        playoutContents: previewPlayoutContent
      }
    }, { upsert: true })
  }

  public async getProgramPlayoutContents(): Promise<PlayoutContent[]> {
    this.assertDatabaseConnection(this.getProgramPlayoutContents.name)
    return this.getPlayoutContents(PROGRAM_PLAYOUT_CONTENT_ID)
  }

  private async getPlayoutContents(id: string): Promise<PlayoutContent[]> {
    const mongoPlayoutContentWrapper: MongoPlayoutContentWrapper | null = await this.getCollection().findOne({ _id: id })
    if (!mongoPlayoutContentWrapper) {
      return []
    }
    return mongoPlayoutContentWrapper.playoutContents
  }

  public async getPreviewPlayoutContents(): Promise<PlayoutContent[]> {
    this.assertDatabaseConnection(this.getPreviewPlayoutContents.name)
    return this.getPlayoutContents(PREVIEW_PLAYOUT_CONTENT_ID)
  }
}
