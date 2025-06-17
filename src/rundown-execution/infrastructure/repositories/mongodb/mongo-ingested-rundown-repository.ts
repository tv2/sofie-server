import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import {
  MongoIngestedEntityConverter,
  MongoIngestedRundown,
} from './mongo-ingested-entity-converter'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { IngestedRundownRepository } from '../../../../sofie-ingest/domain/repositories/ingested-rundown-repository'
import { NotFoundException } from '../../../domain/exceptions/not-found-exception'
import { RundownBaselineRepository } from '../../../domain/repositories/rundown-baseline-repository'
import { IngestedSegmentRepository } from '../../../../sofie-ingest/domain/repositories/ingested-segment-repository'
import { IngestedRundown } from '../../../domain/entities/ingested-rundown'
import { IngestedSegment } from '../../../domain/entities/ingested-segment'
import { IngestedPart } from '../../../domain/entities/ingested-part'
import { IngestedPiece } from '../../../domain/entities/ingested-piece'
import { IngestedPieceRepository } from '../../../../sofie-ingest/domain/repositories/ingested-piece-repository'
import { IngestedPartRepository } from '../../../../sofie-ingest/domain/repositories/ingested-part-repository'

const INGESTED_RUNDOWN_COLLECTION_NAME: string = 'rundowns' // TODO: Once we control ingest this should be renamed to "ingestedRundowns".

export class MongoIngestedRundownRepository extends BaseMongoRepository<MongoIngestedRundown> implements IngestedRundownRepository {
  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoIngestedEntityConverter: MongoIngestedEntityConverter,
    private readonly rundownBaselineRepository: RundownBaselineRepository,
    private readonly ingestedSegmentRepository: IngestedSegmentRepository,
    private readonly ingestedPartRepository: IngestedPartRepository,
    private readonly ingestedPieceRepository: IngestedPieceRepository,
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return INGESTED_RUNDOWN_COLLECTION_NAME
  }

  public getIngestedRundownIds(): Promise<readonly string[]> {
    this.assertDatabaseConnection(this.getIngestedRundownIds.name)
    return this.getCollection().find({}, { projection: { _id: 1 } }).map(document => document._id).toArray()
  }

  public async getIngestedRundown(rundownId: string): Promise<IngestedRundown> {
    this.assertDatabaseConnection(this.getIngestedRundown.name)
    const mongoRundown: MongoIngestedRundown | null = await this.getCollection().findOne<MongoIngestedRundown>({
      _id: rundownId,
    })
    if (!mongoRundown) {
      throw new NotFoundException(`No Rundown found for ingestRundownId: ${rundownId}`)
    }

    const ingestedPieces: IngestedPiece[] = await this.ingestedPieceRepository.getIngestedPiecesForRundown(rundownId)
    const ingestedParts: IngestedPart[] = await this.ingestedPartRepository.getIngestedPartsForRundown(rundownId, ingestedPieces)
    const ingestedSegments: IngestedSegment[] = await this.ingestedSegmentRepository.getIngestedSegmentsForRundown(rundownId, ingestedParts)

    return {
      ...this.mongoIngestedEntityConverter.convertToIngestedRundown(mongoRundown),
      ingestedSegments,
      baselineTimelineObjects: await this.rundownBaselineRepository.getRundownBaseline(rundownId)
    }
  }

  public async deleteIngestedRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteIngestedRundown.name)
    await this.ingestedSegmentRepository.deleteIngestedSegmentsForRundown(rundownId)
    await this.getCollection().deleteOne({ _id: rundownId })
  }
}
