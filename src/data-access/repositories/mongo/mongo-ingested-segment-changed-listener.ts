import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDatabase } from './mongo-database'
import { MongoIngestedSegment } from './mongo-ingested-entity-converter'
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
import { IngestedSegment } from '../../../model/entities/ingested-segment'
import { IngestedSegmentRepository } from '../interfaces/ingested-segment-repository'
import { LoggerService } from '../../../model/services/logger-service'

const INGESTED_SEGMENT_COLLECTION_NAME: string = 'segments' // TODO: Once we control ingest changed this to "ingestedSegments"

export class MongoIngestedSegmentChangedListener extends BaseMongoRepository implements DataChangedListener<IngestedSegment> {

  private onCreatedCallback: (segment: IngestedSegment) => void
  private onUpdatedCallback: (segment: IngestedSegment) => void
  private onDeletedCallback: (segmentId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly ingestedSegmentRepository: IngestedSegmentRepository,
    private readonly loggerService: LoggerService
  ) {
    super(mongoDatabase)
    this.loggerService.tag(MongoIngestedSegmentChangedListener.name)
    mongoDatabase.onConnect(INGESTED_SEGMENT_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedSegment, ChangeStreamDocument<MongoIngestedSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoIngestedSegment>) => void this.onChange(change))
    this.loggerService.debug('Listening for Segment collection changes...')
  }

  private async onChange(change: ChangeStreamDocument<MongoIngestedSegment>): Promise<void> {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoIngestedSegment> = change as ChangeStreamInsertDocument<MongoIngestedSegment>
        const ingestedSegmentId: string = insertChange.fullDocument._id
        const ingestedSegment: IngestedSegment = await this.ingestedSegmentRepository.getIngestedSegment(ingestedSegmentId)
        this.onCreatedCallback(ingestedSegment)
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument<MongoIngestedSegment> = change as ChangeStreamDeleteDocument<MongoIngestedSegment>
        const ingestedSegmentId: string = deleteChange.documentKey._id
        this.onDeletedCallback(ingestedSegmentId)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const replaceChange: ChangeStreamReplaceDocument<MongoIngestedSegment> = change as ChangeStreamReplaceDocument<MongoIngestedSegment>
        const ingestedSegmentId: string = replaceChange.fullDocument._id
        const ingestedSegment: IngestedSegment = await this.ingestedSegmentRepository.getIngestedSegment(ingestedSegmentId)
        this.onUpdatedCallback(ingestedSegment)
        break
      }
      case MongoChangeEvent.UPDATE: {
        // These are all SofieServer changes. We don't care to listen for those.
        break
      }
    }
  }

  protected getCollectionName(): string {
    return INGESTED_SEGMENT_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (segment: IngestedSegment) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (segment: IngestedSegment) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback: (segmentId: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
