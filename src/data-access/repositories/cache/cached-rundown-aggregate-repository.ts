import { RundownAggregateRepository } from '../interfaces/rundown-aggregate-repository'
import { Rundown } from '../../../model/entities/rundown'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Logger } from '../../../logger/logger'
import { Segment } from '../../../model/entities/segment'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'

export class CachedRundownAggregateRepository implements RundownAggregateRepository {
  private static instance: RundownAggregateRepository

  public static getInstance(rundownAggregateRepository: RundownAggregateRepository, logger: Logger): RundownAggregateRepository {
    if (!this.instance) {
      this.instance = new CachedRundownAggregateRepository(rundownAggregateRepository, logger)
    }
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

  public getRundownBySegmentId(segmentId: string): Promise<Rundown> {
    for (const rundown of this.cachedRundowns.values()) {
      const rundownHasSegment: boolean = rundown.getSegments().some(segment => segment.id === segmentId)
      if (rundownHasSegment) {
        return Promise.resolve(rundown)
      }
    }
    throw new NotFoundException(`No Rundown found with a Segment for Segment id: ${segmentId}`)
  }

  public async getBasicRundowns(): Promise<BasicRundown[]> {
    return await this.rundownAggregateRepository.getBasicRundowns()
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

  public deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void> {
    return this.rundownAggregateRepository.deleteUnsyncedSegmentsForRundown(rundownId)
  }

  public deleteAllUnsyncedSegments(): Promise<void> {
    return this.rundownAggregateRepository.deleteAllUnsyncedSegments()
  }

  public getPart(partId: string): Promise<Part> {
    return this.rundownAggregateRepository.getPart(partId)
  }

  public deletePart(partId: string): Promise<void> {
    return this.rundownAggregateRepository.deletePart(partId)
  }

  public deleteUnsyncedPartsForSegment(segmentId: string): Promise<void> {
    return this.rundownAggregateRepository.deleteUnsyncedPartsForSegment(segmentId)
  }

  public deleteAllUnsyncedParts(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public deleteAllUnplannedParts(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public getPiecesFromIds(pieceIds: string[]): Promise<Piece[]> {
    return this.rundownAggregateRepository.getPiecesFromIds(pieceIds)
  }

  public deleteUnsyncedInfinitePiecesNotOnAnyRundown(): Promise<void> {
    return this.rundownAggregateRepository.deleteUnsyncedInfinitePiecesNotOnAnyRundown()
  }

  public deleteAllUnsyncedPieces(): Promise<void> {
    return this.rundownAggregateRepository.deleteAllUnsyncedPieces()
  }

  public deleteAllUnplannedPieces(): Promise<void> {
    return this.rundownAggregateRepository.deleteAllUnplannedPieces()
  }
}
