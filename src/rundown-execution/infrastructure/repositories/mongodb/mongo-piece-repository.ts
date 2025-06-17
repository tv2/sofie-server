import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { Piece } from '../../../domain/entities/piece'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { AnyBulkWriteOperation, } from 'mongodb'
import { MongoEntityConverter, MongoPiece } from './mongo-entity-converter'
import { NotFoundException } from '../../../domain/exceptions/not-found-exception'

const PIECE_COLLECTION_NAME: string = 'executedPieces' // TODO: Once we control ingest rename to "pieces".

export class MongoPieceRepository extends BaseMongoRepository<MongoPiece> {
  constructor(mongoDatabase: MongoDatabase, private readonly mongoEntityConverter: MongoEntityConverter) {
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
    return this.mongoEntityConverter.convertToPiece(mongoPiece)
  }

  public getPieces(partId: string): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPieces.name)
    return this.getCollection()
      .find<MongoPiece>({ partId })
      .map(mongoPiece => this.mongoEntityConverter.convertToPiece(mongoPiece))
      .toArray()
  }

  public getPiecesFromIds(pieceIds: string[] = []): Promise<Piece[]> {
    this.assertDatabaseConnection(this.getPiecesFromIds.name)
    return this.getCollection()
      .find<MongoPiece>({ _id: { $in: pieceIds } })
      .map(mongoPiece => this.mongoEntityConverter.convertToPiece(mongoPiece))
      .toArray()
  }

  public buildSavePieceQueries(pieces: readonly Piece[]): AnyBulkWriteOperation<MongoPiece>[] {
    return pieces.map(piece => this.buildSavePieceQuery(piece))
  }

  private buildSavePieceQuery(piece: Piece): AnyBulkWriteOperation<MongoPiece> {
    const mongoPiece: MongoPiece = this.mongoEntityConverter.convertToMongoPiece(piece)
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
