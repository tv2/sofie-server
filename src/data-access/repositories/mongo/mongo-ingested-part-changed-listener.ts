import { BaseMongoRepository } from '../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDatabase } from '../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import {
  MongoIngestedEntityConverter,
  MongoIngestedPart,
  MongoIngestedSegment
} from './mongo-ingested-entity-converter'
import { ChangeStream, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { IngestedPart } from '../../../rundown-execution/domain/entities/ingested-part'
import { Logger } from '../../../cross-cutting-concerns/application/logger'

const INGESTED_PART_COLLECTION_NAME: string = 'parts' // TODO: Once we control ingest changed this to "ingestedParts"

export class MongoIngestedPartChangedListener extends BaseMongoRepository<MongoIngestedPart> implements DataChangedListener<IngestedPart> {

  private readonly logger: Logger
  private onCreatedCallback: (part: IngestedPart) => void
  private onUpdatedCallback: (part: IngestedPart) => void
  private onDeletedCallback: (partId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoIngestedEntityConverter: MongoIngestedEntityConverter,
    logger: Logger
  ) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoIngestedPartChangedListener.name)
    mongoDatabase.onConnect(INGESTED_PART_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedSegment, ChangeStreamDocument<MongoIngestedSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoIngestedPart>) => this.onChange(change))
    this.logger.debug('Listening for Part collection changes...')
  }

  private onChange(change: ChangeStreamDocument<MongoIngestedPart>): void {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const ingestedPart: IngestedPart = this.mongoIngestedEntityConverter.convertToIngestedPart(change.fullDocument)
        this.onCreatedCallback(ingestedPart)
        break
      }
      case MongoChangeEvent.DELETE: {
        const partId: string = change.documentKey._id
        this.onDeletedCallback(partId)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const ingestedPart: IngestedPart = this.mongoIngestedEntityConverter.convertToIngestedPart(change.fullDocument)
        this.onUpdatedCallback(ingestedPart)
        break
      }
      case MongoChangeEvent.UPDATE: {
        // These are all AlbaServer changes. We don't care to listen for those.
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
