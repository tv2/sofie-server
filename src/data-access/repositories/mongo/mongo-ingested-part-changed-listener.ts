import { BaseMongoRepository } from './base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDatabase } from './mongo-database'
import { MongoIngestedPart, MongoIngestedSegment } from './mongo-ingested-entity-converter'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamOptions,
  ChangeStreamReplaceDocument
} from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { IngestedPartRepository } from '../interfaces/ingested-part-repository'
import { IngestedPart } from '../../../model/entities/ingested-part'

const INGESTED_PART_COLLECTION_NAME: string = 'parts' // TODO: Once we control ingest changed this to "ingestedParts"

export class MongoIngestedPartChangedListener extends BaseMongoRepository implements DataChangedListener<IngestedPart> {

  private onCreatedCallback: (part: IngestedPart) => void
  private onUpdatedCallback: (part: IngestedPart) => void
  private onDeletedCallback: (partId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly partRepository: IngestedPartRepository
  ) {
    super(mongoDatabase)
    mongoDatabase.onConnect(INGESTED_PART_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedSegment, ChangeStreamDocument<MongoIngestedSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoIngestedPart>) => void this.onChange(change))
    console.debug('### Listening for Part collection changes...')
  }

  private async onChange(change: ChangeStreamDocument<MongoIngestedPart>): Promise<void> {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoIngestedPart> = change as ChangeStreamInsertDocument<MongoIngestedPart>
        const ingestedPartId: string = insertChange.fullDocument._id
        const ingestedPart: IngestedPart = await this.partRepository.getIngestedPart(ingestedPartId)
        void this.onCreatedCallback(ingestedPart)
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument<MongoIngestedPart> = change as ChangeStreamDeleteDocument<MongoIngestedPart>
        const partId: string = deleteChange.documentKey._id
        void this.onDeletedCallback(partId)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const replaceChange: ChangeStreamReplaceDocument<MongoIngestedPart> = change as ChangeStreamReplaceDocument<MongoIngestedPart>
        const ingestedPartId: string = replaceChange.fullDocument._id
        const ingestedPart: IngestedPart = await this.partRepository.getIngestedPart(ingestedPartId)
        void this.onUpdatedCallback(ingestedPart)
        break
      }
      case MongoChangeEvent.UPDATE: {
        // These are all SofieServer changes. We don't care to listen for those.
        break
      }
    }
  }

  protected getCollectionName(): string {
    return INGESTED_PART_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (part: IngestedPart) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (part: IngestedPart) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback: (id: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
