import { BaseMongoRepository } from '../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamOptions,
} from 'mongodb'
import { MongoIngestedEntityConverter, MongoIngestedRundown } from '../../../rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-entity-converter'
import { MongoDatabase } from '../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { MongoChangeEvent } from './mongo-enums'
import { IngestedRundown } from '../../../rundown-execution/domain/entities/ingested-rundown'
import { Logger } from '../../../cross-cutting-concerns/application/logger'

const INGESTED_RUNDOWN_COLLECTION_NAME: string = 'rundowns' // TODO: Once we control ingest changed this to "ingestedRundowns"

export class MongoIngestedRundownChangedListener extends BaseMongoRepository<MongoIngestedRundown> implements DataChangedListener<IngestedRundown> {

  private readonly logger: Logger
  private onCreatedCallback: (rundown: IngestedRundown) => void
  private onUpdatedCallback: (rundown: IngestedRundown) => void
  private onDeletedCallback: (rundownId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoIngestedEntityConverter: MongoIngestedEntityConverter,
    logger: Logger
  ) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoIngestedRundownChangedListener.name)
    mongoDatabase.onConnect(INGESTED_RUNDOWN_COLLECTION_NAME, () => this.listenForChanges())
  }

  protected getCollectionName(): string {
    return INGESTED_RUNDOWN_COLLECTION_NAME
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedRundown, ChangeStreamDocument<MongoIngestedRundown>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoIngestedRundown>) => this.onChange(change))
    this.logger.debug('Listening for Rundown collection changes...')
  }

  private onChange(change: ChangeStreamDocument<MongoIngestedRundown>): void {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const ingestedRundown: IngestedRundown = this.mongoIngestedEntityConverter.convertToIngestedRundown(change.fullDocument)
        this.onCreatedCallback(ingestedRundown)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const ingestedRundown: IngestedRundown = this.mongoIngestedEntityConverter.convertToIngestedRundown(change.fullDocument)
        this.onUpdatedCallback(ingestedRundown)
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument<MongoIngestedRundown> = change as ChangeStreamDeleteDocument<MongoIngestedRundown>
        const rundownId: string = deleteChange.documentKey._id
        this.onDeletedCallback(rundownId)
        break
      }
    }
  }

  public onCreated(onCreatedCallback: (data: IngestedRundown) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onDeleted(onDeletedCallback: (id: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }

  public onUpdated(onUpdatedCallback: (data: IngestedRundown) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }
}
