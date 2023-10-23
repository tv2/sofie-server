import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamOptions,
  ChangeStreamReplaceDocument
} from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { Segment } from '../../../model/entities/segment'
import { SegmentRepository } from '../interfaces/segment-repository'

const SEGMENT_COLLECTION_NAME: string = 'segments'

export class MongoSegmentChangedListener extends BaseMongoRepository implements DataChangedListener<Segment> {

  private onCreatedCallback: (segment: Segment) => void
  private onUpdatedCallback: (segment: Segment) => void
  private onDeletedCallback: (segmentId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    mongoEntityConverter: MongoEntityConverter,
    private readonly segmentRepository: SegmentRepository
  ) {
    super(mongoDatabase, mongoEntityConverter)
    mongoDatabase.onConnect(SEGMENT_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoSegment, ChangeStreamDocument<MongoSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoSegment>) => void this.onChange(change))
    console.debug('### Listening for Segment collection changes...')
  }

  private async onChange(change: ChangeStreamDocument<MongoSegment>): Promise<void> {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoSegment> = change as ChangeStreamInsertDocument<MongoSegment>
        const segmentId: string = insertChange.fullDocument._id
        const segment: Segment = await this.segmentRepository.getSegment(segmentId)
        this.onCreatedCallback(segment)
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument = change as ChangeStreamDeleteDocument
        const segmentId: string = deleteChange.documentKey._id as unknown as string
        this.onDeletedCallback(segmentId)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const replaceChange: ChangeStreamReplaceDocument<MongoSegment> = change as ChangeStreamReplaceDocument<MongoSegment>
        const segmentId: string = replaceChange.fullDocument._id
        const segment: Segment = await this.segmentRepository.getSegment(segmentId)
        this.onUpdatedCallback(segment)
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

  public onCreated(onCreatedCallback: (segment: Segment) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (segment: Segment) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback: (segmentId: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
