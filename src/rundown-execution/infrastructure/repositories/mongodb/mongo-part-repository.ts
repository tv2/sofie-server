import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { Part } from '../../../domain/entities/part'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { AnyBulkWriteOperation, } from 'mongodb'
import { NotFoundException } from '../../../../cross-cutting-concerns/domain/exceptions/not-found-exception'
import { Piece } from '../../../domain/entities/piece'
import { MongoPieceRepository } from './mongo-piece-repository'
import { MongoPart, RundownExecutionMongoEntityConverter } from './rundown-execution-mongo-entity-converter'

const PART_COLLECTION_NAME: string = 'executedParts' // TODO: Once we control ingest rename to "parts".

export class MongoPartRepository extends BaseMongoRepository<MongoPart> {
  public constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoPieceRepository: MongoPieceRepository,
    private readonly rundownExecutionMongoEntityConverter: RundownExecutionMongoEntityConverter,
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
    const part: Part = this.rundownExecutionMongoEntityConverter.convertToPart(mongoPart)
    const pieces: Piece[] = await this.mongoPieceRepository.getPieces(part.id)
    part.setPieces(pieces)
    return part
  }

  public async getParts(segmentId: string, filters?: Partial<MongoPart>): Promise<Part[]> {
    this.assertDatabaseConnection(this.getParts.name)
    const mongoParts: MongoPart[] = await this.getCollection()
      .find<MongoPart>({ ...filters, segmentId: segmentId })
      .toArray()
    const parts: Part[] = this.rundownExecutionMongoEntityConverter.convertToParts(mongoParts)
    return Promise.all(
      parts.map(async (part) => {
        part.setPieces(await this.mongoPieceRepository.getPieces(part.id))
        return part
      })
    )
  }

  public buildSavePartQueries(parts: readonly Part[]): AnyBulkWriteOperation<MongoPart>[] {
    return parts.map(part => this.buildSavePartQuery(part))
  }

  private buildSavePartQuery(part: Part): AnyBulkWriteOperation<MongoPart> {
    const mongoPart: MongoPart = this.rundownExecutionMongoEntityConverter.convertToMongoPart(part)
    return {
      updateOne: {
        filter: { _id: mongoPart._id },
        update: { $set: mongoPart },
        upsert: true
      }
    }
  }

  public buildDeleteOrphanedPartsForRundownQuery(rundownId: string, parts: readonly Part[]): AnyBulkWriteOperation<MongoPart> {
    return {
      deleteMany: {
        filter: { rundownId, _id: { $nin: parts.map(part => part.id) } }
      }
    }
  }

  public buildDeletePartsForRundownQuery(rundownId: string): AnyBulkWriteOperation<MongoPart> {
    return {
      deleteMany: {
        filter: { rundownId },
      },
    }
  }
}
