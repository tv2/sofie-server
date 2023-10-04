import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamReplaceDocument
} from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { Segment } from '../../../model/entities/segment'
import { SegmentRepository } from '../interfaces/segment-repository'

const SEGMENT_COLLECTION_NAME: string = 'segments'

export class MongoSegmentChangedListener extends BaseMongoRepository implements DataChangedListener<Segment> {

  private onCreatedCallback: (segment: Segment) => Promise<void>
  private onUpdatedCallback: (segment: Segment) => Promise<void>
  private onDeletedCallback: (segmentId: string) => Promise<void>

  constructor(
    mongoDatabase: MongoDatabase,
    mongoEntityConverter: MongoEntityConverter,
    private readonly segmentRepository: SegmentRepository
  ) {
    super(mongoDatabase, mongoEntityConverter)
    mongoDatabase.onConnect(SEGMENT_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoSegment, ChangeStreamDocument<MongoSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoSegment>) => void this.onChange(change))
    console.log('### Listening for Segment collection changes...')
  }

  private async onChange(change: ChangeStreamDocument<MongoSegment>): Promise<void> {
    if (change.operationType !== MongoChangeEvent.UPDATE) {
      console.log(`### SegmentListener: Got a "${change.operationType}" event!`)
    }
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoSegment> = change as ChangeStreamInsertDocument<MongoSegment>
        const segmentId: string = insertChange.fullDocument._id
        const segment: Segment = await this.segmentRepository.getSegment(segmentId)
        void this.onCreatedCallback(segment)
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument = change as ChangeStreamDeleteDocument
        const segmentId: string = deleteChange.documentKey._id as unknown as string
        void this.onDeletedCallback(segmentId)
        break
      }
      case MongoChangeEvent.REPLACE: {
        console.log(change)
        const replaceChange: ChangeStreamReplaceDocument<MongoSegment> = change as ChangeStreamReplaceDocument<MongoSegment>
        const segmentId: string = replaceChange.fullDocument._id
        const segment: Segment = await this.segmentRepository.getSegment(segmentId)
        void this.onUpdatedCallback(segment)
        break
      }
      case MongoChangeEvent.UPDATE: {
        // These are all SofieServer changes. We don't care to listen for those.
        break
      }
    }
  }

  protected getCollectionName(): string {
    return SEGMENT_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (segment: Segment) => Promise<void>): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (segment: Segment) => Promise<void>): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback: (segmentId: string) => Promise<void>): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
