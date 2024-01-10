import { BaseMongoRepository } from './base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import { Logger } from '../../../logger/logger'
import { MongoDatabase } from './mongo-database'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamOptions, ChangeStreamReplaceDocument
} from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import {IngestedMedia} from '../../../model/entities/ingested-media'
import {MongoIngestedMedia} from './mongo-ingested-entity-converter'


const INGESTED_MEDIA_COLLECTION_NAME: string = 'mediaObjects'

export class MongoIngestedMediaChangedListener extends BaseMongoRepository implements DataChangedListener<IngestedMedia> {

  private readonly logger: Logger
  private onCreatedCallback: (media: IngestedMedia) => void
  private onUpdateCallback: (media: IngestedMedia) => void
  private onDeletedCallback: (mediaId: string) => void

  constructor(mongoDatabase: MongoDatabase, logger: Logger) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoIngestedMediaChangedListener.name)
    mongoDatabase.onConnect(INGESTED_MEDIA_COLLECTION_NAME, () => this.listenForChanges())
  }

  protected getCollectionName(): string {
    return INGESTED_MEDIA_COLLECTION_NAME
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedMedia, ChangeStreamDocument<MongoIngestedMedia>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoIngestedMedia>) => void this.onChange(change))
    this.logger.debug('Listening for Media collection changes...')
  }

  private onChange(change: ChangeStreamDocument): void {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoIngestedMedia> = change as ChangeStreamInsertDocument<MongoIngestedMedia>
        void this.onCreatedCallback({mediaId: 'something', mediaPath: 'something', id: 'something', collectionId: 'something'})
        console.log(insertChange)
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument<MongoIngestedMedia> = change as ChangeStreamDeleteDocument<MongoIngestedMedia>
        void this.onDeletedCallback('media id')
        console.log(deleteChange)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const replaceChange: ChangeStreamReplaceDocument<MongoIngestedMedia> = change as ChangeStreamReplaceDocument<MongoIngestedMedia>
        void this.onUpdateCallback({mediaId: 'something', mediaPath: 'something', id: 'something', collectionId: 'something'})
        console.log(replaceChange)
        break
      }
      case MongoChangeEvent.UPDATE: {
        // TODO: Do we need these?
        break
      }
    }
  }

  public onCreated(onCreatedCallback: (media: IngestedMedia) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback:(media: IngestedMedia) => void): void {
    this.onUpdateCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback:(mediaId: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }

}
