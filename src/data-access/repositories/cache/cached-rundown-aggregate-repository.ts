import { RundownAggregateRepository } from '../interfaces/rundown-aggregate-repository'
import { Rundown } from '../../../model/entities/rundown'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { Logger } from '../../../logger/logger'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'

export class CachedRundownAggregateRepository implements RundownAggregateRepository {

  private static instance?: CachedRundownAggregateRepository

  public static getInstance(rundownAggregateRepository: RundownAggregateRepository, logger: Logger): CachedRundownAggregateRepository {
    this.instance ??= new CachedRundownAggregateRepository(rundownAggregateRepository, logger)
    return this.instance
  }

  private readonly logger: Logger
  private readonly cachedRundowns: Map<string, Rundown> = new Map()

  constructor(private readonly rundownAggregateRepository: RundownAggregateRepository, logger: Logger) {
    this.logger = logger.tag(CachedRundownAggregateRepository.name)
  }

  public async getRundown(rundownId: string): Promise<Rundown> {
    if (!this.cachedRundowns.has(rundownId)) {
      this.logger.info(`Rundown with id: "${rundownId}" not found in cache. Loading rundown from database...`)
      const rundown: Rundown = await this.rundownAggregateRepository.getRundown(rundownId)
      this.cachedRundowns.set(rundownId, rundown)
    }
    return this.cachedRundowns.get(rundownId) as Rundown
  }

  public getBasicRundowns(): Promise<BasicRundown[]> {
    return this.rundownAggregateRepository.getBasicRundowns()
  }

  public async saveRundown(rundown: Rundown): Promise<void> {
    await this.rundownAggregateRepository.saveRundown(rundown)
    this.cachedRundowns.set(rundown.id, rundown)
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    await this.rundownAggregateRepository.deleteRundown(rundownId)
    this.cachedRundowns.delete(rundownId)
  }

  public getSegment(segmentId: string): Promise<Segment> {
    return this.rundownAggregateRepository.getSegment(segmentId)
  }

  public getPart(partId: string): Promise<Part> {
    return this.rundownAggregateRepository.getPart(partId)
  }

  public getPiece(pieceId: string): Promise<Piece> {
    return this.rundownAggregateRepository.getPiece(pieceId)
  }
}
