import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { Piece } from '../../../domain/entities/piece'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { AnyBulkWriteOperation, } from 'mongodb'
import { NotFoundException } from '../../../../cross-cutting-concerns/domain/exceptions/not-found-exception'
import { MongoPiece, RundownExecutionMongoEntityConverter } from './rundown-execution-mongo-entity-converter'

const PIECE_COLLECTION_NAME: string = 'executedPieces' // TODO: Once we control ingest rename to "pieces".

export class MongoPieceRepository extends BaseMongoRepository<MongoPiece> {
  public constructor(
    mongoDatabase: MongoDatabase,
    private readonly rundownExecutionMongoEntityConverter: RundownExecutionMongoEntityConverter
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return PIECE_COLLECTION_NAME
  }

  public async getPiece(pieceId: string): Promise<Piece> {
    this.assertDatabaseConnection(this.getPiece.name)
    const mongoPiece: MongoPiece | null = await this.getCollection().findOne<MongoPiece>({
      _id: pieceId
    })
    if (!mongoPiece) {
      throw new NotFoundException(`No piece found with id '${pieceId}'.`)
    }
    return this.rundownExecutionMongoEntityConverter.convertToPiece(mongoPiece)
  }

  public getPieces(partId: string): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPieces.name)
    return this.getCollection()
      .find<MongoPiece>({ partId })
      .map(mongoPiece => this.rundownExecutionMongoEntityConverter.convertToPiece(mongoPiece))
      .toArray()
  }

  public getPiecesFromIds(pieceIds: string[] = []): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPiecesFromIds.name)
    return this.getCollection()
      .find<MongoPiece>({ _id: { $in: pieceIds } })
      .map(mongoPiece => this.rundownExecutionMongoEntityConverter.convertToPiece(mongoPiece))
      .toArray()
  }

  public buildSavePieceQueries(pieces: readonly Piece[]): AnyBulkWriteOperation<MongoPiece>[] {
    return pieces.map(piece => this.buildSavePieceQuery(piece))
  }

  private buildSavePieceQuery(piece: Piece): AnyBulkWriteOperation<MongoPiece> {
    const mongoPiece: MongoPiece = this.rundownExecutionMongoEntityConverter.convertToMongoPiece(piece)
    return {
      updateOne: {
        filter: { _id: mongoPiece._id },
        update: { $set: mongoPiece },
        upsert: true,
      }
    }
  }

  public buildDeleteOrphanedPiecesForRundownQuery(rundownId: string, pieces: readonly Piece[]): AnyBulkWriteOperation<MongoPiece> {
    return {
      deleteMany: {
        filter: { rundownId, _id: { $nin: pieces.map(piece => piece.id) } }
      }
    }
  }

  public buildDeletePiecesForRundownQuery(rundownId: string): AnyBulkWriteOperation<MongoPiece> {
    return {
      deleteMany: {
        filter: { rundownId },
      },
    }
  }
}
