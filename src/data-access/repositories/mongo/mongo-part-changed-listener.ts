import { BaseMongoRepository } from './base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoPart, MongoSegment } from './mongo-entity-converter'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamReplaceDocument
} from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { Part } from '../../../model/entities/part'
import { PartRepository } from '../interfaces/part-repository'

const PART_COLLECTION_NAME: string = 'parts'

export class MongoPartChangedListener extends BaseMongoRepository implements DataChangedListener<Part> {

  private onCreatedCallback: (part: Part) => Promise<void>
  private onUpdatedCallback: (part: Part) => Promise<void>
  private onDeletedCallback: (partId: string) => Promise<void>

  constructor(
    mongoDatabase: MongoDatabase,
    mongoEntityConverter: MongoEntityConverter,
    private readonly partRepository: PartRepository
  ) {
    super(mongoDatabase, mongoEntityConverter)
    mongoDatabase.onConnect(PART_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoSegment, ChangeStreamDocument<MongoSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoPart>) => void this.onChange(change))
    console.log('### Listening for Part collection changes...')
  }

  private async onChange(change: ChangeStreamDocument<MongoPart>): Promise<void> {
    if (change.operationType !== MongoChangeEvent.UPDATE) {
      console.log(`### PartListener: Got a "${change.operationType}" event!`)
    }
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoPart> = change as ChangeStreamInsertDocument<MongoPart>
        const partId: string = insertChange.fullDocument._id
        const part: Part = await this.partRepository.getPart(partId)
        void this.onCreatedCallback(part)
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument = change as ChangeStreamDeleteDocument
        const partId: string = deleteChange.documentKey._id as unknown as string
        void this.onDeletedCallback(partId)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const replaceChange: ChangeStreamReplaceDocument = change as ChangeStreamReplaceDocument
        const partId: string = replaceChange.fullDocument._id
        const part: Part = await this.partRepository.getPart(partId)
        void this.onUpdatedCallback(part)
        break
      }
      case MongoChangeEvent.UPDATE: {
        // These are all SofieServer changes. We don't care to listen for those.
        break
      }
    }
  }

  protected getCollectionName(): string {
    return PART_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (part: Part) => Promise<void>): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (part: Part) => Promise<void>): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback: (id: string) => Promise<void>): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
