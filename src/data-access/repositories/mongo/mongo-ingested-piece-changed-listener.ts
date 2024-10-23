import { BaseMongoRepository } from './base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDatabase } from './mongo-database'
import {
  MongoIngestedEntityConverter,
  MongoIngestedPiece,
  MongoIngestedSegment
} from './mongo-ingested-entity-converter'
import { ChangeStream, ChangeStreamDocument, ChangeStreamOptions } from 'mongodb'
import { MongoChangeEvent } from './mongo-enums'
import { IngestedPiece } from '../../../model/entities/ingested-piece'
import { Logger } from '../../../logger/logger'

const INGESTED_PIECE_COLLECTION_NAME: string = 'pieces' // TODO: Once we control ingest changed this to "ingestedPieces"

export class MongoIngestedPieceChangedListener extends BaseMongoRepository<MongoIngestedPiece> implements DataChangedListener<IngestedPiece> {

  private readonly logger: Logger
  private onCreatedCallback: (piece: IngestedPiece) => void
  private onUpdatedCallback: (piece: IngestedPiece) => void
  private onDeletedCallback: (pieceId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoIngestedEntityConverter: MongoIngestedEntityConverter,
    logger: Logger
  ) {
    super(mongoDatabase)
    this.logger = logger.tag(MongoIngestedPieceChangedListener.name)
    mongoDatabase.onConnect(INGESTED_PIECE_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoIngestedSegment, ChangeStreamDocument<MongoIngestedSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoIngestedPiece>) => this.onChange(change))
    this.logger.debug('Listening for Piece collection changes...')
  }

  private onChange(change: ChangeStreamDocument<MongoIngestedPiece>): void {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const ingestedPiece: IngestedPiece = this.mongoIngestedEntityConverter.convertToIngestedPiece(change.fullDocument)
        this.onCreatedCallback(ingestedPiece)
        break
      }
      case MongoChangeEvent.DELETE: {
        const pieceId: string = change.documentKey._id
        this.onDeletedCallback(pieceId)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const ingestedPiece: IngestedPiece = this.mongoIngestedEntityConverter.convertToIngestedPiece(change.fullDocument)
        this.onUpdatedCallback(ingestedPiece)
        break
      }
      case MongoChangeEvent.UPDATE: {
        // These are all SofieServer changes. We don't care to listen for those.
        break
      }
    }
  }

  protected getCollectionName(): string {
    return INGESTED_PIECE_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (piece: IngestedPiece) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onUpdated(onUpdatedCallback: (piece: IngestedPiece) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }

  public onDeleted(onDeletedCallback: (id: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
