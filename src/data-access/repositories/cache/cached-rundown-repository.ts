import { RundownRepository } from '../interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'
import { BasicRundown } from '../../../model/entities/basic-rundown'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

export class CachedRundownRepository implements RundownRepository {
  private static instance: RundownRepository

  public static getInstance(rundownRepository: RundownRepository): RundownRepository {
    if (!this.instance) {
      this.instance = new CachedRundownRepository(rundownRepository)
    }
    return this.instance
  }

  private readonly cachedRundowns: Map<string, Rundown> = new Map()

  constructor(private readonly rundownRepository: RundownRepository) {}

  public async getRundown(rundownId: string): Promise<Rundown> {
    if (!this.cachedRundowns.has(rundownId)) {
      console.log(`### Rundown with id: "${rundownId}" not found in cache. Loading rundown from database...`)
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

  public getRundownByPartId(partId: string): Promise<Rundown> {
    for (const rundown of this.cachedRundowns.values()) {
      const rundownHasPart: boolean = rundown.getSegments().some(segment => segment.getParts().some(part => part.id === partId))
      if (rundownHasPart) {
        return Promise.resolve(rundown)
      }
    }
    throw new NotFoundException(`No Rundown found with a Part for Part id: ${partId}`)
  }

  public async getBasicRundowns(): Promise<BasicRundown[]> {
    return await this.rundownRepository.getBasicRundowns()
  }

  public async saveRundown(rundown: Rundown): Promise<void> {
    this.cachedRundowns.set(rundown.id, rundown)
    await this.rundownRepository.saveRundown(rundown)
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    const wasDeleted: boolean = this.cachedRundowns.delete(rundownId)
    if (!wasDeleted) {
      throw new DeletionFailedException(`Failed to delete rundown from cache, with rundownId: ${rundownId}`)
    }
    await this.rundownRepository.deleteRundown(rundownId)
  }
}
