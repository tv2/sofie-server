import { BaseMongoRepository } from './base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import { ShowStyleVariant } from '../../../model/entities/show-style-variant'
import { Logger } from '../../../logger/logger'
import { MongoDatabase } from './mongo-database'
import { ChangeStream, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'

const SHOW_STYLE_VARIANT_CONFIGURATION_COLLECTION_NAME: string = 'showStyleVariants'

export class MongoShowStyleVariantConfigurationListener extends BaseMongoRepository implements DataChangedListener<ShowStyleVariant> {

  private readonly logger: Logger

  private onUpdatedCallback: (showStyleVariant: ShowStyleVariant) => void

  constructor(mongoDatabase: MongoDatabase, logger: Logger) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoShowStyleVariantConfigurationListener.name)
    mongoDatabase.onConnect(SHOW_STYLE_VARIANT_CONFIGURATION_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<ShowStyleVariant, ChangeStreamDocument<ShowStyleVariant>>([], options)
    changeStream.on('change', () => this.onChange())
    this.logger.debug('Listening for ShowStyleVariantConfiguration collection changes...')
  }

  private onChange(): void {
    // We just want to notify that a change has been made
    this.onUpdatedCallback({} as ShowStyleVariant)
  }

  protected getCollectionName(): string {
    return SHOW_STYLE_VARIANT_CONFIGURATION_COLLECTION_NAME
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onCreated(_onCreatedCallback: (data: ShowStyleVariant) => void): void {
    throw new UnsupportedOperationException(`${MongoShowStyleVariantConfigurationListener.prototype.onCreated.name} is not supported`)
  }

  public onUpdated(onUpdatedCallback: (data: ShowStyleVariant) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onDeleted(_onDeletedCallback: (id: string) => void): void {
    throw new UnsupportedOperationException(`${MongoShowStyleVariantConfigurationListener.prototype.onDeleted.name} is not supported`)
  }
}
