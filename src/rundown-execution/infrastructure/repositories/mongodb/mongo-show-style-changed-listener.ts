import { DataChangedListener } from '../../../../data-access/repositories/interfaces/data-changed-listener'
import { ShowStyle } from '../../../domain/entities/show-style'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { ChangeStream, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { Logger } from '../../../../cross-cutting-concerns/application/logger'
import { UnsupportedOperationException } from '../../../domain/exceptions/unsupported-operation-exception'
import { MongoShowStyle } from './mongo-entity-converter'

const SHOW_STYLE_COLLECTION_NAME: string = 'showStyleBases'

export class MongoShowStyleChangedListener extends BaseMongoRepository<MongoShowStyle> implements DataChangedListener<ShowStyle> {

  private readonly logger: Logger

  private onUpdatedCallback: (showStyle: ShowStyle) => void

  constructor(mongoDatabase: MongoDatabase, logger: Logger) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoShowStyleChangedListener.name)
    mongoDatabase.onConnect(SHOW_STYLE_COLLECTION_NAME, () => this.listenForChanges())
  }

  protected getCollectionName(): string {
    return SHOW_STYLE_COLLECTION_NAME
  }

  protected listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<ShowStyle, ChangeStreamDocument<ShowStyle>>([], options)
    changeStream.on('change', () => this.onChange())
    this.logger.debug('Listening for ShowStyleConfiguration collection changes...')
  }

  private onChange(): void {
    // We just want to notify that a changed has been made
    this.onUpdatedCallback({} as ShowStyle)
  }

  public onCreated(_onCreatedCallback: (showStyle: ShowStyle) => void): void {
    throw new UnsupportedOperationException(
      `${MongoShowStyleChangedListener.prototype.onCreated.name} is not supported in ${MongoShowStyleChangedListener.name}`
    )
  }

  public onUpdated(onUpdatedCallback: (showStyle: ShowStyle) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(_onDeletedCallback: (id: string) => void): void {
    throw new UnsupportedOperationException(
      `${MongoShowStyleChangedListener.prototype.onDeleted.name} is not supported in ${MongoShowStyleChangedListener.name}`
    )
  }
}
