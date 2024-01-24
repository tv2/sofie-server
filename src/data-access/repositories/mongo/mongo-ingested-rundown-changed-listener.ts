import { BaseMongoRepository } from './base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamOptions,
  ChangeStreamReplaceDocument
} from 'mongodb'
import { MongoIngestedRundown, MongoIngestedSegment } from './mongo-ingested-entity-converter'
import { MongoDatabase } from './mongo-database'
import { MongoChangeEvent } from './mongo-enums'
import { IngestedRundownRepository } from '../interfaces/ingested-rundown-repository'
import { IngestedRundown } from '../../../model/entities/ingested-rundown'
import { Logger } from '../../../logger/logger'

const INGESTED_RUNDOWN_COLLECTION_NAME: string = 'rundowns' // TODO: Once we control ingest changed this to "ingestedRundowns"

export class MongoIngestedRundownChangedListener extends BaseMongoRepository implements DataChangedListener<IngestedRundown> {

  private readonly logger: Logger
  private onCreatedCallback: (rundown: IngestedRundown) => void
  private onUpdatedCallback: (rundown: IngestedRundown) => void
  private onDeletedCallback: (rundownId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly ingestedRundownRepository: IngestedRundownRepository,
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
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedSegment, ChangeStreamDocument<MongoIngestedSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoIngestedRundown>) => void this.onChange(change))
    this.logger.debug('Listening for Rundown collection changes...')
  }

  private async onChange(change: ChangeStreamDocument<MongoIngestedRundown>): Promise<void> {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoIngestedRundown> = change as ChangeStreamInsertDocument<MongoIngestedRundown>
        const rundownId: string = insertChange.fullDocument._id
        const ingestedRundown: IngestedRundown = await this.ingestedRundownRepository.getIngestedRundown(rundownId)
        this.onCreatedCallback(ingestedRundown)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const replaceChange: ChangeStreamReplaceDocument<MongoIngestedRundown> = change as ChangeStreamReplaceDocument<MongoIngestedRundown>
        const rundownId: string = replaceChange.documentKey._id
        const ingestedRundown: IngestedRundown = await this.ingestedRundownRepository.getIngestedRundown(rundownId)
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
