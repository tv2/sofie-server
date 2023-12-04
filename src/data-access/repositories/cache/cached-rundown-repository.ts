import { RundownRepository } from '../interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Logger } from '../../../logger'

export class CachedRundownRepository implements RundownRepository {
  private static instance: RundownRepository

  public static getInstance(rundownRepository: RundownRepository, logger: Logger): RundownRepository {
    if (!this.instance) {
      this.instance = new CachedRundownRepository(rundownRepository, logger)
    }
    return this.instance
  }

  private readonly logger: Logger
  private readonly cachedRundowns: Map<string, Rundown> = new Map()

  constructor(private readonly rundownRepository: RundownRepository, logger: Logger) {
    this.logger = logger.tag(CachedRundownRepository.name)
  }

  public async getRundown(rundownId: string): Promise<Rundown> {
    if (!this.cachedRundowns.has(rundownId)) {
      this.logger.info(`Rundown with id: "${rundownId}" not found in cache. Loading rundown from database...`)
      const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
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
    return await this.rundownRepository.getBasicRundowns()
  }

  public async saveRundown(rundown: Rundown): Promise<void> {
    this.cachedRundowns.set(rundown.id, rundown)
    await this.rundownRepository.saveRundown(rundown)
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    this.cachedRundowns.delete(rundownId)
    await this.rundownRepository.deleteRundown(rundownId)
  }
}
