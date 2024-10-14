import { BaseMongoRepository } from './base-mongo-repository'
import { Part } from '../../../model/entities/part'
import { MongoDatabase } from './mongo-database'
import {
  AnyBulkWriteOperation,
  ClientSession,
} from 'mongodb'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Piece } from '../../../model/entities/piece'
import { MongoEntityConverter, MongoPart } from './mongo-entity-converter'
import { MongoPieceRepository } from './mongo-piece-repository'

export const PART_COLLECTION_NAME: string = 'executedParts' // TODO: Once we control ingest rename to "parts".

export class MongoPartRepository extends BaseMongoRepository<MongoPart> {
  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoPieceRepository: MongoPieceRepository,
    private readonly mongoEntityConverter: MongoEntityConverter,
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
    const pieces: Piece[] = await this.mongoPieceRepository.getPieces(part.id)
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
        part.setPieces(await this.mongoPieceRepository.getPieces(part.id))
        return part
      })
    )
  }

  public getPartIdsForRundown(rundownId: string): Promise<readonly string[]> {
    return this.getCollection().find({ rundownId }).map(document => document._id).toArray()
  }

  public getPartIdsForSegment(segmentId: string, mongoPart: Partial<MongoPart> = {}): Promise<readonly string[]> {
    return this.getCollection().find({ ...mongoPart, segmentId }).map(document => document._id).toArray()
  }

  public buildSavePartQueries(parts: readonly Part[]): AnyBulkWriteOperation<MongoPart>[] {
    return parts.map(part => this.buildSavePartQuery(part))
  }

  private buildSavePartQuery(part: Part): AnyBulkWriteOperation<MongoPart> {
    const mongoPart: MongoPart = this.mongoEntityConverter.convertToMongoPart(part)
    return {
      updateOne: {
        filter: { _id: mongoPart._id },
        update: { $set: mongoPart },
        upsert: true
      }
    }
  }

  public async executeQueries(queries: readonly AnyBulkWriteOperation<MongoPart>[], session: ClientSession): Promise<void> {
    if (queries.length === 0) {
      return
    }
    await this.getCollection().bulkWrite([...queries], { session, ignoreUndefined: true })
  }

  public buildDeletePartsForRundownQuery(rundownId: string): AnyBulkWriteOperation<MongoPart> {
    return {
      deleteMany: {
        filter: { rundownId },
      },
    }
  }

  public buildDeletePartsForSegmentQuery(segmentId: string, mongoPart: Partial<MongoPart> = {}): AnyBulkWriteOperation<MongoPart> {
    return {
      deleteMany: {
        filter: { ...mongoPart, segmentId },
      },
    }
  }

  public buildDeletePartQuery(partId: string): AnyBulkWriteOperation<MongoPart> {
    return {
      deleteOne: {
        filter: { _id: partId }
      }
    }
  }

  public buildDeleteUnsyncedPartsForSegmentQuery(segmentId: string): AnyBulkWriteOperation<MongoPart> {
    return this.buildDeleteUnsyncedPartsQuery({ segmentId })
  }

  /*
  * NOTE: This will delete ALL unsynced Parts in the database. Should only be used on deactivate or activate Rundown.
  * NOTE: This will NOT delete the associated Pieces.
  */
  public buildDeleteUnsyncedPartsQuery(mongoPart: Partial<MongoPart> = {}): AnyBulkWriteOperation<MongoPart> {
    return {
      deleteMany: {
        filter: { ...mongoPart, isUnsynced: true },
      }
    }
  }

  /*
  * NOTE: This will delete ALL unplanned Parts in the database. Should only be used on deactivate or activate Rundown.
  * NOTE: This will NOT delete the associated Pieces.
  */
  public buildDeleteAllUnplannedPartsQuery(): AnyBulkWriteOperation<MongoPart> {
    return {
      deleteMany: {
        filter: { isPlanned: false },
      }
    }
  }
}
