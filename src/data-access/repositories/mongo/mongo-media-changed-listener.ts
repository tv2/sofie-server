import { BaseMongoRepository } from './base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import { Logger } from '../../../logger/logger'
import { MongoDatabase } from './mongo-database'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamOptions, ChangeStreamReplaceDocument, ChangeStreamUpdateDocument
} from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import {MongoMedia} from './mongo-entity-converter'
import {Media} from '../../../model/entities/media'
import {MediaRepository} from '../interfaces/MediaRepository'


const MEDIA_COLLECTION_NAME: string = 'mediaObjects'

export class MongoMediaChangedListener extends BaseMongoRepository implements DataChangedListener<Media> {

  private readonly logger: Logger
  private onCreatedCallback: (media: Media) => void
  private onUpdateCallback: (media: Media) => void
  private onDeletedCallback: (mediaId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    logger: Logger,
    private readonly mediaRepository: MediaRepository
  ) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoMediaChangedListener.name)
    mongoDatabase.onConnect(MEDIA_COLLECTION_NAME, () => this.listenForChanges())
  }

  protected getCollectionName(): string {
    return MEDIA_COLLECTION_NAME
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoMedia, ChangeStreamDocument<MongoMedia>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoMedia>) => void this.onChange(change))
    this.logger.debug('Listening for Media collection changes...')
  }

  private async onChange(change: ChangeStreamDocument): Promise<void> {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoMedia> = change as ChangeStreamInsertDocument<MongoMedia>
        const mongoMediaId: string = insertChange.fullDocument.mediaId
        const media: Media | undefined = await this.mediaRepository.getMedia(mongoMediaId)
        if (media) {
          void this.onCreatedCallback(media)
        }
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument<MongoMedia> = change as ChangeStreamDeleteDocument<MongoMedia>
        const mongoMediaId: string = deleteChange.documentKey._id
        void this. onDeletedCallback(mongoMediaId)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const replaceChange: ChangeStreamReplaceDocument<MongoMedia> = change as ChangeStreamReplaceDocument<MongoMedia>
        const mongoMediaId: string = replaceChange.fullDocument.mediaId
        const media: Media | undefined = await this.mediaRepository.getMedia(mongoMediaId)
        if (media) {
          void this.onUpdateCallback(media)
        }
        break
      }
      case MongoChangeEvent.UPDATE: {
        const updateChange: ChangeStreamUpdateDocument<MongoMedia> = change as ChangeStreamUpdateDocument<MongoMedia>
        const mongoMediaId: string | undefined = updateChange.fullDocument?.mediaId
        if (!mongoMediaId) {
          break
        }
        const media: Media | undefined = await this.mediaRepository.getMedia(mongoMediaId)
        if (media) {
          void this.onUpdateCallback(media)
        }
        break
      }
    }
  }

  public onCreated(onCreatedCallback: (media: Media) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback:(media: Media) => void): void {
    this.onUpdateCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback:(mediaId: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
