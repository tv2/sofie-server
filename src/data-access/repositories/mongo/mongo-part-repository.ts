import { BaseMongoRepository } from './base-mongo-repository'
import { PartRepository } from '../interfaces/part-repository'
import { Part } from '../../../model/entities/part'
import { MongoDatabase } from './mongo-database'
import { PieceRepository } from '../interfaces/piece-repository'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { DeleteResult } from 'mongodb'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Piece } from '../../../model/entities/piece'
import { MongoEntityConverter, MongoPart } from './mongo-entity-converter'

export const PART_COLLECTION_NAME: string = 'executedParts' // TODO: Once we control ingest rename to "parts".

export class MongoPartRepository extends BaseMongoRepository implements PartRepository {
  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoEntityConverter: MongoEntityConverter,
    private readonly pieceRepository: PieceRepository
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return PART_COLLECTION_NAME
  }

  public async getPart(partId: string): Promise<Part> {
    this.assertDatabaseConnection(this.getPart.name)
    const mongoPart: MongoPart | null = await this.getCollection().findOne<MongoPart>({
      _id: partId
    })
    if (!mongoPart) {
      throw new NotFoundException(`No Part found for PartId ${partId}`)
    }
    const part: Part = this.mongoEntityConverter.convertToPart(mongoPart)
    const pieces: Piece[] = await this.pieceRepository.getPieces(part.id)
    part.setPieces(pieces)
    return part
  }

  public async getParts(segmentId: string, filters?: Partial<MongoPart>): Promise<Part[]> {
    this.assertDatabaseConnection(this.getParts.name)
    const mongoParts: MongoPart[] = (await this.getCollection()
      .find<MongoPart>({ ...filters, segmentId: segmentId })
      .toArray())
    const parts: Part[] = this.mongoEntityConverter.convertToParts(mongoParts)
    return Promise.all(
      parts.map(async (part) => {
        part.setPieces(await this.pieceRepository.getPieces(part.id))
        return part
      })
    )
  }

  public async savePart(part: Part): Promise<void> {
    const mongoPart: MongoPart = this.mongoEntityConverter.convertToMongoPart(part)
    await this.getCollection().updateOne(
      { _id: mongoPart._id },
      { $set: mongoPart },
      { upsert: true, ignoreUndefined: true }
    )
    await Promise.all(part.getPieces().map(piece => this.pieceRepository.savePiece(piece)))
  }

  public async delete(partId: string): Promise<void> {
    this.assertDatabaseConnection(this.delete.name)
    await this.pieceRepository.deletePiecesForPart(partId)
    await this.getCollection().deleteMany({ _id: partId })
  }

  public async deletePartsForSegment(segmentId: string): Promise<void> {
    this.assertDatabaseConnection(this.deletePartsForSegment.name)
    const parts: Part[] = await this.getParts(segmentId)

    await Promise.all(parts.map(async (part) => this.pieceRepository.deletePiecesForPart(part.id)))

    const partsDeletedResult: DeleteResult = await this.getCollection().deleteMany({ segmentId: segmentId })

    if (!partsDeletedResult.acknowledged) {
      throw new DeletionFailedException(`Deletion of parts was not acknowledged, for segmentId: ${segmentId}`)
    }
  }

  public async deleteUnsyncedPartsForSegment(segmentId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteUnsyncedPartsForSegment.name)
    const unsyncedFilter: Partial<MongoPart> = { isUnsynced: true }
    const unsyncedParts: Part[] = await this.getParts(segmentId, unsyncedFilter)

    await Promise.all(unsyncedParts.map(async (part) => this.pieceRepository.deletePiecesForPart(part.id)))

    const partsDeletedResult: DeleteResult = await this.getCollection().deleteMany({ ...unsyncedFilter, segmentId: segmentId })

    if (!partsDeletedResult.acknowledged) {
      throw new DeletionFailedException(`Deletion of parts was not acknowledged, for segmentId: ${segmentId}`)
    }
  }

  /*
  * NOTE: This will delete ALL unsynced Parts in the database. Should only be used on deactivate or activate Rundown.
  * NOTE: This will NOT delete the associated Pieces.
  */
  public async deleteAllUnsyncedParts(): Promise<void> {
    this.assertDatabaseConnection(this.deleteAllUnsyncedParts.name)
    await this.getCollection().deleteMany({
      isUnsynced: true
    })
  }

  /*
  * NOTE: This will delete ALL unplanned Parts in the database. Should only be used on deactivate or activate Rundown.
  * NOTE: This will NOT delete the associated Pieces.
  */
  public async deleteAllUnplannedParts(): Promise<void> {
    this.assertDatabaseConnection(this.deleteAllUnplannedParts.name)
    await this.getCollection().deleteMany({
      isPlanned: false
    })
  }
}
