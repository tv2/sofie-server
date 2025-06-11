import { DataChangedListener } from '../../../../cross-cutting-concerns/application/data-changed-listener'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { MongoIngestedEntityConverter, MongoIngestedSegment } from '../../../../rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-entity-converter'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamOptions,
} from 'mongodb'
import { MongoChangeEvent } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-change-event'
import { IngestedSegment } from '../../../../rundown-execution/domain/entities/ingested-segment'
import { Logger } from '../../../../cross-cutting-concerns/application/logger'

const INGESTED_SEGMENT_COLLECTION_NAME: string = 'segments' // TODO: Once we control ingest changed this to "ingestedSegments"

export class MongoIngestedSegmentChangedListener extends BaseMongoRepository<MongoIngestedSegment> implements DataChangedListener<IngestedSegment> {

  private readonly logger: Logger
  private onCreatedCallback: (segment: IngestedSegment) => void
  private onUpdatedCallback: (segment: IngestedSegment) => void
  private onDeletedCallback: (segmentId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoIngestedEntityConverter: MongoIngestedEntityConverter,
    logger: Logger
  ) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoIngestedSegmentChangedListener.name)
    mongoDatabase.onConnect(INGESTED_SEGMENT_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedSegment, ChangeStreamDocument<MongoIngestedSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoIngestedSegment>) => this.onChange(change))
    this.logger.debug('Listening for Segment collection changes...')
  }

  private onChange(change: ChangeStreamDocument<MongoIngestedSegment>): void {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const ingestedSegment: IngestedSegment = this.mongoIngestedEntityConverter.convertToIngestedSegment(change.fullDocument)
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
        const ingestedSegment: IngestedSegment = this.mongoIngestedEntityConverter.convertToIngestedSegment(change.fullDocument)
        this.onUpdatedCallback(ingestedSegment)
        break
      }
      case MongoChangeEvent.UPDATE: {
        // These are all AlbaServer changes. We don't care to listen for those.
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
