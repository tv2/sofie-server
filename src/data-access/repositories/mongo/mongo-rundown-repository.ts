import { Rundown } from '../../../model/entities/rundown'
import { RundownRepository } from '../interfaces/rundown-repository'
import { MongoEntityConverter, MongoRundown } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { SegmentRepository } from '../interfaces/segment-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { DeleteResult } from 'mongodb'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { RundownBaselineRepository } from '../interfaces/rundown-baseline-repository'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { UnsupportedOperation } from '../../../model/exceptions/unsupported-operation'
import { Segment } from '../../../model/entities/segment'

const RUNDOWN_COLLECTION_NAME: string = 'rundowns'

export class MongoRundownRepository extends BaseMongoRepository implements RundownRepository {

  constructor(
    mongoDatabase: MongoDatabase,
    mongoEntityConverter: MongoEntityConverter,
    private readonly rundownBaselineRepository: RundownBaselineRepository,
    private readonly segmentRepository: SegmentRepository
  ) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return RUNDOWN_COLLECTION_NAME
  }

  public async getBasicRundowns(): Promise<BasicRundown[]> {
    this.assertDatabaseConnection(this.getBasicRundowns.name)
    const basicRundowns: MongoRundown[] = (await this.getCollection()
      .find({})
      .project({ _id: 1, name: 1, modified: 1, isActive: 1 })
      .toArray()) as unknown as MongoRundown[]
    return this.mongoEntityConverter.convertToBasicRundowns(basicRundowns)
  }

  public async getRundown(rundownId: string): Promise<Rundown> {
    this.assertDatabaseConnection(this.getRundown.name)
    const mongoRundown: MongoRundown | null = await this.getCollection().findOne<MongoRundown>({
      _id: rundownId,
    })
    if (!mongoRundown) {
      throw new NotFoundException(`No Rundown found for rundownId: ${rundownId}`)
    }

    const baselineTimelineObjects: TimelineObject[] = await this.rundownBaselineRepository.getRundownBaseline(
      rundownId
    )
    const segments: Segment[] = await this.segmentRepository.getSegments(rundownId)
    return this.mongoEntityConverter.convertRundown(mongoRundown, segments, baselineTimelineObjects)
  }

  public getRundownBySegmentId(segmentId: string): Promise<Rundown> {
    throw new UnsupportedOperation(`${MongoRundownRepository.name} does not support getting a Rundown from a Segment id. Trying to find Rundown with Segment id: ${segmentId}`)
  }

  public getRundownByPartId(partId: string): Promise<Rundown> {
    throw new UnsupportedOperation(`${MongoRundownRepository.name} does not support getting a Rundown from a Part id. Trying to find Rundown with Part id: ${partId}`)
  }

  public async saveRundown(rundown: Rundown): Promise<void> {
    const mongoRundown: MongoRundown = this.mongoEntityConverter.convertToMongoRundown(rundown)
    await this.getCollection().updateOne({ _id: rundown.id }, { $set: mongoRundown })
    await Promise.all(rundown.getSegments().map(segment => this.segmentRepository.saveSegment(segment)))
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteRundown.name)
    const doesRundownExist: boolean = await this.doesRundownExist(rundownId)
    if (!doesRundownExist) {
      return
    }

    await this.segmentRepository.deleteSegmentsForRundown(rundownId)
    const rundownDeletionResult: DeleteResult = await this.getCollection().deleteOne({
      _id: rundownId,
    })
    if (!rundownDeletionResult.acknowledged) {
      throw new DeletionFailedException(`Deletion of rundown was not acknowledged, for rundownId: ${rundownId}`)
    }
  }

  private async doesRundownExist(rundownId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: rundownId })) === 1
  }
}
