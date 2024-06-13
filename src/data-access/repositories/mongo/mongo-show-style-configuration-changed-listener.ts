import { DataChangedListener } from '../interfaces/data-changed-listener'
import { ShowStyle } from '../../../model/entities/show-style'
import { MongoDatabase } from './mongo-database'
import { BaseMongoRepository } from './base-mongo-repository'
import { ChangeStream, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { MongoIngestedRundown } from './mongo-ingested-entity-converter'
import { Logger } from '../../../logger/logger'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'

const SHOW_STYLE_CONFIGURATION_COLLECTION_NAME: string = 'showStyleBases'

export class MongoShowStyleConfigurationChangedListener extends BaseMongoRepository implements DataChangedListener<ShowStyle> {

  private readonly logger: Logger

  private onUpdatedCallback: (showStyle: ShowStyle) => void

  constructor(mongoDatabase: MongoDatabase, logger: Logger) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoShowStyleConfigurationChangedListener.name)
    mongoDatabase.onConnect(SHOW_STYLE_CONFIGURATION_COLLECTION_NAME, () => this.listenForChanges())
  }

  protected getCollectionName(): string {
    return SHOW_STYLE_CONFIGURATION_COLLECTION_NAME
  }

  protected listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedRundown, ChangeStreamDocument<ShowStyle>>([], options)
    changeStream.on('change', () => this.onChange())
    this.logger.debug('Listening for ShowStyleConfiguration collection changes...')
  }

  private onChange(): void {
    // We just want to notify that a changed has been made
    this.onUpdatedCallback({} as ShowStyle)
  }

  public onCreated(_onCreatedCallback: (showStyle: ShowStyle) => void): void {
    throw new UnsupportedOperationException(
      `${MongoShowStyleConfigurationChangedListener.prototype.onCreated.name} is not supported in ${MongoShowStyleConfigurationChangedListener.name}`
    )
  }

  public onUpdated(onUpdatedCallback: (showStyle: ShowStyle) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(_onDeletedCallback: (id: string) => void): void {
    throw new UnsupportedOperationException(
      `${MongoShowStyleConfigurationChangedListener.prototype.onDeleted.name} is not supported in ${MongoShowStyleConfigurationChangedListener.name}`
    )
  }
}
